import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const branch = 'refs/heads/main';
const repositories = {
  '@monochrome-ui/design-system': 'mustafabahaa/monochrome-ui',
  '@agentic-ai/core': 'mustafabahaa/agentic-ai',
};
const runningDirectory = process.cwd();
const runningManifest = readJson(join(runningDirectory, 'package.json'));
let monorepoRoot = runningDirectory;
let rootManifest = runningManifest;
for (let level = 0; level < 3 && !Array.isArray(rootManifest.workspaces); level += 1) {
  monorepoRoot = resolve(monorepoRoot, '..');
  const candidatePath = join(monorepoRoot, 'package.json');
  if (!existsSync(candidatePath)) continue;
  rootManifest = readJson(candidatePath);
}
const isNestedWorkspace = monorepoRoot !== resolve(runningDirectory) && Array.isArray(rootManifest.workspaces);
const cwd = isNestedWorkspace ? monorepoRoot : runningDirectory;
const workspaceFilter = process.argv[2] ?? (isNestedWorkspace ? runningManifest.name : undefined);
if (!isNestedWorkspace) rootManifest = runningManifest;
const isMonorepo = Array.isArray(rootManifest.workspaces);
const lockPath = join(cwd, 'package-lock.json');
const lock = readJson(lockPath);

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function getMainRevision(repository) {
  const remote = execFileSync('git', [
    'ls-remote', '--exit-code', `https://github.com/${repository}.git`, branch,
  ], { encoding: 'utf8', timeout: 30_000 }).trim();
  const [revision, ref] = remote.split(/\s+/);
  if (!/^[a-f0-9]{40}$/.test(revision) || ref !== branch) {
    throw new Error(`Could not resolve ${repository} main.`);
  }
  return revision;
}

function getWorkspaces() {
  if (!isMonorepo) return [{ path: '.', name: rootManifest.name, manifest: rootManifest }];
  const paths = rootManifest.workspaces.flatMap((pattern) => {
    if (pattern.endsWith('/*')) {
      const parent = pattern.slice(0, -2);
      return readdirSync(join(cwd, parent), { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => join(parent, entry.name));
    }
    return [pattern];
  });
  return [{ path: '.', name: rootManifest.name, manifest: rootManifest }, ...paths]
    .filter((workspace) => workspace.path === '.' || existsSync(join(cwd, workspace, 'package.json')))
    .map((workspace) => {
      if (workspace.path === '.') return workspace;
      const manifest = readJson(join(cwd, workspace, 'package.json'));
      return { path: workspace, name: manifest.name, manifest };
    })
    .filter((workspace) => !workspaceFilter || workspace.name === workspaceFilter);
}

function npm(...args) {
  execFileSync(process.execPath, [process.env.npm_execpath, ...args], { cwd, stdio: 'inherit' });
}

function getInstalledResolution(name, workspaceName) {
  const args = ['ls', name, '--depth=0', '--json', '--long'];
  if (isMonorepo && workspaceName !== rootManifest.name) args.push('--workspace', workspaceName);
  const result = spawnSync(process.execPath, [process.env.npm_execpath, ...args], { cwd, encoding: 'utf8' });
  if (result.status !== 0) return '';
  const dependencies = JSON.parse(result.stdout).dependencies ?? {};
  const installed = dependencies[workspaceName]?.dependencies?.[name] ?? dependencies[name];
  return installed?.resolved ?? '';
}

function getLockedResolution(name, workspacePath, lockfile = lock) {
  const candidates = [
    `${workspacePath === '.' ? '' : `${workspacePath}/`}node_modules/${name}`,
    `node_modules/${name}`,
  ];
  const entry = candidates.map((path) => lockfile.packages?.[path]).find(Boolean);
  return entry?.resolved ?? '';
}

try {
  const workspaces = getWorkspaces();
  const targets = workspaces.flatMap((workspace) => Object.entries(repositories)
    .filter(([name]) => name in { ...workspace.manifest.dependencies, ...workspace.manifest.devDependencies })
    .map(([name, repository]) => ({ name, repository, workspace })));
  const revisions = new Map(targets.map(({ name, repository }) => [name, getMainRevision(repository)]));

  for (const target of targets) {
    const { name, repository, workspace } = target;
    const declared = workspace.manifest.dependencies?.[name] ?? workspace.manifest.devDependencies?.[name];
    if (declared !== `github:${repository}#main`) {
      throw new Error(`Set ${name} to github:${repository}#main in ${workspace.path}/package.json.`);
    }
  }

  for (const { name, workspace } of targets) {
    const revision = revisions.get(name);
    const suffix = `#${revision}`;
    const locked = getLockedResolution(name, workspace.path);
    const installed = getInstalledResolution(name, workspace.name);
    if (!locked.endsWith(suffix) || !installed.endsWith(suffix)) {
      console.log(`Syncing ${name} in ${workspace.name} from main…`);
      const args = ['update', name, '--no-audit', '--no-fund'];
      if (isMonorepo && workspace.path !== '.') args.push('--workspace', workspace.name);
      npm(...args);
      const updatedLock = readJson(lockPath);
      const updated = getLockedResolution(name, workspace.path, updatedLock);
      const installedAfterUpdate = getInstalledResolution(name, workspace.name);
      if (!updated.endsWith(suffix) || !installedAfterUpdate.endsWith(suffix)) {
        console.error(`Resolved state: lock=${updated || '(missing)'}, installed=${installedAfterUpdate || '(missing)'}`);
        throw new Error(`${name} in ${workspace.name} did not resolve to ${revision.slice(0, 7)}. Rerun the build to check main again.`);
      }
      lock.packages = updatedLock.packages;
    } else {
      console.log(`${name} in ${workspace.name} is up to date (${revision.slice(0, 7)}).`);
    }
  }
} catch (error) {
  console.error(`Shared dependency sync failed: ${error.message}`);
  process.exitCode = 1;
}

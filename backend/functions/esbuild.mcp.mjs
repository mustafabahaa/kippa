import { build } from 'esbuild';
import { existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Bundles the MCP endpoint together with Kippa's frontend tool code so the
 * exact app implementations run inside the Cloud Function. Browser-only
 * modules are swapped for server shims; every other '@/...' import maps to
 * frontend/web/src.
 */
const root = path.dirname(fileURLToPath(import.meta.url));
const frontendSrc = path.join(root, '..', '..', 'frontend', 'web', 'src');

const shims = {
  '@/config/firebase': path.join(root, 'mcp', 'shims', 'configFirebase.ts'),
  '@/libs/db': path.join(root, 'mcp', 'shims', 'db.ts'),
  'firebase/functions': path.join(root, 'mcp', 'shims', 'functions.ts'),
  'firebase/auth': path.join(root, 'mcp', 'shims', 'auth.ts'),
  'firebase/firestore': path.join(root, 'mcp', 'shims', 'firestore.ts'),
};

const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// '@/libs/db' style imports have no extension; resolve .ts/.tsx/index files manually.
function resolveExisting(base) {
  const candidates = [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')];
  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

const kippaResolver = {
  name: 'kippa-mcp-resolver',
  setup(builder) {
    for (const [specifier, target] of Object.entries(shims)) {
      builder.onResolve({ filter: new RegExp(`^${escape(specifier)}$`) }, () => ({ path: target }));
    }
    builder.onResolve({ filter: /^@\// }, (args) => {
      const resolved = resolveExisting(path.join(frontendSrc, args.path.slice(2)));
      if (!resolved) throw new Error(`Could not resolve ${args.path} inside frontend/web/src`);
      return { path: resolved };
    });
  },
};

await build({
  entryPoints: [path.join(root, 'mcp', 'index.ts')],
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'cjs',
  outfile: path.join(root, 'dist-bundle', 'mcp.cjs'),
  external: ['firebase-admin', 'firebase-admin/*', 'firebase-functions', 'firebase-functions/*'],
  define: { 'import.meta.env.DEV': 'false' },
  plugins: [kippaResolver],
  logLevel: 'info',
});

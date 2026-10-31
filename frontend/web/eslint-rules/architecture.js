import path from 'node:path';

const normalize = (value) => value.replaceAll('\\', '/');
const isFirebaseImport = (source) => source === 'firebase' || source.startsWith('firebase/');

const architectureRules = {
  'no-infrastructure-imports-from-ui': {
    meta: {
      type: 'problem',
      docs: { description: 'Keep Firebase SDK access inside infrastructure adapters and feature services.' },
      schema: [],
      messages: {
        infraImport:
          'Firebase access belongs in config, libs, notifications adapters, or a feature services module; UI should consume those APIs.',
      },
    },
    create(context) {
      const filename = normalize(context.filename);
      const isAdapter =
        /\/src\/(?:config|libs|notifications)\//.test(filename) || /\/src\/features\/[^/]+\/services\//.test(filename);
      if (isAdapter) return {};

      return {
        ImportDeclaration(node) {
          const source = node.source.value;
          if (isFirebaseImport(source) || source === '@/config/firebase') {
            context.report({ node: node.source, messageId: 'infraImport' });
          }
        },
      };
    },
  },
  'feature-public-api': {
    meta: {
      type: 'problem',
      docs: { description: 'Keep feature internals private; cross-feature dependencies use the feature index.' },
      schema: [],
      messages: {
        deepImport: 'Import from the {{feature}} feature public entrypoint (its index.ts), not an internal file.',
      },
    },
    create(context) {
      const sourceRoot = path.resolve(context.cwd, 'src');
      const featuresRoot = path.join(sourceRoot, 'features');
      const filename = path.resolve(context.filename);
      const currentRelative = normalize(path.relative(featuresRoot, filename));
      const currentFeature = currentRelative.split('/')[0];
      if (!currentFeature || currentRelative.startsWith('../')) return {};

      const checkSource = (node) => {
        if (!node.source) return;
        const source = node.source.value;
        let target;
        if (source.startsWith('@/')) target = path.resolve(sourceRoot, source.slice(2));
        else if (source.startsWith('.')) target = path.resolve(path.dirname(filename), source);
        else return;

        const relative = normalize(path.relative(featuresRoot, target));
        if (!relative || relative.startsWith('../') || path.isAbsolute(relative)) return;
        const [targetFeature, ...internalPath] = relative.split('/');
        if (targetFeature === currentFeature || targetFeature === 'shared') return;
        if (internalPath.length === 0 || (internalPath.length === 1 && internalPath[0] === 'index')) return;

        context.report({
          node: node.source,
          messageId: 'deepImport',
          data: { feature: targetFeature },
        });
      };

      return {
        ImportDeclaration: checkSource,
        ExportNamedDeclaration: checkSource,
        ExportAllDeclaration: checkSource,
        ImportExpression(node) {
          if (node.source.type === 'Literal' && typeof node.source.value === 'string') {
            checkSource(node);
          }
        },
      };
    },
  },
};

export default architectureRules;

const prohibitedIconPackages = new Set(['@tabler/icons-react', '@mui/icons-material', 'iconsax-react']);

const appIconRule = {
  meta: {
    type: 'problem',
    docs: { description: 'Use the shared AppIcon adapter instead of importing icon libraries in app features.' },
    schema: [],
    messages: {
      directIconImport:
        'Import icons through @/components/AppIcon; direct icon-library imports bypass the shared icon system.',
    },
  },
  create(context) {
    if (context.filename.replaceAll('\\', '/').endsWith('/components/AppIcon.tsx')) return {};
    return {
      ImportDeclaration(node) {
        if (prohibitedIconPackages.has(node.source.value)) {
          context.report({ node: node.source, messageId: 'directIconImport' });
        }
      },
    };
  },
};

export default {
  'app-icon-only': appIconRule,
};

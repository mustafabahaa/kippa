const prohibitedIconPackages = new Set(['@tabler/icons-react', '@mui/icons-material', 'iconsax-react']);
const allowedMuiUtilities = new Set(['@mui/material/styles']);

const visualStyleKeys = new Set([
  'color',
  'bgcolor',
  'background',
  'backgroundColor',
  'backgroundImage',
  'border',
  'borderColor',
  'borderRadius',
  'borderStyle',
  'borderWidth',
  'boxShadow',
  'shadow',
  'opacity',
  'font',
  'fontFamily',
  'fontSize',
  'fontStyle',
  'fontWeight',
  'letterSpacing',
  'lineHeight',
  'textDecoration',
  'textShadow',
  'textTransform',
  'outline',
  'filter',
]);

const designSystemRules = {
  'no-direct-ui-imports': {
    meta: {
      type: 'problem',
      docs: { description: 'Route application UI imports through the shared design-system package.' },
      schema: [],
      messages: {
        directUiImport: 'Import UI components from @monochrome-ui/design-system; direct MUI component imports bypass the shared package.',
      },
    },
    create(context) {
      return {
        ImportDeclaration(node) {
          const source = node.source.value;
          if (!source.startsWith('@mui/material') || allowedMuiUtilities.has(source)) return;
          if (node.importKind === 'type' || node.specifiers.every((specifier) => specifier.importKind === 'type')) return;
          context.report({ node: node.source, messageId: 'directUiImport' });
        },
      };
    },
  },
  'app-icon-only': {
    meta: {
      type: 'problem',
      docs: { description: 'Use the shared AppIcon adapter instead of importing icon libraries in app features.' },
      schema: [],
      messages: {
        directIconImport: 'Import icons through @/components/AppIcon; direct icon-library imports bypass the shared icon system.',
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
  },
  'no-visual-sx': {
    meta: {
      type: 'problem',
      docs: { description: 'Keep feature appearance in named design-system variants, not local sx overrides.' },
      schema: [],
      messages: {
        visualOverride: "'{{key}}' sets component appearance. Add or use a named design-system variant instead of sx.",
      },
    },
    create(context) {
      if (context.filename.replaceAll('\\', '/').endsWith('/components/AppIcon.tsx')) return {};
      const sourceCode = context.sourceCode;

      const resolve = (node, seen = new Set()) => {
        if (!node || seen.has(node)) return node;
        seen.add(node);
        if (node.type === 'Identifier') {
          let scope = sourceCode.getScope(node);
          let variable;
          while (scope && !variable) {
            variable = scope.set.get(node.name);
            scope = scope.upper;
          }
          const initializer = variable?.defs.find((definition) => definition.type === 'Variable')?.node.init;
          return initializer ? resolve(initializer, seen) : node;
        }
        if (node.type === 'MemberExpression' && !node.computed && node.object.type === 'Identifier') {
          let scope = sourceCode.getScope(node);
          let variable;
          while (scope && !variable) {
            variable = scope.set.get(node.object.name);
            scope = scope.upper;
          }
          const initializer = variable?.defs.find((definition) => definition.type === 'Variable')?.node.init;
          if (initializer?.type === 'ObjectExpression') {
            const member = initializer.properties.find((property) =>
              property.type === 'Property' && (property.key.name ?? property.key.value) === node.property.name,
            );
            if (member) return resolve(member.value, seen);
          }
        }
        if (node.type === 'TSAsExpression' || node.type === 'TSSatisfiesExpression' || node.type === 'ParenthesizedExpression') {
          return resolve(node.expression, seen);
        }
        return node;
      };

      const inspect = (node) => {
        node = resolve(node);
        if (!node) return;
        if (node.type === 'ObjectExpression') {
          for (const property of node.properties) {
            if (property.type === 'SpreadElement') {
              inspect(property.argument);
              continue;
            }
            if (property.type !== 'Property') continue;
            const key = property.key.name ?? property.key.value;
            if (typeof key === 'string' && visualStyleKeys.has(key)) {
              context.report({ node: property.key, messageId: 'visualOverride', data: { key } });
            }
            inspect(property.value);
          }
          return;
        }
        if (node.type === 'ArrayExpression') {
          node.elements.forEach(inspect);
          return;
        }
        if (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression') inspect(node.body);
        if (node.type === 'BlockStatement') node.body.forEach(inspect);
        if (node.type === 'ReturnStatement') inspect(node.argument);
        if (node.type === 'ConditionalExpression') {
          inspect(node.consequent);
          inspect(node.alternate);
        }
        if (node.type === 'LogicalExpression') {
          inspect(node.left);
          inspect(node.right);
        }
      };

      return {
        JSXAttribute(node) {
          if (node.name.type !== 'JSXIdentifier' || node.name.name !== 'sx') return;
          if (node.value?.type === 'JSXExpressionContainer') inspect(node.value.expression);
        },
        Property(node) {
          if (node.key.name === 'sx' || node.key.value === 'sx') inspect(node.value);
        },
      };
    },
  },
  'named-typography-variants': {
    meta: {
      type: 'problem',
      docs: { description: 'Use named typography variants instead of one-off visual props on Typography.' },
      schema: [],
      messages: {
        adHocTypography: "'{{prop}}' is an ad hoc typography style. Define or use a named Typography variant.",
      },
    },
    create(context) {
      const typographyStyleProps = new Set(['fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'textTransform']);
      return {
        JSXAttribute(node) {
          if (
            node.name.type !== 'JSXIdentifier' ||
            !typographyStyleProps.has(node.name.name) ||
            node.parent?.name?.type !== 'JSXIdentifier' ||
            node.parent.name.name !== 'Typography'
          ) return;
          context.report({
            node: node.name,
            messageId: 'adHocTypography',
            data: { prop: node.name.name },
          });
        },
      };
    },
  },
};

export default designSystemRules;

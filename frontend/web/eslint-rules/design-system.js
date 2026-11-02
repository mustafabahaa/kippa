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

const buttonLoadingPropRule = {
  meta: {
    type: 'problem',
    docs: { description: 'Require shared button loading state for async actions and forbid inline spinner controls.' },
    schema: [],
    messages: {
      inlineButtonSpinner: 'Use the shared Button or IconButton `loading` prop instead of rendering CircularProgress inside the control.',
      asyncActionMissingLoading: 'Async Button and IconButton actions must expose their pending state through the shared `loading` prop.',
    },
  },
  create(context) {
    const buttonNames = new Set();
    const progressNames = new Set();
    const sourceCode = context.sourceCode;

    const resolveDefinition = (node) => {
      if (node?.type !== 'Identifier') return null;
      let scope = sourceCode.getScope(node);
      let variable;
      while (scope && !variable) {
        variable = scope.set.get(node.name);
        scope = scope.upper;
      }
      const definition = variable?.defs.find((item) => item.type === 'Variable' || item.type === 'FunctionName');
      return definition?.type === 'Variable' ? definition.node.init : definition?.node ?? null;
    };

    const isAsyncAction = (node, seen = new Set(), depth = 0) => {
      if (!node || depth > 12 || seen.has(node)) return false;
      seen.add(node);
      if (node.type === 'Identifier') return isAsyncAction(resolveDefinition(node), seen, depth + 1);
      if (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration') {
        return node.async || containsAsyncCall(node.body, seen, depth + 1);
      }
      if (node.type === 'CallExpression') {
        const callee = node.callee;
        if (
          callee.type === 'MemberExpression' && !callee.computed && callee.property.type === 'Identifier' &&
          /^(?:mutate|mutateAsync|.*Async)$/.test(callee.property.name)
        ) return true;
        if (callee.type === 'Identifier' && ['useCallback', 'useMemo'].includes(callee.name)) {
          return node.arguments.some((argument) => isAsyncAction(argument, seen, depth + 1));
        }
        return isAsyncAction(callee, seen, depth + 1);
      }
      if (node.type === 'AwaitExpression' || node.type === 'UnaryExpression') return isAsyncAction(node.argument, seen, depth + 1);
      if (node.type === 'ConditionalExpression' || node.type === 'LogicalExpression') {
        return isAsyncAction(node.consequent ?? node.left, seen, depth + 1) || isAsyncAction(node.alternate ?? node.right, seen, depth + 1);
      }
      return false;
    };

    const containsAsyncCall = (node, seen = new Set(), depth = 0) => {
      if (!node || typeof node !== 'object' || depth > 32 || seen.has(node)) return false;
      seen.add(node);
      if (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration') return false;
      if (node.type === 'AwaitExpression') return true;
      if (node.type === 'CallExpression' && isAsyncAction(node, new Set(), depth + 1)) return true;
      return Object.entries(node).some(([key, value]) => {
        if (key === 'parent' || key === 'loc' || key === 'range' || key === 'tokens' || key === 'comments') return false;
        return Array.isArray(value)
          ? value.some((child) => containsAsyncCall(child, seen, depth + 1))
          : containsAsyncCall(value, seen, depth + 1);
      });
    };

    const containsProgress = (node, seen = new Set()) => {
      if (!node || seen.has(node)) return false;
      seen.add(node);

      if (node.type === 'Identifier') {
        let scope = sourceCode.getScope(node);
        let variable;
        while (scope && !variable) {
          variable = scope.set.get(node.name);
          scope = scope.upper;
        }
        const initializer = variable?.defs.find((definition) => definition.type === 'Variable')?.node.init;
        return initializer ? containsProgress(initializer, seen) : false;
      }
      if (node.type === 'JSXElement') {
        const name = node.openingElement.name;
        if (name.type === 'JSXIdentifier' && progressNames.has(name.name)) return true;
        return node.openingElement.attributes.some((attribute) =>
          attribute.type === 'JSXAttribute' && containsProgress(attribute.value, seen),
        ) || node.children.some((child) => containsProgress(child, seen));
      }
      if (node.type === 'JSXFragment') return node.children.some((child) => containsProgress(child, seen));
      if (node.type === 'JSXExpressionContainer') return containsProgress(node.expression, seen);
      if (node.type === 'ConditionalExpression') {
        return containsProgress(node.consequent, seen) || containsProgress(node.alternate, seen);
      }
      if (node.type === 'LogicalExpression' || node.type === 'BinaryExpression') {
        return containsProgress(node.left, seen) || containsProgress(node.right, seen);
      }
      if (node.type === 'ArrayExpression') return node.elements.some((element) => containsProgress(element, seen));
      if (node.type === 'ObjectExpression') {
        return node.properties.some((property) => property.type === 'Property' && containsProgress(property.value, seen));
      }
      if (node.type === 'TSAsExpression' || node.type === 'TSSatisfiesExpression' || node.type === 'ParenthesizedExpression') {
        return containsProgress(node.expression, seen);
      }
      return false;
    };

    return {
      ImportDeclaration(node) {
        if (node.source.value !== '@monochrome-ui/design-system') return;
        for (const specifier of node.specifiers) {
          if (specifier.type !== 'ImportSpecifier') continue;
          const importedName = specifier.imported.name ?? specifier.imported.value;
          if (importedName === 'Button' || importedName === 'IconButton') buttonNames.add(specifier.local.name);
          if (importedName === 'CircularProgress') progressNames.add(specifier.local.name);
        }
      },
      JSXElement(node) {
        const name = node.openingElement.name;
        if (name.type !== 'JSXIdentifier' || !buttonNames.has(name.name)) return;
        const attributes = node.openingElement.attributes;
        const hasLoadingProp = attributes.some((attribute) =>
          attribute.type === 'JSXAttribute' && attribute.name.type === 'JSXIdentifier' && attribute.name.name === 'loading',
        );
        const onClick = attributes.find((attribute) =>
          attribute.type === 'JSXAttribute' && attribute.name.type === 'JSXIdentifier' && attribute.name.name === 'onClick',
        );
        let actionNode = onClick ?? node.openingElement;
        let clickHandler = onClick?.value?.type === 'JSXExpressionContainer' ? onClick.value.expression : null;
        if (!clickHandler) {
          const typeAttribute = attributes.find((attribute) =>
            attribute.type === 'JSXAttribute' && attribute.name.type === 'JSXIdentifier' && attribute.name.name === 'type',
          );
          const typeValue = typeAttribute?.value?.type === 'Literal'
            ? typeAttribute.value.value
            : typeAttribute?.value?.type === 'JSXExpressionContainer'
              ? typeAttribute.value.expression.value
              : null;
          if (typeValue === 'submit') {
            actionNode = typeAttribute ?? node.openingElement;
            let ancestor = node.parent;
            while (ancestor && ancestor.type !== 'Program') {
              if (ancestor.type === 'JSXElement') {
                const formName = ancestor.openingElement.name;
                const componentAttribute = ancestor.openingElement.attributes.find((attribute) =>
                  attribute.type === 'JSXAttribute' && attribute.name.type === 'JSXIdentifier' && attribute.name.name === 'component',
                );
                const componentValue = componentAttribute?.value?.type === 'Literal'
                  ? componentAttribute.value.value
                  : componentAttribute?.value?.type === 'JSXExpressionContainer'
                    ? componentAttribute.value.expression.value
                    : null;
                if ((formName.type === 'JSXIdentifier' && formName.name === 'form') || componentValue === 'form') {
                  const submitAttribute = ancestor.openingElement.attributes.find((attribute) =>
                    attribute.type === 'JSXAttribute' && attribute.name.type === 'JSXIdentifier' && attribute.name.name === 'onSubmit',
                  );
                  clickHandler = submitAttribute?.value?.type === 'JSXExpressionContainer' ? submitAttribute.value.expression : null;
                  break;
                }
              }
              ancestor = ancestor.parent;
            }
          }
        }
        if (!hasLoadingProp && clickHandler && isAsyncAction(clickHandler)) {
          context.report({ node: actionNode, messageId: 'asyncActionMissingLoading' });
        }
        const hasInlineProgress = node.openingElement.attributes.some((attribute) =>
          attribute.type === 'JSXAttribute' && containsProgress(attribute.value),
        ) || node.children.some((child) => containsProgress(child));
        if (hasInlineProgress) {
          context.report({ node: node.openingElement, messageId: 'inlineButtonSpinner' });
        }
      },
    };
  },
};

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
  'button-loading-prop': buttonLoadingPropRule,
};

export default designSystemRules;

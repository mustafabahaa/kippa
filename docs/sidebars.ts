import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  mainSidebar: [
    'intro',
    'getting-started',
    {
      type: 'category',
      label: 'Product',
      items: ['product-spec', 'ux-flows', 'dashboard-calculations', 'notifications'],
    },
    {
      type: 'category',
      label: 'Engineering',
      items: ['architecture-and-folder-structure', 'firebase-architecture', 'data-model'],
    },
    'design-system',
  ],
};

export default sidebars;

import type { Config } from '@docusaurus/types';
import type { Preset } from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Kippa Docs',
  tagline: 'Product, architecture, and implementation guidance for Kippa.',
  favicon: 'img/favicon.svg',
  url: 'https://mustafabahaa.github.io',
  baseUrl: '/kippa/docs/',
  organizationName: 'mustafabahaa',
  projectName: 'kippa',
  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  trailingSlash: false,
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/mustafabahaa/kippa/edit/main/docs/',
          showLastUpdateTime: true,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    image: 'img/kippa-logo.png',
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Kippa Docs',
      logo: {
        alt: 'Kippa',
        src: 'img/favicon.svg',
      },
      items: [
        { type: 'docSidebar', sidebarId: 'mainSidebar', position: 'left', label: 'Guides' },
        { href: 'https://mustafabahaa.github.io/kippa/', label: 'Landing', position: 'right' },
        { href: 'https://YOUR_FIREBASE_PROJECT_ID.web.app', label: 'Open app', position: 'right' },
        { href: 'https://github.com/mustafabahaa/kippa', label: 'GitHub', position: 'right' },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Product',
          items: [
            { label: 'Kippa landing', href: 'https://mustafabahaa.github.io/kippa/' },
            { label: 'Open Kippa', href: 'https://YOUR_FIREBASE_PROJECT_ID.web.app' },
          ],
        },
        {
          title: 'Documentation',
          items: [
            { label: 'Getting started', to: '/getting-started' },
            { label: 'Product spec', to: '/product-spec' },
            { label: 'Data model', to: '/data-model' },
          ],
        },
        {
          title: 'Project',
          items: [
            { label: 'GitHub', href: 'https://github.com/mustafabahaa/kippa' },
            { label: 'Architecture', to: '/architecture-and-folder-structure' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Kippa. Built with Docusaurus.`,
    },
    prism: {
      additionalLanguages: ['bash', 'json'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;

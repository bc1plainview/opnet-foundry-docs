import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://opnet-foundry.vercel.app',
  legacy: {
    collections: true,
  },
  integrations: [
    starlight({
      title: 'OPNet Foundry',
      description: 'Build, test, and deploy OPNet smart contracts.',
      favicon: '/favicon.svg',
      logo: {
        src: './src/assets/logo.svg',
        replacesTitle: true,
      },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/bc1plainview/opnet-foundry-docs' },
      ],
      head: [
        {
          tag: 'meta',
          attrs: { name: 'theme-color', content: '#0a0a0f' },
        },
        {
          tag: 'meta',
          attrs: { property: 'og:type', content: 'website' },
        },
        {
          tag: 'meta',
          attrs: { property: 'og:site_name', content: 'OPNet Foundry' },
        },
        {
          tag: 'meta',
          attrs: { property: 'og:title', content: 'OPNet Foundry -- Build, test, and deploy OPNet smart contracts' },
        },
        {
          tag: 'meta',
          attrs: { property: 'og:description', content: 'The complete development toolchain for OPNet smart contracts on Bitcoin. op-forge, op-cast, op-anvil, op-chisel.' },
        },
        {
          tag: 'meta',
          attrs: { name: 'twitter:card', content: 'summary_large_image' },
        },
        {
          tag: 'meta',
          attrs: { name: 'twitter:title', content: 'OPNet Foundry -- Build, test, and deploy OPNet smart contracts' },
        },
        {
          tag: 'meta',
          attrs: { name: 'twitter:description', content: 'The complete development toolchain for OPNet smart contracts on Bitcoin. op-forge, op-cast, op-anvil, op-chisel.' },
        },
      ],
      customCss: [
        './src/styles/custom.css',
      ],
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Installation', slug: 'getting-started/installation' },
            { label: 'Your First Project', slug: 'getting-started/first-project' },
          ],
        },
        {
          label: 'op-forge',
          items: [
            { label: 'Overview', slug: 'forge' },
            {
              label: 'Commands',
              items: [
                { label: 'init', slug: 'forge/commands/init' },
                { label: 'build', slug: 'forge/commands/build' },
                { label: 'test', slug: 'forge/commands/test' },
                { label: 'create (deploy)', slug: 'forge/commands/create' },
                { label: 'deploy', slug: 'forge/commands/deploy' },
                { label: 'clean', slug: 'forge/commands/clean' },
                { label: 'config', slug: 'forge/commands/config' },
                { label: 'inspect', slug: 'forge/commands/inspect' },
                { label: 'install', slug: 'forge/commands/install' },
                { label: 'snapshot', slug: 'forge/commands/snapshot' },
              ],
            },
          ],
        },
        {
          label: 'op-cast',
          items: [
            { label: 'Overview', slug: 'cast' },
          ],
        },
        {
          label: 'op-anvil',
          items: [
            { label: 'Overview', slug: 'anvil' },
          ],
        },
        {
          label: 'op-chisel',
          items: [
            { label: 'Overview', slug: 'chisel' },
          ],
        },
        {
          label: 'Configuration',
          items: [
            { label: 'opnet.toml Reference', slug: 'configuration/opnet-toml' },
            { label: 'Profiles', slug: 'configuration/profiles' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'FAQ', slug: 'reference/faq' },
            { label: 'Troubleshooting', slug: 'reference/troubleshooting' },
          ],
        },
      ],
    }),
  ],
});

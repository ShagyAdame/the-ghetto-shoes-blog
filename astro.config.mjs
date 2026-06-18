import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { rehypeImageBase } from './src/lib/rehype-image-base.mjs';

// Only prefix image paths during production builds (not dev server)
const isProduction = process.env.NODE_ENV === 'production';

// https://astro.build/config
export default defineConfig({
  site: 'https://shagyadame.github.io/the-ghetto-shoes-blog',
  base: '/the-ghetto-shoes-blog',
  integrations: [mdx(), sitemap()],
  markdown: {
    rehypePlugins: isProduction
      ? [rehypeImageBase('/the-ghetto-shoes-blog')]
      : [],
  },
});

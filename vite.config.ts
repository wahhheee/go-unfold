import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';
import rehypeShiki from '@shikijs/rehype';
import type { RehypeShikiOptions } from '@shikijs/rehype';
import { bundledLanguages } from 'shiki';
import { redisLanguage } from './src/content/redis-language.ts';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';

const highlighting: RehypeShikiOptions = {
  themes: { light: 'github-light', dark: 'github-dark-default' },
  defaultColor: false,
  lazy: true,
  langs: [...Object.values(bundledLanguages), redisLanguage],
  transformers: [
    {
      pre(node) {
        node.properties['data-language'] = this.options.lang;
      },
    },
  ],
  onError(error) {
    throw error;
  },
};

export default defineConfig({
  plugins: [
    {
      enforce: 'pre',
      ...mdx({
        providerImportSource: '@mdx-js/react',
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug, [rehypeShiki, highlighting]],
      }),
    },
    react(),
  ],
});

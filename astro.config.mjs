// Astro 配置文件，负责全局构建与 Markdown 渲染等设置
import { defineConfig } from 'astro/config';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  outDir: './dist',
  viewTransitions: {
    fallback: 'animate',
  },
  integrations: [],
  vite: {
    plugins: [tailwindcss()],
    build: {
      assetsInlineLimit: 4096, // 4KB
    },
  },

  build: {
    assets: '_assets',
    format: 'directory',
    // concurrency: 1, // 默认值，通常不需要修改
  },

  trailingSlash: 'always',

  markdown: {
    syntaxHighlight: 'shiki',
    shikiConfig: {
      themes: {
        light: 'gruvbox-light-medium',
        dark: 'gruvbox-dark-medium',
      },
      wrap: true,
    },
    smartypants: true,
    remarkPlugins: [],
    rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings]
  },

  cacheDir: './.astro/', // 添加缓存目录
});

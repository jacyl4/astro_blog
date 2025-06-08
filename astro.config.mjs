// Astro 配置文件，负责全局构建与 Markdown 渲染等设置
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
// https://astro.build/config
export default defineConfig({
  outDir: './dist',
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
      theme: 'gruvbox-light-medium'
    },
    smartypants: true,
    remarkPlugins: [],
    rehypePlugins: []
  },

  cacheDir: './.astro/', // 添加缓存目录

  experimental: {
    responsiveImages: true, // 启用响应式图片
  },
});

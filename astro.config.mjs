// Astro 配置文件，负责全局构建与 Markdown 渲染等设置
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
// https://astro.build/config
export default defineConfig({
  outDir: './dist',
  integrations: [],
  vite: {
    plugins: [tailwindcss()],
  },

  build: {
    assets: '_assets',
    format: 'directory'
  },

  trailingSlash: 'always',

  markdown: {
    syntaxHighlight: 'shiki', // 切换到 Shiki
    smartypants: true,
    remarkPlugins: [],
    rehypePlugins: []
  }
});

// Astro 配置文件，负责全局构建与 Markdown 渲染等设置
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  outDir: './dist',

  build: {
    assets: '_assets',
    format: 'directory'
  },

  trailingSlash: 'always',

  markdown: {
    syntaxHighlight: 'prism',
    smartypants: true,
    remarkPlugins: [],
    rehypePlugins: []
  }
});

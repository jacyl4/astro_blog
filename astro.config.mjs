// Astro 配置文件，负责全局构建与 Markdown 渲染等设置
import { defineConfig } from 'astro/config';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import tailwindcss from '@tailwindcss/vite';
import swup from '@swup/astro';
import { VitePWA } from 'vite-plugin-pwa';

// https://astro.build/config
export default defineConfig({
  outDir: './dist',
  integrations: [swup({
    morph: ['#main-content']
  })],
  vite: {
    plugins: [
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        manifest: {
          name: 'Astro Blog',
          short_name: 'AstroBlog',
          description: 'My awesome Astro blog with PWA!',
          theme_color: '#ffffff',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
        workbox: {
          // workbox options for injectManifest
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
        },
      }),
    ],
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

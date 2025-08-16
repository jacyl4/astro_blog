// Astro 配置文件，负责全局构建与 Markdown 渲染等设置
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import swup from '@swup/astro';
import SwupMorphPlugin from 'swup-morph-plugin';
import { VitePWA } from 'vite-plugin-pwa';
import icon from 'astro-icon';

// Markdown/HTML 处理插件
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { defaultSchema } from 'hast-util-sanitize';
import remarkFootnotes from 'remark-footnotes';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkBreaks from 'remark-breaks';
import remarkUnwrapImages from 'remark-unwrap-images';
import remarkWikiLink from 'remark-wiki-link';
import { slugify as slugifyTrans } from 'transliteration';
import remarkCallouts from './src/utils/remark-callouts.js';

// https://astro.build/config
export default defineConfig({
  outDir: './dist',
  integrations: [
    icon({
      include: {
        lucide: ['arrow-right'],
      },
    }),
    swup({
      containers: ['#swup'],
      plugins: [new SwupMorphPlugin()],
    }),
  ],
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
    remarkPlugins: [
      remarkFootnotes,
      remarkGfm, // GFM: 表格、任务列表、自动链接、删除线
      remarkBreaks, // 单换行视为 <br>（宽容处理松散换行）
      remarkUnwrapImages, // 取消图片被 <p> 包裹，便于样式控制
      remarkMath, // 支持 $ 行内 / $$ 块级 公式
      [
        remarkWikiLink,
        {
          aliasDivider: '|',
          pageResolver: (name) => [slugifyTrans(name, { lowercase: true, separator: '-' })],
          hrefTemplate: (permalink) => `/posts/${permalink}/`,
        },
      ],
      remarkCallouts, // 解析 Obsidian 风格 > [!note] 等 callout
    ],
    rehypePlugins: [
      // 按顺序：先处理原始 HTML，再做安全过滤
      rehypeRaw,
      [
        rehypeSanitize,
        {
          ...defaultSchema,
          attributes: {
            ...defaultSchema.attributes,
            '*': [
              ...(defaultSchema.attributes && defaultSchema.attributes['*'] ? defaultSchema.attributes['*'] : []),
              'className',
              'style',
              ['data-*', true],
            ],
          },
        },
      ],
      rehypeSlug, // 为标题生成 id
      [
        rehypeAutolinkHeadings,
        { behavior: 'wrap' },
      ],
      rehypeKatex, // 将 remark-math 渲染为 KaTeX
    ],
  },

  cacheDir: './.astro/', // 添加缓存目录
});

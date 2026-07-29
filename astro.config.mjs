// Astro configuration file - handles global build and Markdown rendering settings
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import swup from '@swup/astro';
import SwupMorphPlugin from 'swup-morph-plugin';
import icon from 'astro-icon';
import { unified } from '@astrojs/markdown-remark';
import nativePwa from './tools/pwa/integration.ts';

// Markdown/HTML processing plugins
import rehypeSlug from 'rehype-slug';
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
import remarkCallouts from './src/utils/remark-callouts.ts';

const IGNORE_REMOTE_IMPORTS_WARNING = (
  warning,
  defaultHandler
) => {
  if (
    warning.code === 'UNUSED_EXTERNAL_IMPORT' &&
    warning.message?.includes('@astrojs/internal-helpers/remote') &&
    warning.message?.includes('matchHostname')
  ) {
    return;
  }
  defaultHandler(warning);
};

// https://astro.build/config
export default defineConfig({
  outDir: './dist',
  // Preserve Astro 5 whitespace semantics; Astro 7 defaults to JSX-style
  // compression, which strips significant spacing around inline metadata.
  compressHTML: true,
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
    nativePwa(),
  ],
  server: {
    host: true,
    allowedHosts: true,
  },
  vite: {
    plugins: [
      tailwindcss(),
    ],
    build: {
      assetsInlineLimit: 4096, // 4KB
      rollupOptions: {
        onwarn: IGNORE_REMOTE_IMPORTS_WARNING,
      },
    },
  },

  build: {
    assets: '_assets',
    format: 'directory',
    // concurrency: 1, // Default value; usually does not need to be changed
  },

  trailingSlash: 'always',

  markdown: {
    syntaxHighlight: 'shiki',
    shikiConfig: {
      theme: 'gruvbox-dark-medium',
      wrap: true,
    },
    processor: unified({
      smartypants: true,
      remarkPlugins: [
        remarkFootnotes,
        remarkGfm, // GFM: tables, task lists, autolinks, strikethrough
        remarkBreaks, // Treat single line breaks as <br> (lenient handling of loose newlines)
        remarkUnwrapImages, // Remove <p> wrapper around images to simplify styling
        remarkMath, // Support $ inline / $$ block math
        [
          remarkWikiLink,
          {
            aliasDivider: '|',
            pageResolver: (name) => [slugifyTrans(name, { lowercase: true, separator: '-' })],
            hrefTemplate: (permalink) => `/posts/${permalink}/`,
          },
        ],
        remarkCallouts, // Parse Obsidian-style callouts like > [!note]
      ],
      rehypePlugins: [
        // Order: first process raw HTML, then apply sanitization
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
        rehypeSlug, // Generate id attributes for headings
        rehypeKatex, // Render remark-math using KaTeX
      ],
    }),
  },

  cacheDir: './.astro/', // Add cache directory
});

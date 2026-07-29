import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blogBase = process.env.BLOG_CONTENT_SOURCE === 'legacy'
  ? './src/content/blog'
  : './.build/content/blog';

const blogCollection = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: blogBase,
  }),
  schema: z.object({
    id: z.string().optional(),
    slug: z.string().optional(),
    title: z.string(),
    originalTitle: z.string().optional(),
    created: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    category: z.string().optional(),
  }),
});

const pagesCollection = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/pages',
  }),
  schema: z.object({
    title: z.string(),
  }),
});

export const collections = {
  blog: blogCollection,
  pages: pagesCollection,
};

import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  type: 'content', // 'content' for Markdown/MDX, 'data' for JSON/YAML
  schema: () =>
    z.object({
      title: z.string().optional(),
      created: z.coerce.date().optional(), // creation date
      tags: z.array(z.string()).optional(), // tags
    }),
});

const pagesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
  }),
});

export const collections = {
  blog: blogCollection,
  pages: pagesCollection,
};

import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  type: 'content', // 'content' for Markdown/MDX, 'data' for JSON/YAML
  schema: () =>
    z.object({
      title: z.string().optional(),
      created: z.coerce.date().optional(), // 创建日期
      tags: z.array(z.string()).optional(), // 标签
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

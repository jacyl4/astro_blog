import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  type: 'content', // 'content' for Markdown/MDX, 'data' for JSON/YAML
  schema: () => z.object({
    title: z.string().optional(),
    creation_date: z.coerce.date().optional(), // 创建日期
    description: z.string().optional(), // 对应原来的 excerpt
    tags: z.array(z.string()).optional(), // 标签
  }),
});

export const collections = {
  blog: blogCollection,
};

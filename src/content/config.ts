import { defineCollection, z } from 'astro:content';
import { slugify } from '../utils/stringUtils';

const blogCollection = defineCollection({
  type: 'content', // 'content' for Markdown/MDX, 'data' for JSON/YAML
  schema: () =>
    z
      .object({
        title: z.string().optional(),
        created: z.coerce.date().optional(), // 创建日期
        description: z.string().optional(), // 对应原来的 excerpt
        tags: z.array(z.string()).optional(), // 标签
        slug: z.string().optional(),
      })
      .transform((data) => ({ ...data, slug: data.title ? slugify(data.title) : undefined })),
});

export const collections = {
  blog: blogCollection,
};

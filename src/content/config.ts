import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  type: 'content', // 'content' for Markdown/MDX, 'data' for JSON/YAML
  schema: ({ image }) => z.object({
    title: z.string(),
    pubDate: z.coerce.date(), // 将字符串转换为 Date 对象
    description: z.string().optional(), // 对应原来的 excerpt
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    // 如果有封面图片，可以这样定义
    // cover: image().optional(),
    // coverAlt: z.string().optional(),
  }),
});

export const collections = {
  blog: blogCollection,
};

import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  type: 'content', // 'content' for Markdown/MDX, 'data' for JSON/YAML
  schema: ({ image }) => z.object({
    title: z.string().optional(),
    createDate: z.coerce.date(), // 创建日期
    description: z.string().optional(), // 对应原来的 excerpt
    categories: z.array(z.string()).optional(), // 分类
    tags: z.array(z.string()).optional(), // 标签
    // 如果有封面图片，可以这样定义
    cover: image().optional(),
    coverAlt: z.string().optional(),
  }),
});

export const collections = {
  blog: blogCollection,
};

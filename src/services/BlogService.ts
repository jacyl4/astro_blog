// 博客业务服务：负责 Markdown 读取、解析、聚合、标签分类等核心逻辑
// 遵循单一职责与高内聚低耦合原则
import { getCollection, getEntry, render } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import { slugify } from '../utils/stringUtils';

// 定义 BlogPost 接口，与 Content Collections 的 Entry 兼容
export interface BlogPost {
  id: string; // Content Collection Entry 的 ID
  slug: string; // Content Collection Entry 的 slug
  body: string; // 渲染后的 HTML 内容
  data: { // Frontmatter 数据
    title: string;
    pubDate: Date;
    description?: string;
    category?: string;
    tags?: string[];
  };
  // 额外添加的字段，例如 excerptHtml
  excerptHtml?: string;
}

export interface BlogCategory {
  name: string;
  slug: string;
  count: number;
}

// 缓存所有文章，避免重复读取和解析
let cachedPosts: BlogPost[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 缓存有效期 5 分钟 (开发模式下可以更短或禁用)

export async function getAllPosts(): Promise<BlogPost[]> {
  const now = Date.now();
  if (cachedPosts && (now - cacheTimestamp < CACHE_DURATION)) {
    console.log('[BlogService - getAllPosts] Returning cached posts.');
    return cachedPosts;
  }

  try {
    const allEntries = await getCollection('blog');

    const posts: BlogPost[] = await Promise.all(
      allEntries.map(async (entry) => {
        const { Content, remarkPluginFrontmatter } = await render(entry);
        // Content Collections 默认不提供 excerpt，可以从 description 或手动截取
        const excerptHtml = entry.data.description || ''; // 假设 description 作为摘要

        return {
          id: entry.id,
          slug: entry.slug,
          body: Content.toString(), // Content 是一个 Astro Component，需要转换为字符串
          data: entry.data,
          excerptHtml: excerptHtml,
        };
      })
    );

    console.log(`[BlogService - getAllPosts] Found ${posts.length} posts. Titles: ${posts.map(p => p.data.title).join(', ')}`);
    // 按日期排序，最新的在前面
    const sortedPosts = posts.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
    cachedPosts = sortedPosts;
    cacheTimestamp = now;
    return sortedPosts;
  } catch (error) {
    console.error('Error reading blog posts from Content Collections:', error);
    cachedPosts = [];
    cacheTimestamp = 0;
    return [];
  }
}

export async function getPostsByCategory(category: string): Promise<BlogPost[]> {
  const allPosts = await getAllPosts();
  return allPosts.filter(post => post.data.category?.toLowerCase() === category.toLowerCase());
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const allPosts = await getAllPosts(); // 获取所有文章以进行 slug 匹配
  const post = allPosts.find(post => post.slug === slug); // 直接使用 slug 匹配

  if (post) {
    console.log(`[BlogService - getPostBySlug] Found post for slug: "${slug}"`);
  } else {
    console.log(`[BlogService - getPostBySlug] NO MATCH FOUND for URL slug: "${slug}"`);
    const availableSlugs = allPosts.map(p => `"${p.slug}" (Length: ${p.slug.length})`);
    console.log(`[BlogService - getPostBySlug] All available generated slugs: [${availableSlugs.join(', ')}]`);
  }
  
  return post || null;
}

export async function getAllCategories(): Promise<BlogCategory[]> {
  const allPosts = await getAllPosts();
  const categoriesMap = new Map<string, number>();
  
  allPosts.forEach(post => {
    if (post.data.category) {
      const count = categoriesMap.get(post.data.category) || 0;
      categoriesMap.set(post.data.category, count + 1);
    }
  });
  
  const categories: BlogCategory[] = [];
  categoriesMap.forEach((count, name) => {
    categories.push({
      name,
      slug: slugify(name),
      count
    });
  });
  
  return categories;
}

export async function getAllTags(): Promise<{name: string, slug: string, count: number}[]> {
  const allPosts = await getAllPosts();
  const tagsMap = new Map<string, number>();
  
  allPosts.forEach(post => {
    if (post.data.tags && post.data.tags.length > 0) {
      post.data.tags.forEach(tag => {
        const count = tagsMap.get(tag) || 0;
        tagsMap.set(tag, count + 1);
      });
    }
  });
  
  const tags: {name: string, slug: string, count: number}[] = [];
  tagsMap.forEach((count, name) => {
    tags.push({
      name,
      slug: slugify(name),
      count
    });
  });
  
  return tags;
}

export async function getPostsByTag(tag: string): Promise<BlogPost[]> {
  const allPosts = await getAllPosts();
  return allPosts.filter(post => 
    post.data.tags && post.data.tags.some(t => 
      t.toLowerCase() === tag.toLowerCase() || slugify(t) === tag.toLowerCase()
    )
  );
}

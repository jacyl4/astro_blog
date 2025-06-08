// 博客业务服务：负责 Markdown 读取、解析、聚合、标签分类等核心逻辑
// 遵循单一职责与高内聚低耦合原则
import { getCollection, render } from 'astro:content';
import { slugify } from '../utils/stringUtils';
import type { BlogPost } from '../interfaces/BlogPost'; // 导入 BlogPost 接口

// 定义一个完整的博客文章条目类型，包含 Content Collections 的所有字段
export interface FullBlogPostEntry {
  id: string;
  slug: string;
  body: string;
  data: BlogPost; // 使用导入的 BlogPost 接口作为 data 的类型
  excerptHtml?: string;
}

export interface BlogCategory {
  name: string;
  slug: string;
  count: number;
}

export interface BlogTag {
  name: string;
  slug: string;
  count: number;
}

// 缓存所有文章，避免重复读取和解析
let cachedPosts: FullBlogPostEntry[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 缓存有效期 5 分钟 (开发模式下可以更短或禁用)

export async function getAllPosts(): Promise<FullBlogPostEntry[]> {
  const now = Date.now();
  if (cachedPosts && (now - cacheTimestamp < CACHE_DURATION)) {
    console.log('[BlogService - getAllPosts] Returning cached posts.');
    return cachedPosts;
  }

  try {
    const allEntries = await getCollection('blog');

    const posts: FullBlogPostEntry[] = await Promise.all(
      allEntries.map(async (entry) => {
        const { Content } = await render(entry);
        // Content Collections 默认不提供 excerpt，可以从 description 或手动截取
        const excerptHtml = entry.data.description || ''; // 假设 description 作为摘要

        return {
          id: entry.id,
          slug: entry.slug,
          body: Content.toString(), // Content 是一个 Astro Component，需要转换为字符串
          data: entry.data as BlogPost, // 将 entry.data 断言为 BlogPost 类型
          excerptHtml: excerptHtml,
        };
      })
    );

    console.log(`[BlogService - getAllPosts] Found ${posts.length} posts. Titles: ${posts.map(p => p.data.title).join(', ')}`);
    // 按日期排序，最新的在前面
    // 按日期排序，最新的在前面。如果 createDate 不存在，则视为 0 (即非常早的日期)，排在后面。
    const sortedPosts = posts.sort((a, b) => (b.data.createDate?.getTime() || 0) - (a.data.createDate?.getTime() || 0));
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

export async function getPostsByCategory(category: string): Promise<FullBlogPostEntry[]> {
  const allPosts = await getAllPosts();
  return allPosts.filter(post => 
    post.data.categories && post.data.categories.some(cat => 
      cat.toLowerCase() === category.toLowerCase()
    )
  );
}

export async function getPostBySlug(slug: string): Promise<FullBlogPostEntry | null> {
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
    if (post.data.categories && post.data.categories.length > 0) {
      post.data.categories.forEach(category => {
        const count = categoriesMap.get(category) || 0;
        categoriesMap.set(category, count + 1);
      });
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

export async function getAllTags(): Promise<BlogTag[]> {
  const allPosts = await getAllPosts();
  const tagsMap = new Map<string, number>();
  
  allPosts.forEach(post => {
    if (post.data.tags && post.data.tags.length > 0) {
      post.data.tags.forEach(tag => {
        // 确保 tag 不是空字符串或只包含空白字符
        if (tag && tag.trim() !== '') {
          const count = tagsMap.get(tag) || 0;
          tagsMap.set(tag, count + 1);
        }
      });
    }
  });
  
  const tags: BlogTag[] = [];
  tagsMap.forEach((count, name) => {
    const slug = slugify(name);
    // 只有当 slug 不为空时才添加标签
    if (slug !== '') {
      console.log(`[BlogService - getAllTags] Generated tag: name="${name}", slug="${slug}"`);
      tags.push({
        name,
        slug,
        count
      });
    }
  });
  
  return tags;
}

export async function getPostsByTag(tag: string): Promise<FullBlogPostEntry[]> {
  const allPosts = await getAllPosts();
  return allPosts.filter(post => 
    post.data.tags && post.data.tags.some(t => 
      t.toLowerCase() === tag.toLowerCase() || slugify(t) === tag.toLowerCase()
    )
  );
}

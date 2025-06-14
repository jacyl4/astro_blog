// 博客业务服务：负责 Markdown 读取、解析、聚合、标签分类等核心逻辑
// 遵循单一职责与高内聚低耦合原则
import { getCollection, type CollectionEntry } from 'astro:content';
import { slugify } from '../utils/stringUtils';

// 使用 Astro 的 CollectionEntry 作为核心的文章类型
export type BlogPost = CollectionEntry<'blog'>;

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

// 缓存所有已排序的文章，避免在单次构建/请求中重复处理
let sortedPosts: BlogPost[] | null = null;

/**
 * 获取所有博客文章，并按创建日期降序排序。
 * 使用简单的内存缓存（生命周期为单次构建或服务器运行期间），避免重复查询和排序。
 */
export async function getAllPosts(): Promise<BlogPost[]> {
  // 如果已经缓存，直接返回
  if (sortedPosts) {
    return sortedPosts;
  }

  try {
    const allEntries = await getCollection('blog');
    
    // 按创建日期降序排序
    const posts = allEntries.sort((a, b) => 
      b.data.createDate.getTime() - a.data.createDate.getTime()
    );

    console.log(`[BlogService] Fetched and sorted ${posts.length} posts.`);
    // 缓存结果
    sortedPosts = posts;
    return posts;
  } catch (error) {
    console.error('Error fetching or sorting blog posts:', error);
    // 在出错时返回空数组，防止下游消费者出错
    return [];
  }
}

/**
 * 根据分类名称获取文章列表
 */
export async function getPostsByCategory(category: string): Promise<BlogPost[]> {
  const allPosts = await getAllPosts();
  return allPosts.filter(post => 
    post.data.categories?.some(cat => 
      cat.toLowerCase() === category.toLowerCase()
    )
  );
}

/**
 * 获取所有文章的归档月份列表 (YYYY-MM)
 */
export async function getArchiveMonths(): Promise<string[]> {
  const allPosts = await getAllPosts();
  const months = new Set<string>();

  allPosts.forEach(post => {
    const date = post.data.createDate;
    const month = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    months.add(month);
  });

  return Array.from(months).sort().reverse();
}

/**
 * 根据 slug 获取单篇文章
 */
export async function getPostBySlug(slug: string): Promise<BlogPost | undefined> {
  const allPosts = await getAllPosts();
  const post = allPosts.find(p => p.slug === slug);

  if (!post) {
    console.warn(`[BlogService] Post with slug "${slug}" not found.`);
  }

  return post;
}

/**
 * 获取所有分类及其文章数量
 */
export async function getAllCategories(): Promise<BlogCategory[]> {
  const allPosts = await getAllPosts();
  const categoriesMap = new Map<string, number>();
  
  allPosts.forEach(post => {
    post.data.categories?.forEach(category => {
      const count = categoriesMap.get(category) || 0;
      categoriesMap.set(category, count + 1);
    });
  });
  
  const categories: BlogCategory[] = [];
  categoriesMap.forEach((count, name) => {
    categories.push({
      name,
      slug: name, // 直接使用原始名称作为 slug，与路由保持一致
      count
    });
  });
  
  return categories;
}

/**
 * 获取所有标签及其文章数量
 */
export async function getAllTags(): Promise<BlogTag[]> {
  const allPosts = await getAllPosts();
  const tagsMap = new Map<string, number>();
  
  allPosts.forEach(post => {
    post.data.tags?.forEach(tag => {
      if (tag && tag.trim() !== '') {
        const count = tagsMap.get(tag) || 0;
        tagsMap.set(tag, count + 1);
      }
    });
  });
  
  const tags: BlogTag[] = [];
  tagsMap.forEach((count, name) => {
    const slug = slugify(name);
    if (slug) {
      tags.push({
        name,
        slug,
        count
      });
    }
  });
  
  return tags;
}

/**
 * 根据标签名称或 slug 获取文章列表
 */
export async function getPostsByTag(tag: string): Promise<BlogPost[]> {
  const allPosts = await getAllPosts();
  const lowercasedTag = tag.toLowerCase();
  return allPosts.filter(post => 
    post.data.tags?.some(t => 
      t.toLowerCase() === lowercasedTag || slugify(t) === lowercasedTag
    )
  );
}

// 博客业务服务：负责 Markdown 读取、解析、聚合、标签分类等核心逻辑
// 遵循单一职责与高内聚低耦合原则
import { getCollection, type CollectionEntry } from 'astro:content';
import { slugify } from '../utils/stringUtils';

// 使用 Astro 的 CollectionEntry 作为核心的文章类型
export type BlogPost = CollectionEntry<'blog'>;

// 定义一个处理过的博客文章类型，其中 data 对象保证包含 category 字段
export type ProcessedBlogPost = Omit<BlogPost, 'data'> & {
  data: BlogPost['data'] & {
    category: string;
  };
};

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
let sortedPosts: ProcessedBlogPost[] | null = null;
let cachedCategories: BlogCategory[] | null = null;
let cachedTags: BlogTag[] | null = null;
let cachedArchiveMonths: string[] | null = null;

const collator = new Intl.Collator('zh-CN');

function clearDerivedCaches() {
  cachedCategories = null;
  cachedTags = null;
  cachedArchiveMonths = null;
}

function logDebug(message: string) {
  if (import.meta.env.DEV) {
    console.log(message);
  }
}

export function resetBlogCache() {
  sortedPosts = null;
  clearDerivedCaches();
}

/**
 * 获取所有博客文章，并按创建日期降序排序。
 * 使用简单的内存缓存（生命周期为单次构建或服务器运行期间），避免重复查询和排序。
 * 此函数还会从文件路径中提取 category 并附加到文章数据中。
 */
export async function getAllPosts(): Promise<ProcessedBlogPost[]> {
  // 如果已经缓存，直接返回
  if (sortedPosts) {
    return sortedPosts;
  }

  try {
    const allEntries = await getCollection('blog');
    
    // 注入 category 和 title（如果缺失），并按创建日期降序排序
    const postsWithCategory = allEntries.map(post => {
      const pathSegments = post.id.split('/');
      // 如果路径是 'folder/file.md'，分类就是 'folder'
      const category = pathSegments.length > 1 ? pathSegments[0] : 'Uncategorized';
      
      // 从文件名推断 title（如果 frontmatter 中没有提供）
      const inferredTitle = post.data.title || pathSegments.pop()?.replace(/\.mdx?$/, '') || post.id;

      // 返回一个符合 ProcessedBlogPost 类型的新对象
      return {
        ...post,
        // 使用 slugify 将 Astro 从文件路径生成的默认 slug（可能含中文）转换为全拼音 slug
        slug: slugify(post.slug),
        data: {
          ...post.data,
          title: inferredTitle, // 确保 title 存在
          category: category,
          // 在这里处理标签，去除 '#'
          tags: post.data.tags?.map(tag => tag.startsWith('#') ? tag.slice(1) : tag) || [],
        }
      };
    }) as ProcessedBlogPost[];

    const posts = postsWithCategory.sort((a, b) => {
      const dateA = a.data.created?.getTime() ?? 0;
      const dateB = b.data.created?.getTime() ?? 0;
      return dateB - dateA;
    });

    clearDerivedCaches();
    sortedPosts = posts;
    logDebug(`[BlogService] Fetched, processed, and sorted ${posts.length} posts.`);
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
export async function getPostsByCategory(category: string): Promise<ProcessedBlogPost[]> {
  const allPosts = await getAllPosts();
  const normalizedCategorySlug = slugify(category);
  const normalizedCategoryName = category.trim().toLowerCase();

  return allPosts.filter(post => {
    const postCategory = post.data.category.trim();
    return (
      slugify(postCategory) === normalizedCategorySlug ||
      postCategory.toLowerCase() === normalizedCategoryName
    );
  });
}

/**
 * 获取所有文章的归档月份列表 (YYYY-MM)
 */
export async function getArchiveMonths(): Promise<string[]> {
  if (cachedArchiveMonths) {
    return [...cachedArchiveMonths];
  }

  const allPosts = await getAllPosts();
  const months = new Set<string>();

  allPosts.forEach(post => {
    const date = post.data.created;
    if (date) {
      const month = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      months.add(month);
    }
  });

  cachedArchiveMonths = Array.from(months).sort().reverse();
  return [...cachedArchiveMonths];
}

/**
 * 根据 slug 获取单篇文章。
 * Astro 的 content collection 会根据文件路径自动生成 slug。
 * 例如 '网络/some-post.md' -> '网络/some-post'
 */
export async function getPostBySlug(slug: string): Promise<ProcessedBlogPost | undefined> {
  if (!slug) return undefined;

  const allPosts = await getAllPosts();
  
  // 直接匹配我们自定义生成的 pinyin slug
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
  if (cachedCategories) {
    return cachedCategories.map(category => ({ ...category }));
  }

  const allPosts = await getAllPosts();
  const categoriesMap = new Map<string, number>();
  
  allPosts.forEach(post => {
    const category = post.data.category;
    const count = categoriesMap.get(category) || 0;
    categoriesMap.set(category, count + 1);
  });
  
  const categories: BlogCategory[] = [];
  categoriesMap.forEach((count, name) => {
    const slug = slugify(name);
    if (slug) {
      categories.push({
        name,
        slug,
        count
      });
    }
  });

  categories.sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return collator.compare(a.name, b.name);
  });

  cachedCategories = categories;
  return cachedCategories.map(category => ({ ...category }));
}

/**
 * 获取所有标签及其文章数量
 */
export async function getAllTags(): Promise<BlogTag[]> {
  if (cachedTags) {
    return cachedTags.map(tag => ({ ...tag }));
  }

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

  tags.sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return collator.compare(a.name, b.name);
  });

  cachedTags = tags;
  return cachedTags.map(tag => ({ ...tag }));
}

/**
 * 根据标签名称或 slug 获取文章列表
 */
export async function getPostsByTag(tag: string): Promise<ProcessedBlogPost[]> {
  const allPosts = await getAllPosts();
  const normalizedTagSlug = slugify(tag);
  const normalizedTagName = tag.trim().toLowerCase();

  return allPosts.filter(post => 
    post.data.tags?.some(t => {
      const trimmedTag = t.trim();
      return (
        slugify(trimmedTag) === normalizedTagSlug ||
        trimmedTag.toLowerCase() === normalizedTagName
      );
    }) ?? false
  );
}

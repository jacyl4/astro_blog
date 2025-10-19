// Blog service: responsible for reading Markdown, parsing, aggregating,
// categorizing tags, and other core logic.
// Follows single-responsibility and high-cohesion / low-coupling principles.
import { getCollection, type CollectionEntry } from 'astro:content';
import { slugify } from '../utils/stringUtils';

// Use Astro's CollectionEntry as the core post type
export type BlogPost = CollectionEntry<'blog'>;

// Define a processed blog post type where the data object is guaranteed to include a category field
export type ProcessedBlogPost = Omit<BlogPost, 'data'> & {
  data: BlogPost['data'] & {
    category: string;
    originalTitle: string;
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

// Cache all sorted posts to avoid repeated processing during a single build/request
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
  // If already cached, return immediately
  if (sortedPosts) {
    return sortedPosts;
  }

  try {
    const allEntries = await getCollection('blog');
    
    const slugTracker = new Map<string, number>();
    const getUniqueSlug = (base: string) => {
      const count = slugTracker.get(base) ?? 0;
      slugTracker.set(base, count + 1);
      return count === 0 ? base : `${base}-${count + 1}`;
    };

  // Inject category and title (if missing), and sort by created date descending
    const postsWithCategory = allEntries.map((post, index) => {
      const pathSegments = post.id.split('/');
      const fileSegment = pathSegments[pathSegments.length - 1] ?? post.id;
  // If path is 'folder/file.md', the category is 'folder'
      const category = pathSegments.length > 1 ? pathSegments[0] : 'Uncategorized';

      const fileTitle = fileSegment.replace(/\.mdx?$/, '');
      const frontmatterTitle = post.data.title?.trim() || '';
      const displayTitle = fileTitle || frontmatterTitle || post.id;

      const titleSlug = frontmatterTitle ? slugify(frontmatterTitle) : '';
      const fallbackSlug = slugify(displayTitle)
        || slugify(post.slug)
        || slugify(pathSegments.join('-'))
        || `post-${index + 1}`;
      const slugCandidate = titleSlug || fallbackSlug;
      const uniqueSlug = getUniqueSlug(slugCandidate);

  // Return a new object conforming to ProcessedBlogPost
      return {
        ...post,
  // Generate an English slug based on the article title, fallback to the original path if needed and ensure global uniqueness
        slug: uniqueSlug,
        data: {
          ...post.data,
          title: displayTitle, // Display title uses file name (often in Chinese)
          originalTitle: frontmatterTitle || displayTitle,
          category: category,
          // Handle tags here by removing any leading '#'
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
  // On error, return an empty array to prevent downstream failures
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
  
  // Directly match the pinyin slug we generate
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

import { slugify } from '@/utils/stringUtils';
import { formatArchiveMonth } from '@/utils/dateUtils';
import type {
  BlogCategory,
  BlogSourcePost,
  BlogTag,
  ProcessedPost,
} from './model';

const collator = new Intl.Collator('zh-CN');

export function selectPostBySlug<T extends BlogSourcePost>(
  posts: ProcessedPost<T>[],
  slug: string,
): ProcessedPost<T> | undefined {
  if (!slug) return undefined;
  return posts.find((post) => post.slug === slug);
}

export function selectPostsByCategory<T extends BlogSourcePost>(
  posts: ProcessedPost<T>[],
  category: string,
): ProcessedPost<T>[] {
  const normalizedSlug = slugify(category);
  const normalizedName = category.trim().toLocaleLowerCase('zh-CN');
  return posts.filter((post) => {
    const postCategory = post.data.category.trim();
    return slugify(postCategory) === normalizedSlug
      || postCategory.toLocaleLowerCase('zh-CN') === normalizedName;
  });
}

export function selectPostsByTag<T extends BlogSourcePost>(
  posts: ProcessedPost<T>[],
  tag: string,
): ProcessedPost<T>[] {
  const normalizedSlug = slugify(tag);
  const normalizedName = tag.trim().toLocaleLowerCase('zh-CN');
  return posts.filter((post) => post.data.tags.some((postTag) => {
    const trimmed = postTag.trim();
    return slugify(trimmed) === normalizedSlug
      || trimmed.toLocaleLowerCase('zh-CN') === normalizedName;
  }));
}

export function selectPostsByArchiveMonth<T extends BlogSourcePost>(
  posts: ProcessedPost<T>[],
  yearMonth: string,
): ProcessedPost<T>[] {
  return posts.filter((post) => formatArchiveMonth(post.data.created) === yearMonth);
}

export function selectCategories<T extends BlogSourcePost>(
  posts: ProcessedPost<T>[],
): BlogCategory[] {
  const counts = new Map<string, number>();
  for (const post of posts) {
    counts.set(post.data.category, (counts.get(post.data.category) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, slug: slugify(name), count }))
    .filter((category) => Boolean(category.slug))
    .sort((a, b) => b.count - a.count || collator.compare(a.name, b.name));
}

export function selectTags<T extends BlogSourcePost>(
  posts: ProcessedPost<T>[],
): BlogTag[] {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.data.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, slug: slugify(name), count }))
    .filter((tag) => Boolean(tag.slug))
    .sort((a, b) => b.count - a.count || collator.compare(a.name, b.name));
}

export function selectArchiveMonths<T extends BlogSourcePost>(
  posts: ProcessedPost<T>[],
): string[] {
  const months = new Set<string>();
  for (const post of posts) {
    const yearMonth = formatArchiveMonth(post.data.created);
    if (yearMonth) months.add(yearMonth);
  }
  return [...months].sort().reverse();
}

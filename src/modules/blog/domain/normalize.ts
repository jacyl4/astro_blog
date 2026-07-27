import { slugify } from '@/utils/stringUtils';
import type { BlogSourcePost, ProcessedPost } from './model';

function fileTitleFromId(id: string): string {
  const segments = id.split('/');
  return (segments[segments.length - 1] ?? id).replace(/\.mdx?$/, '');
}

export function normalizePosts<T extends BlogSourcePost>(entries: T[]): ProcessedPost<T>[] {
  const posts = entries.map((post, index) => {
    const pathSegments = post.id.split('/');
    const fileTitle = fileTitleFromId(post.id);
    const sourceTitle = post.data.originalTitle?.trim() || post.data.title?.trim() || '';
    const displayTitle = post.data.originalTitle
      ? post.data.title?.trim() || fileTitle
      : fileTitle || sourceTitle || post.id;
    const slug = post.data.slug?.trim()
      || slugify(sourceTitle)
      || slugify(displayTitle)
      || slugify(pathSegments.join('-'))
      || `post-${index + 1}`;
    const category = post.data.category?.trim()
      || (pathSegments.length > 1 ? pathSegments[0]! : 'Uncategorized');

    return {
      ...post,
      slug,
      data: {
        ...post.data,
        title: displayTitle,
        originalTitle: sourceTitle || displayTitle,
        category,
        tags: (post.data.tags ?? [])
          .map((tag) => tag.replace(/^#/, '').trim())
          .filter(Boolean),
      },
    };
  });

  const bySlug = new Map<string, string[]>();
  for (const post of posts) {
    const ids = bySlug.get(post.slug) ?? [];
    ids.push(post.id);
    bySlug.set(post.slug, ids);
  }
  const duplicates = [...bySlug.entries()].filter(([, ids]) => ids.length > 1);
  if (duplicates.length > 0) {
    const detail = duplicates
      .map(([slug, ids]) => `${slug}: ${ids.join(', ')}`)
      .join('; ');
    throw new Error(`Duplicate public blog slug(s): ${detail}`);
  }

  return posts.sort((a, b) => {
    const dateA = a.data.created?.getTime() ?? 0;
    const dateB = b.data.created?.getTime() ?? 0;
    return dateB - dateA;
  });
}

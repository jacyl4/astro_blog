import { describe, expect, it } from 'vitest';
import { BlogApplicationService } from '../../src/modules/blog/application/BlogApplicationService';
import type { BlogRepository } from '../../src/modules/blog/application/BlogRepository';
import { normalizePosts } from '../../src/modules/blog/domain/normalize';
import {
  selectArchiveMonths,
  selectCategories,
  selectPostsByCategory,
  selectPostsByArchiveMonth,
  selectPostsByTag,
  selectTags,
} from '../../src/modules/blog/domain/selectors';

function entry(
  id: string,
  title: string,
  created: string,
  tags: string[] = [],
  slug?: string,
) {
  return {
    id,
    data: {
      title,
      created: new Date(created),
      tags,
      slug,
    },
  };
}

describe('blog domain', () => {
  it('preserves legacy display behavior while normalizing metadata', () => {
    const posts = normalizePosts([
      entry('网络/file-a.md', 'English A', '2025-01-01', ['#network']),
      entry('前端/file-b.md', 'English B', '2026-01-01', ['web']),
    ]);

    expect(posts.map((post) => ({
      id: post.id,
      slug: post.slug,
      title: post.data.title,
      originalTitle: post.data.originalTitle,
      category: post.data.category,
      tags: post.data.tags,
    }))).toEqual([
      {
        id: '前端/file-b.md',
        slug: 'english-b',
        title: 'file-b',
        originalTitle: 'English B',
        category: '前端',
        tags: ['web'],
      },
      {
        id: '网络/file-a.md',
        slug: 'english-a',
        title: 'file-a',
        originalTitle: 'English A',
        category: '网络',
        tags: ['network'],
      },
    ]);
  });

  it('fails duplicate public slugs instead of assigning traversal suffixes', () => {
    expect(() => normalizePosts([
      entry('a.md', 'Same', '2025-01-01'),
      entry('b.md', 'Same', '2026-01-01'),
    ])).toThrow(/Duplicate public blog slug/);
  });

  it('builds deterministic category, tag, archive, and filter selectors', () => {
    const posts = normalizePosts([
      entry('网络/a.md', 'A', '2026-02-01', ['#network'], 'a'),
      entry('网络/b.md', 'B', '2026-02-15', ['network'], 'b'),
      entry('前端/c.md', 'C', '2025-01-01', ['web'], 'c'),
    ]);

    expect(selectCategories(posts)).toEqual([
      { name: '网络', slug: 'wang-luo', count: 2 },
      { name: '前端', slug: 'qian-duan', count: 1 },
    ]);
    expect(selectTags(posts)).toEqual([
      { name: 'network', slug: 'network', count: 2 },
      { name: 'web', slug: 'web', count: 1 },
    ]);
    expect(selectArchiveMonths(posts)).toEqual(['2026-02', '2025-01']);
    expect(selectPostsByCategory(posts, 'wang-luo')).toHaveLength(2);
    expect(selectPostsByTag(posts, 'network')).toHaveLength(2);
  });

  it('derives archive months from the blog timezone instead of the runner timezone', () => {
    const posts = normalizePosts([
      entry('网络/year-boundary.md', 'Year boundary', '2025-12-31T16:00:00.000Z'),
      entry('网络/month-boundary.md', 'Month boundary', '2025-06-30T16:00:00.000Z'),
    ]);

    expect(selectArchiveMonths(posts)).toEqual(['2026-01', '2025-07']);
    expect(selectPostsByArchiveMonth(posts, '2025-07')).toHaveLength(1);
  });

  it('keeps every application query consistent and caches repository reads per build scope', async () => {
    let reads = 0;
    let resets = 0;
    const repository: BlogRepository<ReturnType<typeof entry>> = {
      async getAll() {
        reads += 1;
        return [
          entry('网络/a.md', 'A', '2026-02-01', ['#network'], 'a'),
          entry('前端/b.md', 'B', '2025-01-01', ['web'], 'b'),
        ];
      },
      reset() {
        resets += 1;
      },
    };
    const service = new BlogApplicationService(repository);

    expect((await service.getAllPosts()).map((post) => post.slug)).toEqual(['a', 'b']);
    expect((await service.getPostBySlug('a'))?.slug).toBe('a');
    expect(await service.getPostsByCategory('wang-luo')).toHaveLength(1);
    expect(await service.getPostsByTag('web')).toHaveLength(1);
    expect(await service.getPostsByArchiveMonth('2026-02')).toHaveLength(1);
    expect(await service.getAllCategories()).toHaveLength(2);
    expect(await service.getAllTags()).toHaveLength(2);
    expect(await service.getArchiveMonths()).toEqual(['2026-02', '2025-01']);
    expect(reads).toBe(1);

    service.reset();
    expect(resets).toBe(1);
    await service.getAllPosts();
    expect(reads).toBe(2);
  });

  it('propagates repository failures with their source context', async () => {
    const repository: BlogRepository<ReturnType<typeof entry>> = {
      async getAll() {
        throw new Error('content collection unavailable');
      },
      reset() {},
    };

    await expect(new BlogApplicationService(repository).getAllPosts())
      .rejects.toThrow('content collection unavailable');
  });
});

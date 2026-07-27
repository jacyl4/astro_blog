import type { BlogRepository } from './BlogRepository';
import { normalizePosts } from '../domain/normalize';
import {
  selectArchiveMonths,
  selectCategories,
  selectPostBySlug,
  selectPostsByCategory,
  selectPostsByTag,
  selectTags,
} from '../domain/selectors';
import type {
  BlogCategory,
  BlogSourcePost,
  BlogTag,
  ProcessedPost,
} from '../domain/model';

export class BlogApplicationService<T extends BlogSourcePost> {
  private posts: ProcessedPost<T>[] | null = null;

  constructor(private readonly repository: BlogRepository<T>) {}

  async getAllPosts(): Promise<ProcessedPost<T>[]> {
    if (!this.posts) {
      this.posts = normalizePosts(await this.repository.getAll());
    }
    return this.posts;
  }

  async getPostBySlug(slug: string): Promise<ProcessedPost<T> | undefined> {
    return selectPostBySlug(await this.getAllPosts(), slug);
  }

  async getPostsByCategory(category: string): Promise<ProcessedPost<T>[]> {
    return selectPostsByCategory(await this.getAllPosts(), category);
  }

  async getPostsByTag(tag: string): Promise<ProcessedPost<T>[]> {
    return selectPostsByTag(await this.getAllPosts(), tag);
  }

  async getAllCategories(): Promise<BlogCategory[]> {
    return selectCategories(await this.getAllPosts()).map((category) => ({ ...category }));
  }

  async getAllTags(): Promise<BlogTag[]> {
    return selectTags(await this.getAllPosts()).map((tag) => ({ ...tag }));
  }

  async getArchiveMonths(): Promise<string[]> {
    return [...selectArchiveMonths(await this.getAllPosts())];
  }

  reset(): void {
    this.posts = null;
    this.repository.reset();
  }
}

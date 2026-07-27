import { getCollection, type CollectionEntry } from 'astro:content';
import type { BlogRepository } from '../application/BlogRepository';

export type AstroBlogEntry = CollectionEntry<'blog'>;

export class AstroBlogRepository implements BlogRepository<AstroBlogEntry> {
  private entries: AstroBlogEntry[] | null = null;

  async getAll(): Promise<AstroBlogEntry[]> {
    if (this.entries) return this.entries;
    try {
      this.entries = await getCollection('blog');
      return this.entries;
    } catch (error) {
      throw new Error('Failed to load Astro blog content collection', { cause: error });
    }
  }

  reset(): void {
    this.entries = null;
  }
}

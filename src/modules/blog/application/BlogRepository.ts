import type { BlogSourcePost } from '../domain/model';

export interface BlogRepository<T extends BlogSourcePost> {
  getAll(): Promise<T[]>;
  reset(): void;
}

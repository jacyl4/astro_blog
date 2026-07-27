import { BlogApplicationService } from './application/BlogApplicationService';
import {
  AstroBlogRepository,
  type AstroBlogEntry,
} from './infrastructure/AstroBlogRepository';
import type { ProcessedPost } from './domain/model';

export type { BlogCategory, BlogTag } from './domain/model';
export type ProcessedBlogPost = ProcessedPost<AstroBlogEntry>;

const repository = new AstroBlogRepository();
const service = new BlogApplicationService(repository);

export const getAllPosts = () => service.getAllPosts();
export const getPostBySlug = (slug: string) => service.getPostBySlug(slug);
export const getPostsByCategory = (category: string) => service.getPostsByCategory(category);
export const getPostsByTag = (tag: string) => service.getPostsByTag(tag);
export const getAllCategories = () => service.getAllCategories();
export const getAllTags = () => service.getAllTags();
export const getArchiveMonths = () => service.getArchiveMonths();
export const resetBlogCache = () => service.reset();

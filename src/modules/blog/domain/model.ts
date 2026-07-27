export interface BlogPostData {
  id?: string;
  slug?: string;
  title?: string;
  originalTitle?: string;
  created?: Date;
  updated?: Date;
  tags?: string[];
  category?: string;
}

export interface BlogSourcePost {
  id: string;
  data: BlogPostData;
}

export type ProcessedPost<T extends BlogSourcePost = BlogSourcePost> = Omit<T, 'data'> & {
  slug: string;
  data: T['data'] & {
    title: string;
    originalTitle: string;
    category: string;
    tags: string[];
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

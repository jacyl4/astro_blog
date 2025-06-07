// 博客文章与分类的数据结构定义，便于类型安全和扩展
export interface BlogPost {
  title: string;
  content: string;
  date: Date;
  slug: string;
  category: string;
  excerpt?: string;
  excerptHtml?: string; // 支持 HTML 格式的摘要
  tags?: string[];
}

export interface BlogCategory {
  name: string;
  slug: string;
  count: number;
}
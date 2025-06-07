// URL 相关工具函数

/**
 * 生成站点内链接，确保为根相对路径
 * @param path 网站内部路径（可以带或不带前导/）
 * @returns 根相对路径链接 (e.g., /posts/my-slug)
 */
export function getSiteLink(path: string): string {
  // 移除所有可能的前导斜杠
  let cleanPath = path.replace(/^\/+/, '');
  
  // 如果路径为空或只是一个点 (代表当前目录，通常用于首页链接 getSiteLink(''))
  if (cleanPath === '' || cleanPath === '.') {
    return '/'; // 始终返回根目录
  }
  
  // 确保路径以单个斜杠开头
  return `/${cleanPath}`;
} 
// 字符串工具函数：如 slugify 等，便于全局复用

/**
 * 将文本转为 URL 友好的 slug
 * @param text 输入文本
 * @returns slug 字符串
 */
export function slugify(text: string): string {
  // 如果文本为空或只包含空白字符，则直接返回空字符串
  if (!text || text.trim() === '') {
    return '';
  }

  let slug = text.toString().toLowerCase().trim();

  // 移除所有非 ASCII 字符
  slug = slug.replace(/[^\x00-\x7F]/g, ''); 
  
  // Convert whitespace to hyphens
  slug = slug.replace(/\s+/g, '-');
  
  // Remove characters that are not letters, numbers, or hyphens.
  slug = slug.replace(/[^a-z0-9-]+/g, ''); 
  
  // Collapse multiple hyphens
  slug = slug.replace(/--+/g, '-');
  
  // Remove leading/trailing hyphens
  slug = slug.replace(/^-+|-+$/g, '');
  
  return slug;
}

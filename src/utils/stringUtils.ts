// 字符串工具函数：如 slugify 等，便于全局复用

/**
 * 将文本转为 URL 友好的 slug
 * @param text 输入文本
 * @returns slug 字符串
 */
export function slugify(text: string): string {
  if (!text) {
    return '';
  }

  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\u4e00-\u9fa5a-z0-9-]+/g, '') // Remove all non-word chars except CJK and hyphens
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

// 字符串工具函数：如 slugify 等，便于全局复用

/**
 * 将文本转为 URL 友好的 slug
 * @param text 输入文本
 * @returns slug 字符串
 */
export function slugify(text: string): string {
  // More Unicode-friendly slugify
  const slug = text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-') // Convert whitespace to hyphens
    // Remove characters that are not letters (any language), numbers (any language), or hyphens.
    // The \p{L} and \p{N} are Unicode properties. The 'u' flag is essential.
    .replace(/[^\p{L}\p{N}-]+/gu, '') 
    .replace(/--+/g, '-') // Collapse multiple hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  return slug;
}
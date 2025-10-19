// URL-related utility functions

/**
 * Generate an internal site link and ensure it's root-relative
 * @param path internal site path (may include or omit leading /)
 * @returns root-relative link (e.g., /posts/my-slug)
 */
export function getSiteLink(path: string): string {
  // Remove any leading slashes
  let cleanPath = path.replace(/^\/+/, '');
  
  // If path is empty or just a dot (represents current dir; often used for home link getSiteLink(''))
  if (cleanPath === '' || cleanPath === '.') {
    return '/'; // Always return root
  }
  
  // Ensure the path starts with a single slash
  return `/${cleanPath}`;
} 
import { getCollection } from 'astro:content';

export async function getPageById(id: string) {
  const pages = await getCollection('pages', ({ id: entryId }) => entryId === id);
  const page = pages[0];
  if (!page) throw new Error(`Required page content not found: ${id}`);
  return page;
}

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { sha256, toPosixPath, walkFiles } from './manifest';

export interface MainContentBaseline {
  schemaVersion: 1;
  pageCount: number;
  pages: Array<{
    file: string;
    sha256: string;
  }>;
}

export function normalizeMainContent(html: string): string {
  const main = html.match(/<main id="swup"[\s\S]*?<\/main>/)?.[0];
  if (!main) throw new Error('missing <main id="swup">');
  return main.replace(/\s+/g, ' ').replace(/> </g, '><').trim();
}

export async function createMainContentBaseline(distDir: string): Promise<MainContentBaseline> {
  const root = path.resolve(distDir);
  const files = (await walkFiles(root)).filter((file) => file.endsWith('.html'));
  const pages = [];
  for (const file of files) {
    pages.push({
      file: toPosixPath(path.relative(root, file)),
      sha256: sha256(normalizeMainContent(await readFile(file, 'utf8'))),
    });
  }
  pages.sort((a, b) => a.file.localeCompare(b.file));
  return { schemaVersion: 1, pageCount: pages.length, pages };
}

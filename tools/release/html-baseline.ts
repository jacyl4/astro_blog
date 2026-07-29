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

export interface MainContentApproval {
  sha256: string;
  reason: string;
}

export interface MainContentAssessment {
  missing: string[];
  changed: string[];
  approved: string[];
}

export function normalizeMainContent(html: string): string {
  const main = html.match(/<main id="swup"[\s\S]*?<\/main>/)?.[0];
  if (!main) throw new Error('missing <main id="swup">');
  return main
    // Scoped-style IDs are compiler implementation details and can change
    // between Astro releases without changing DOM structure or semantics.
    .replace(/data-astro-cid-[a-z0-9]+/g, 'data-astro-cid-<scope>')
    .replace(/\s+/g, ' ')
    .replace(/> </g, '><')
    .trim();
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

export function assessMainContentBaseline(
  baseline: MainContentBaseline,
  candidate: MainContentBaseline,
  approvals: Record<string, MainContentApproval>,
): MainContentAssessment {
  const candidateByFile = new Map(candidate.pages.map((page) => [page.file, page.sha256]));
  const missing = baseline.pages
    .filter((page) => !candidateByFile.has(page.file))
    .map((page) => page.file);
  const changed: string[] = [];
  const approved: string[] = [];

  for (const page of baseline.pages) {
    const candidateHash = candidateByFile.get(page.file);
    if (!candidateHash || candidateHash === page.sha256) continue;
    if (approvals[page.file]?.sha256 === candidateHash) approved.push(page.file);
    else changed.push(page.file);
  }
  return { missing, changed, approved };
}

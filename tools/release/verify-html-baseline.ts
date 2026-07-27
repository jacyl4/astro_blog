import { readFile } from 'node:fs/promises';
import { resolveArg } from './cli';
import {
  createMainContentBaseline,
  type MainContentBaseline,
} from './html-baseline';

const baselinePath = resolveArg('baseline', 'baselines/main-content.json');
const distDir = resolveArg('dist', 'dist');
const baseline = JSON.parse(await readFile(baselinePath, 'utf8')) as MainContentBaseline;
const candidate = await createMainContentBaseline(distDir);
const candidateByFile = new Map(candidate.pages.map((page) => [page.file, page.sha256]));
const missing = baseline.pages.filter((page) => !candidateByFile.has(page.file)).map((page) => page.file);
const changed = baseline.pages
  .filter((page) => candidateByFile.get(page.file) !== page.sha256)
  .map((page) => page.file);

if (missing.length > 0 || changed.length > 0) {
  console.error(JSON.stringify({ missing, changed }, null, 2));
  process.exitCode = 1;
} else {
  console.log(`main content baseline passed: ${baseline.pageCount} pages`);
}

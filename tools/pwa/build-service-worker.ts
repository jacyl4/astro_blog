import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
import { sha256, toPosixPath, walkFiles } from '../release/manifest';

const PRECACHE_EXTENSIONS = new Set([
  '.css',
  '.html',
  '.ico',
  '.js',
  '.png',
  '.svg',
  '.webp',
  '.woff',
  '.woff2',
]);

export interface PrecacheEntry {
  url: string;
  revision: string;
}

function publicUrl(relativeFile: string): string {
  if (relativeFile === 'index.html') return '/';
  if (relativeFile.endsWith('/index.html')) {
    return `/${relativeFile.slice(0, -'index.html'.length)}`;
  }
  return `/${relativeFile}`;
}

export async function createPrecacheEntries(distDir: string): Promise<PrecacheEntry[]> {
  const files = await walkFiles(distDir);
  const entries: PrecacheEntry[] = [];
  for (const file of files) {
    if (path.basename(file) === 'sw.js' || !PRECACHE_EXTENSIONS.has(path.extname(file))) {
      continue;
    }
    const relativeFile = toPosixPath(path.relative(distDir, file));
    entries.push({
      url: publicUrl(relativeFile),
      revision: sha256(await readFile(file)),
    });
  }
  return entries.sort((left, right) => left.url.localeCompare(right.url));
}

export async function buildServiceWorker(
  distDir: string,
  sourceFile = path.resolve('src/sw.ts'),
): Promise<{ entryCount: number; releaseId: string; outputFile: string }> {
  const entries = await createPrecacheEntries(distDir);
  if (entries.length === 0) {
    throw new Error('refusing to generate a service worker with an empty precache manifest');
  }
  const releaseId = createHash('sha256')
    .update(JSON.stringify(entries))
    .digest('hex')
    .slice(0, 16);
  let source = await readFile(sourceFile, 'utf8');
  const manifestMarker = '/* __PRECACHE_MANIFEST__ */ []';
  const releaseMarker = "'__PRECACHE_RELEASE_ID__'";
  if (!source.includes(manifestMarker) || !source.includes(releaseMarker)) {
    throw new Error('service worker template markers are missing');
  }
  source = source
    .replace(manifestMarker, JSON.stringify(entries))
    .replace(releaseMarker, JSON.stringify(releaseId));

  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      removeComments: true,
    },
    fileName: sourceFile,
    reportDiagnostics: true,
  });
  const errors = transpiled.diagnostics?.filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error) ?? [];
  if (errors.length > 0) {
    throw new Error(errors.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')).join('\n'));
  }
  if (transpiled.outputText.includes('__PRECACHE_')) {
    throw new Error('unresolved service worker template marker');
  }

  const outputFile = path.join(distDir, 'sw.js');
  await writeFile(outputFile, transpiled.outputText);
  return { entryCount: entries.length, releaseId, outputFile };
}

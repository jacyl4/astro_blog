import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { resolveArg } from './cli';
import { walkFiles } from './manifest';

const distDir = resolveArg('dist', 'dist');
const htmlFiles = (await walkFiles(distDir)).filter((file) => file.endsWith('.html'));
const errors: string[] = [];

if (htmlFiles.length === 0) {
  errors.push('dist contains no HTML pages');
}

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const relative = path.relative(distDir, file);
  if (!/<html\b/i.test(html)) errors.push(`${relative}: missing <html>`);
  if (!/<title>[^<]+<\/title>/i.test(html)) errors.push(`${relative}: missing non-empty <title>`);
  if (!/<main\b/i.test(html)) errors.push(`${relative}: missing <main>`);
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`static smoke passed: ${htmlFiles.length} pages`);
}

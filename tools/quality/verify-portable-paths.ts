import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const activePrefixes = [
  '.gitlab-ci.yml',
  'astro.config.mjs',
  'package.json',
  'playwright.config.ts',
  'src/',
  'tailwind.config.mjs',
  'templates/',
  'tests/',
  'tools/',
  'tsconfig.json',
  'vitest.config.ts',
  'wrangler.jsonc',
];
const machinePath = /(?:^|[="'\s(])(?:\/home\/[^/$\s]+\/|\/Users\/[^/$\s]+\/|[A-Za-z]:\\Users\\)/gm;

const tracked = execFileSync('git', ['ls-files', '-z'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'ignore'],
}).split('\0').filter(Boolean);
const violations: Array<{ file: string; match: string }> = [];

for (const file of tracked) {
  if (!activePrefixes.some((prefix) => file === prefix || file.startsWith(prefix))) continue;
  const contents = await readFile(file, 'utf8').catch(() => '');
  for (const match of contents.matchAll(machinePath)) {
    violations.push({ file, match: match[0].trim() });
  }
}

if (violations.length > 0) {
  console.error(JSON.stringify({ violations }, null, 2));
  process.exitCode = 1;
} else {
  console.log(`portable path verification passed: ${tracked.length} tracked files scanned`);
}

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { resolveArg } from './cli';
import { createMainContentBaseline } from './html-baseline';
import { stableJson } from './manifest';

const distDir = resolveArg('dist', 'dist');
const output = resolveArg('output', 'baselines/main-content.json');
const baseline = await createMainContentBaseline(distDir);
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, stableJson(baseline));
console.log(`main content baseline: ${baseline.pageCount} pages`);

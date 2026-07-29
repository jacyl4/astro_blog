import { readdir, stat, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { compileContent, writeCompilation } from '../content-compiler/compiler';
import { loadConfig } from '../content-compiler/config';
import { stableJson } from '../release/manifest';

async function directorySize(root: string): Promise<number> {
  let total = 0;
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) {
      total += await directorySize(target);
    } else if (entry.isFile()) {
      total += (await stat(target)).size;
    }
  }
  return total;
}

const config = loadConfig(
  [process.argv[0], process.argv[1], 'compile', ...process.argv.slice(2)],
  process.env,
);
const evidencePath = path.resolve(
  process.env.CONTENT_PERFORMANCE_EVIDENCE
    ?? '.build/evidence/content-compile-performance.json',
);

let peakRssBytes = process.memoryUsage().rss;
const sampler = setInterval(() => {
  peakRssBytes = Math.max(peakRssBytes, process.memoryUsage().rss);
}, 5);
const startedAt = new Date().toISOString();
const started = performance.now();

try {
  const result = await compileContent(config);
  await writeCompilation(config, result);
  const durationMs = performance.now() - started;
  peakRssBytes = Math.max(peakRssBytes, process.memoryUsage().rss);
  const outputBytes = await directorySize(config.outputDir);
  const evidence = {
    schemaVersion: 1,
    startedAt,
    sourceDir: config.sourceDir,
    mode: config.mode,
    articleCount: result.manifest.articleCount,
    manifestHash: result.manifest.manifestHash,
    durationMs: Math.round(durationMs * 100) / 100,
    peakRssBytes,
    outputBytes,
  };
  await mkdir(path.dirname(evidencePath), { recursive: true });
  await writeFile(evidencePath, stableJson(evidence));
  console.log(stableJson(evidence));
} finally {
  clearInterval(sampler);
}

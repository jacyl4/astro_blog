import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildServiceWorker, createPrecacheEntries } from '../../tools/pwa/build-service-worker';

describe('native PWA build', () => {
  it('creates a stable, revisioned precache manifest and ignores unsupported files', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'pwa-manifest-'));
    await mkdir(path.join(root, 'nested'));
    await writeFile(path.join(root, 'index.html'), '<main>home</main>');
    await writeFile(path.join(root, 'nested', 'index.html'), '<main>nested</main>');
    await writeFile(path.join(root, 'nested', 'app.js'), 'console.log("ok")');
    await writeFile(path.join(root, 'ignored.json'), '{}');

    const entries = await createPrecacheEntries(root);
    expect(entries.map((entry) => entry.url)).toEqual(['/', '/nested/', '/nested/app.js']);
    expect(entries.every((entry) => /^[a-f0-9]{64}$/.test(entry.revision))).toBe(true);
  });

  it('emits a service worker with no unresolved template markers', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'pwa-build-'));
    await writeFile(path.join(root, 'index.html'), '<main>home</main>');

    const result = await buildServiceWorker(root);
    const output = await readFile(result.outputFile, 'utf8');
    expect(result.entryCount).toBe(1);
    expect(result.releaseId).toMatch(/^[a-f0-9]{16}$/);
    expect(output).toMatch(/"url":\s*"\/"/);
    expect(output).not.toMatch(/"url":\s*"\/index\.html"/);
    expect(output).toContain("const CACHE_PREFIX = 'astro-blog'");
    expect(output).toContain('`${CACHE_PREFIX}-precache-${RELEASE_ID}`');
    expect(output).not.toContain('__PRECACHE_');
  });
});

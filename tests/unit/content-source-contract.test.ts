import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadConfig } from '../../tools/content-compiler/config';

describe('external content source contract', () => {
  it('requires an explicit compiler source instead of an application-repository mirror', () => {
    expect(() => loadConfig(
      ['node', 'content-compiler', 'compile'],
      {},
    )).toThrow(/CONTENT_SOURCE_PATH|--source/);
  });

  it('keeps Astro and npm entry points on the prepared content boundary', async () => {
    const contentConfig = await readFile('src/content.config.ts', 'utf8');
    const packageJson = JSON.parse(await readFile('package.json', 'utf8')) as {
      scripts: Record<string, string>;
    };

    expect(contentConfig).toContain('./.build/content/blog');
    expect(contentConfig).not.toContain('BLOG_CONTENT_SOURCE');
    expect(packageJson.scripts['content:prepare']).toBe('bash tools/ci/prepare-content.sh');
    for (const entryPoint of ['dev', 'build', 'check']) {
      expect(packageJson.scripts[entryPoint]).toContain('content:prepare');
    }
  });

  it('has no tracked legacy blog mirror', async () => {
    await expect(access(path.resolve('src/content/blog'), constants.F_OK))
      .rejects.toMatchObject({ code: 'ENOENT' });
  });
});

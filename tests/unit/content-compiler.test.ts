import { readFile, stat } from 'node:fs/promises';
import { mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { compileContent, writeCompilation } from '../../tools/content-compiler/compiler';
import type { CompilerConfig } from '../../tools/content-compiler/model';

const fixtureRoot = path.resolve('tests/fixtures/content-compiler');

function config(sourceDir: string, outputDir: string, mode: 'compat' | 'strict' = 'strict'): CompilerConfig {
  const artifactRoot = path.dirname(outputDir);
  return {
    command: 'compile',
    mode,
    sourceDir,
    outputDir,
    manifestPath: path.join(artifactRoot, 'content-manifest.json'),
    diagnosticsPath: path.join(artifactRoot, 'diagnostics.json'),
    migrationPath: path.join(artifactRoot, 'migration.json'),
  };
}

describe('content compiler', () => {
  it('resolves wikilinks, preserves GFM, and normalizes callouts', async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), 'content-compiler-'));
    const result = await compileContent(config(
      path.join(fixtureRoot, 'valid', 'Blog'),
      path.join(temp, 'content', 'blog'),
    ));

    expect(result.diagnostics.filter((item) => item.severity === 'error')).toEqual([]);
    const output = result.outputs.get('source.md');
    expect(output).toContain('[Read target](/posts/target/#section)');
    expect(output).toContain('> **NOTE — Accessible title**');
    expect(output).toContain('| Key | Value |');
    expect(output).toContain('[[Not a link inside code]]');
  });

  it('rejects local attachments', async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), 'content-compiler-'));
    const result = await compileContent(config(
      path.join(fixtureRoot, 'local-attachment', 'Blog'),
      path.join(temp, 'content', 'blog'),
    ));

    expect(result.diagnostics.map((item) => item.code)).toContain('LOCAL_ATTACHMENT_UNSUPPORTED');
  });

  it('requires explicit identity in strict mode and suggests it in compat mode', async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), 'content-compiler-'));
    const source = path.resolve('src/content/blog');
    const strict = await compileContent(config(source, path.join(temp, 'strict'), 'strict'));
    const compat = await compileContent(config(source, path.join(temp, 'compat'), 'compat'));

    expect(strict.diagnostics.some((item) => item.code === 'MISSING_EXPLICIT_ID' && item.severity === 'error')).toBe(true);
    expect(compat.diagnostics.some((item) => item.code === 'MISSING_EXPLICIT_ID' && item.severity === 'warning')).toBe(true);
  });

  it('is deterministic and never mutates the source tree', async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), 'content-compiler-'));
    const source = path.join(fixtureRoot, 'valid', 'Blog');
    const sourceFile = path.join(source, 'source.md');
    const before = {
      contents: await readFile(sourceFile, 'utf8'),
      mtime: (await stat(sourceFile)).mtimeMs,
    };
    const first = await compileContent(config(source, path.join(temp, 'first')));
    const second = await compileContent(config(source, path.join(temp, 'second')));
    await writeCompilation(config(source, path.join(temp, 'first')), first);
    await writeCompilation(config(source, path.join(temp, 'second')), second);

    expect(first.manifest.manifestHash).toBe(second.manifest.manifestHash);
    expect(await readFile(path.join(temp, 'first', 'source.md'), 'utf8'))
      .toBe(await readFile(path.join(temp, 'second', 'source.md'), 'utf8'));
    expect(await readFile(sourceFile, 'utf8')).toBe(before.contents);
    expect((await stat(sourceFile)).mtimeMs).toBe(before.mtime);
  });
});

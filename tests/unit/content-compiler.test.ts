import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
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

  it('rejects duplicate public identities before writing output', async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), 'content-compiler-'));
    const source = path.join(temp, 'Blog');
    await mkdir(source, { recursive: true });
    const frontmatter = (title: string, slug: string) => `---
id: duplicate-id
slug: ${slug}
title: ${title}
created: 2026-01-01
tags: []
---
`;
    await writeFile(path.join(source, 'a.md'), frontmatter('A', 'duplicate-slug'));
    await writeFile(path.join(source, 'b.md'), frontmatter('B', 'duplicate-slug'));

    const result = await compileContent(config(source, path.join(temp, 'output')));
    expect(result.diagnostics.map((item) => item.code)).toEqual(expect.arrayContaining([
      'DUPLICATE_ID',
      'DUPLICATE_SLUG',
    ]));
    await expect(writeCompilation(config(source, path.join(temp, 'output')), result))
      .rejects.toThrow(/blocking diagnostics/);
  });

  it('fails ambiguous basename links and lists every published candidate', async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), 'content-compiler-'));
    const source = path.join(temp, 'Blog');
    await mkdir(path.join(source, 'a'), { recursive: true });
    await mkdir(path.join(source, 'b'), { recursive: true });
    const article = (id: string, slug: string, title: string, body = '') => `---
id: ${id}
slug: ${slug}
title: ${title}
created: 2026-01-01
tags: []
---
${body}
`;
    await writeFile(path.join(source, 'source.md'), article(
      'source',
      'source',
      'Source',
      '[[target]]',
    ));
    await writeFile(path.join(source, 'a', 'target.md'), article('target-a', 'target-a', 'A'));
    await writeFile(path.join(source, 'b', 'target.md'), article('target-b', 'target-b', 'B'));

    const result = await compileContent(config(source, path.join(temp, 'output')));
    const ambiguity = result.diagnostics.find((item) => item.code === 'WIKILINK_AMBIGUOUS');
    expect(ambiguity?.details?.candidates).toEqual(['a/target.md', 'b/target.md']);
  });

  it('rejects links that escape or are absent from the Blog publish boundary', async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), 'content-compiler-'));
    const source = path.join(temp, 'Blog');
    await mkdir(source, { recursive: true });
    await writeFile(path.join(source, 'source.md'), `---
id: source
slug: source
title: Source
created: 2026-01-01
tags: []
---
[[../Private/secret]]
[[missing]]
`);

    const result = await compileContent(config(source, path.join(temp, 'output')));
    expect(result.diagnostics.map((item) => item.code)).toEqual(expect.arrayContaining([
      'WIKILINK_OUTSIDE_PUBLISH_ROOT',
      'WIKILINK_NOT_FOUND',
    ]));
    expect(result.inventory.records.map((record) => record.sourcePath)).toEqual(['source.md']);
  });

  it('atomically removes output for an article deleted from the next content SHA', async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), 'content-compiler-'));
    const source = path.join(temp, 'Blog');
    const output = path.join(temp, 'output');
    await mkdir(source, { recursive: true });
    const article = (id: string) => `---
id: ${id}
slug: ${id}
title: ${id}
created: 2026-01-01
tags: []
---
${id}
`;
    await writeFile(path.join(source, 'keep.md'), article('keep'));
    await writeFile(path.join(source, 'delete.md'), article('delete'));

    const first = await compileContent(config(source, output));
    await writeCompilation(config(source, output), first);
    expect(await readFile(path.join(output, 'delete.md'), 'utf8')).toContain('delete');

    await rm(path.join(source, 'delete.md'));
    const second = await compileContent(config(source, output));
    await writeCompilation(config(source, output), second);

    await expect(stat(path.join(output, 'delete.md'))).rejects.toMatchObject({ code: 'ENOENT' });
    expect(await readFile(path.join(output, 'keep.md'), 'utf8')).toContain('keep');
    expect(second.manifest.articleCount).toBe(1);
  });
});

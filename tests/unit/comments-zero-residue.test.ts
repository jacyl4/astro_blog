import { mkdir, writeFile } from 'node:fs/promises';
import { mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { findCommentResidue } from '../../tools/release/comments-zero-residue';

describe('comment decommission scanner', () => {
  it('finds runtime identifiers and comment-related filenames', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'comment-residue-'));
    await mkdir(path.join(root, 'src'), { recursive: true });
    await writeFile(path.join(root, 'src', 'CommentsPanel.ts'), 'PUBLIC_COMMENTS_API_BASE');

    const findings = await findCommentResidue(root, ['src']);
    expect(findings.some((finding) => finding.includes('comment-related filename'))).toBe(true);
    expect(findings.some((finding) => finding.includes('PUBLIC_COMMENTS_API_BASE'))).toBe(true);
  });

  it('accepts a runtime tree without comment capability', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'comment-residue-'));
    await mkdir(path.join(root, 'src'), { recursive: true });
    await writeFile(path.join(root, 'src', 'main.ts'), 'export const feature = "blog";');

    await expect(findCommentResidue(root, ['src'])).resolves.toEqual([]);
  });
});

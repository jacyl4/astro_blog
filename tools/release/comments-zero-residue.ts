import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { walkFiles } from './manifest';

const DEFAULT_TARGETS = [
  'src',
  'public',
  'cloudflare',
  '.github',
  '.gitlab-ci.yml',
  'package.json',
  'astro.config.mjs',
  'wrangler.jsonc',
  'dist',
];

const PATTERNS = [
  /CommentsPanel/,
  /comments-panel/i,
  /PUBLIC_COMMENTS_API_BASE/,
  /COMMENTS_CONFIG/,
  /\/api\/comments/,
  /\/auth\/github/,
  /astro-blog-comments/i,
];

export async function findCommentResidue(
  root: string,
  targets: string[] = DEFAULT_TARGETS,
): Promise<string[]> {
  const findings: string[] = [];

  for (const target of targets) {
    const absolute = path.join(root, target);
    let targetStat;
    try {
      targetStat = await stat(absolute);
    } catch {
      continue;
    }

    const files = targetStat.isDirectory() ? await walkFiles(absolute) : [absolute];
    for (const file of files) {
      const relative = path.relative(root, file);
      if (/comment/i.test(path.basename(file))) {
        findings.push(`${relative}: comment-related filename`);
      }

      let contents: string;
      try {
        contents = await readFile(file, 'utf8');
      } catch {
        continue;
      }

      for (const pattern of PATTERNS) {
        if (pattern.test(contents)) {
          findings.push(`${relative}: matches ${pattern}`);
        }
      }
    }
  }

  return [...new Set(findings)].sort();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const findings = await findCommentResidue(process.cwd());
  if (findings.length > 0) {
    console.error(findings.join('\n'));
    process.exitCode = 1;
  } else {
    console.log('comment runtime residue scan passed');
  }
}

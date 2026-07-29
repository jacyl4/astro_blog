import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const roots = ['.build/evidence', 'operations'];
const forbidden = [
  /-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----/,
  /\b(?:CI_JOB_TOKEN|CLOUDFLARE_API_TOKEN|GITLAB_TOKEN|SSHPASS)\s*[:=]\s*\S+/i,
  /\bAuthorization\s*:\s*(?:Bearer|Basic)\s+\S+/i,
  /\b(?:glpat|github_pat|ghp|sk)-[A-Za-z0-9_-]{12,}\b/,
  /(?:^|\/)(?:Clippings|Private|私密)(?:\/|$)/i,
];

async function filesUnder(root: string): Promise<string[]> {
  const files: string[] = [];
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...await filesUnder(target));
    else if (entry.isFile()) files.push(target);
  }
  return files;
}

const violations: Array<{ file: string; rule: string }> = [];
for (const root of roots) {
  for (const file of await filesUnder(root)) {
    const buffer = await readFile(file);
    if (buffer.includes(0)) continue;
    const text = buffer.toString('utf8');
    for (const rule of forbidden) {
      if (rule.test(text)) violations.push({ file, rule: String(rule) });
    }
  }
}

if (violations.length > 0) {
  console.error(JSON.stringify({ violations }, null, 2));
  process.exitCode = 1;
} else {
  console.log('release evidence privacy verification passed');
}

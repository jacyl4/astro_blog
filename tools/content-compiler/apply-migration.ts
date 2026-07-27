import { readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';

interface Suggestion {
  sourcePath: string;
  id: string;
  slug: string;
}

interface MigrationReport {
  suggestions: Suggestion[];
}

function option(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const sourceDir = path.resolve(option('source') ?? '');
const migrationPath = path.resolve(
  option('migration') ?? '.build/diagnostics/content-migration.json',
);
const apply = process.argv.includes('--apply');

if (!option('source')) {
  throw new Error('Missing required --source <Blog directory>');
}

const report = JSON.parse(await readFile(migrationPath, 'utf8')) as MigrationReport;
const changes: string[] = [];

for (const suggestion of report.suggestions) {
  const absolute = path.resolve(sourceDir, suggestion.sourcePath);
  if (!absolute.startsWith(`${sourceDir}${path.sep}`)) {
    throw new Error(`Migration path escapes source root: ${suggestion.sourcePath}`);
  }
  const raw = await readFile(absolute, 'utf8');
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(raw);
  if (!match) throw new Error(`Missing YAML frontmatter: ${suggestion.sourcePath}`);
  const parsed = parseYaml(match[1]!) as Record<string, unknown>;

  for (const [key, expected] of Object.entries({
    id: suggestion.id,
    slug: suggestion.slug,
  })) {
    if (parsed[key] !== undefined && parsed[key] !== expected) {
      throw new Error(
        `${suggestion.sourcePath}: existing ${key} does not match migration suggestion`,
      );
    }
  }
  if (parsed.id === suggestion.id && parsed.slug === suggestion.slug) continue;

  const newline = raw.includes('\r\n') ? '\r\n' : '\n';
  const prefix = `---${newline}id: ${suggestion.id}${newline}slug: ${suggestion.slug}${newline}`;
  const next = raw.replace(/^---\r?\n/, prefix);
  changes.push(suggestion.sourcePath);

  if (apply) {
    const temporary = `${absolute}.migration-${process.pid}`;
    await writeFile(temporary, next);
    await rename(temporary, absolute);
  }
}

console.log(JSON.stringify({
  mode: apply ? 'apply' : 'dry-run',
  changedFiles: changes.length,
  files: changes,
}, null, 2));

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { walkFiles, toPosixPath } from '../release/manifest';

const srcRoot = path.resolve('src');
const sourceFiles = (await walkFiles(srcRoot)).filter((file) => /\.(?:ts|astro)$/.test(file));
const errors: string[] = [];
const imports = new Map<string, string[]>();

function resolveSourceImport(fromFile: string, specifier: string): string | undefined {
  if (!specifier.startsWith('.') && !specifier.startsWith('@/')) return undefined;
  const base = specifier.startsWith('@/')
    ? path.join(srcRoot, specifier.slice(2))
    : path.resolve(path.dirname(fromFile), specifier);
  for (const candidate of [
    base,
    `${base}.ts`,
    `${base}.astro`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.astro'),
  ]) {
    if (existsSync(candidate)) return path.resolve(candidate);
  }
  return undefined;
}

for (const file of sourceFiles) {
  const relative = toPosixPath(path.relative(process.cwd(), file));
  const source = readFileSync(file, 'utf8');

  if (
    !relative.startsWith('src/modules/blog/')
    && /from\s+['"]@\/modules\/blog\//.test(source)
  ) {
    errors.push(`${relative}: deep import into blog module`);
  }
  if (
    relative.startsWith('src/pages/')
    && /import\s*\{[^}]*\bgetCollection\b[^}]*\}\s*from\s*['"]astro:content['"]/.test(source)
  ) {
    errors.push(`${relative}: page directly imports getCollection`);
  }

  const dependencies: string[] = [];
  for (const match of source.matchAll(/(?:from\s+|import\s*\()\s*['"]([^'"]+)['"]/g)) {
    const resolved = resolveSourceImport(file, match[1]!);
    if (resolved) dependencies.push(resolved);
  }
  imports.set(file, dependencies);
}

const visiting = new Set<string>();
const visited = new Set<string>();
const stack: string[] = [];

function visit(file: string): void {
  if (visited.has(file)) return;
  if (visiting.has(file)) {
    const start = stack.indexOf(file);
    const cycle = [...stack.slice(start), file]
      .map((item) => toPosixPath(path.relative(process.cwd(), item)));
    errors.push(`dependency cycle: ${cycle.join(' -> ')}`);
    return;
  }
  visiting.add(file);
  stack.push(file);
  for (const dependency of imports.get(file) ?? []) visit(dependency);
  stack.pop();
  visiting.delete(file);
  visited.add(file);
}

for (const file of sourceFiles) visit(file);

if (errors.length > 0) {
  console.error([...new Set(errors)].join('\n'));
  process.exitCode = 1;
} else {
  console.log(`module boundary verification passed: ${sourceFiles.length} source files`);
}

import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import remarkFrontmatter from 'remark-frontmatter';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { parse as parseYaml } from 'yaml';
import { slugify } from '../../src/utils/stringUtils';
import { diagnostic } from './diagnostics';
import type {
  CompilerMode,
  ContentRecord,
  Diagnostic,
  Frontmatter,
  Inventory,
} from './model';
import { toPosixPath, walkFiles } from '../release/manifest';

interface YamlNode {
  type: 'yaml';
  value: string;
}

function indexRecord(
  index: Map<string, ContentRecord[]>,
  key: string,
  record: ContentRecord,
): void {
  const normalized = key.trim().toLocaleLowerCase('zh-CN');
  if (!normalized) return;
  const existing = index.get(normalized) ?? [];
  existing.push(record);
  index.set(normalized, existing);
}

function stableId(sourcePath: string): string {
  return `blog-${createHash('sha256').update(sourcePath).digest('hex').slice(0, 20)}`;
}

function getFrontmatter(raw: string): Frontmatter {
  const processor = unified().use(remarkParse).use(remarkFrontmatter);
  const tree = processor.parse(raw) as { children?: unknown[] };
  const yamlNode = tree.children?.find(
    (node): node is YamlNode =>
      typeof node === 'object' && node !== null && (node as YamlNode).type === 'yaml',
  );
  if (!yamlNode) return {};
  const parsed = parseYaml(yamlNode.value);
  return parsed && typeof parsed === 'object' ? parsed as Frontmatter : {};
}

function duplicateDiagnostics(
  code: string,
  label: string,
  index: Map<string, ContentRecord[]>,
): Diagnostic[] {
  return [...index.entries()].flatMap(([value, records]) => {
    if (records.length < 2) return [];
    return [diagnostic(
      code,
      'error',
      `Duplicate ${label}: ${value}`,
      records[0]?.sourcePath,
      undefined,
      { candidates: records.map((record) => record.sourcePath) },
    )];
  });
}

export async function buildInventory(
  sourceDir: string,
  mode: CompilerMode,
): Promise<Inventory> {
  const root = path.resolve(sourceDir);
  const allFiles = await walkFiles(root);
  const markdownFiles = allFiles.filter((file) => /\.mdx?$/i.test(file));
  const diagnostics: Diagnostic[] = [];
  const records: ContentRecord[] = [];
  const indexes: Inventory['indexes'] = {
    byId: new Map(),
    bySlug: new Map(),
    bySource: new Map(),
    byBasename: new Map(),
    byTitle: new Map(),
  };

  for (const absolutePath of markdownFiles) {
    const sourcePath = toPosixPath(path.relative(root, absolutePath));
    const raw = await readFile(absolutePath, 'utf8');
    let frontmatter: Frontmatter;
    try {
      frontmatter = getFrontmatter(raw);
    } catch (error) {
      diagnostics.push(diagnostic(
        'INVALID_FRONTMATTER',
        'error',
        error instanceof Error ? error.message : String(error),
        sourcePath,
      ));
      continue;
    }

    const originalTitle = typeof frontmatter.title === 'string' && frontmatter.title.trim()
      ? frontmatter.title.trim()
      : path.basename(sourcePath).replace(/\.mdx?$/i, '');
    const title = path.basename(sourcePath).replace(/\.mdx?$/i, '');
    const derivedId = stableId(sourcePath);
    const derivedSlug = slugify(originalTitle);
    const explicitId = typeof frontmatter.id === 'string' ? frontmatter.id.trim() : '';
    const explicitSlug = typeof frontmatter.slug === 'string' ? frontmatter.slug.trim() : '';
    const id = explicitId || derivedId;
    const slug = explicitSlug || derivedSlug;

    if (!explicitId) {
      diagnostics.push(diagnostic(
        'MISSING_EXPLICIT_ID',
        mode === 'strict' ? 'error' : 'warning',
        `Public article requires an explicit stable id; suggested: ${derivedId}`,
        sourcePath,
        undefined,
        { suggestedId: derivedId },
      ));
    }
    if (!explicitSlug) {
      diagnostics.push(diagnostic(
        'MISSING_EXPLICIT_SLUG',
        mode === 'strict' ? 'error' : 'warning',
        `Public article requires an explicit slug; suggested: ${derivedSlug}`,
        sourcePath,
        undefined,
        { suggestedSlug: derivedSlug },
      ));
    }
    if (!slug) {
      diagnostics.push(diagnostic(
        'EMPTY_SLUG',
        'error',
        'Article title and slug cannot produce a public URL',
        sourcePath,
      ));
      continue;
    }
    if (!frontmatter.created) {
      diagnostics.push(diagnostic(
        'MISSING_CREATED',
        'error',
        'Public article requires created frontmatter',
        sourcePath,
      ));
    }
    if (frontmatter.tags !== undefined && !Array.isArray(frontmatter.tags)) {
      diagnostics.push(diagnostic(
        'INVALID_TAGS',
        'error',
        'tags must be an array of strings',
        sourcePath,
      ));
    }

    const segments = sourcePath.split('/');
    const category = segments.length > 1 ? segments[0]! : 'Uncategorized';
    const record: ContentRecord = {
      sourcePath,
      absolutePath,
      id,
      slug,
      permalink: `/posts/${slug}/`,
      title,
      originalTitle,
      category,
      frontmatter,
      sourceSha256: createHash('sha256').update(raw).digest('hex'),
    };
    records.push(record);

    const sourceWithoutExtension = sourcePath.replace(/\.mdx?$/i, '');
    indexRecord(indexes.byId, id, record);
    indexRecord(indexes.bySlug, slug, record);
    indexRecord(indexes.bySource, sourceWithoutExtension, record);
    indexRecord(indexes.byBasename, path.basename(sourceWithoutExtension), record);
    indexRecord(indexes.byTitle, originalTitle, record);
  }

  diagnostics.push(
    ...duplicateDiagnostics('DUPLICATE_ID', 'id', indexes.byId),
    ...duplicateDiagnostics('DUPLICATE_SLUG', 'slug', indexes.bySlug),
  );

  records.sort((a, b) => a.sourcePath.localeCompare(b.sourcePath));
  return { records, diagnostics, indexes };
}

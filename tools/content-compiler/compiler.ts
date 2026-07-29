import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Root } from 'mdast';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import remarkWikiLink from 'remark-wiki-link';
import { unified } from 'unified';
import { stringify as stringifyYaml } from 'yaml';
import { hasErrors } from './diagnostics';
import { buildInventory } from './inventory';
import type {
  CompilerConfig,
  ContentManifest,
  ContentRecord,
  Diagnostic,
  Inventory,
} from './model';
import { atomicReplaceDirectory } from './output-transaction';
import { transformCallouts } from './plugins/callouts';
import { detectUnsupportedSyntax } from './plugins/unsupported';
import { resolveWikiLink, type WikiLinkNode } from './plugins/wikilinks';
import { sha256, stableJson } from '../release/manifest';

interface MutableNode {
  type: string;
  value?: string;
  children?: MutableNode[];
  position?: { start?: { line?: number; column?: number } };
  data?: { alias?: string };
}

interface CompilationResult {
  inventory: Inventory;
  diagnostics: Diagnostic[];
  outputs: Map<string, string>;
  manifest: ContentManifest;
}

function detectContentSha(sourceDir: string): string {
  if (process.env.CONTENT_SHA) return process.env.CONTENT_SHA;
  try {
    return execFileSync('git', ['-C', sourceDir, 'rev-parse', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return 'local';
  }
}

function replaceWikiLinks(
  node: MutableNode,
  inventory: Inventory,
  sourcePath: string,
  diagnostics: Diagnostic[],
): void {
  if (!node.children) return;
  node.children = node.children.map((child) => {
    if (child.type === 'wikiLink') {
      return resolveWikiLink(
        child as WikiLinkNode,
        inventory,
        sourcePath,
        diagnostics,
      ) as MutableNode ?? child;
    }
    replaceWikiLinks(child, inventory, sourcePath, diagnostics);
    return child;
  });
}

function normalizedFrontmatter(record: ContentRecord): Record<string, unknown> {
  const tags = Array.isArray(record.frontmatter.tags)
    ? record.frontmatter.tags
        .filter((tag): tag is string => typeof tag === 'string')
        .map((tag) => tag.replace(/^#/, '').trim())
        .filter(Boolean)
    : [];

  const output: Record<string, unknown> = {
    id: record.id,
    slug: record.slug,
    title: record.title,
    originalTitle: record.originalTitle,
    created: record.frontmatter.created,
  };
  if (record.frontmatter.updated) output.updated = record.frontmatter.updated;
  output.tags = tags;
  output.category = record.category;
  return output;
}

function setFrontmatter(tree: MutableNode, record: ContentRecord): void {
  const yaml = stringifyYaml(normalizedFrontmatter(record), {
    lineWidth: 0,
    sortMapEntries: true,
  }).trimEnd();
  const first = tree.children?.[0];
  if (first?.type === 'yaml') {
    first.value = yaml;
  } else {
    tree.children = [{ type: 'yaml', value: yaml }, ...(tree.children ?? [])];
  }
}

async function transformRecord(
  record: ContentRecord,
  inventory: Inventory,
  diagnostics: Diagnostic[],
): Promise<string> {
  const raw = await readFile(record.absolutePath, 'utf8');
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkFrontmatter)
    .use(remarkWikiLink, { aliasDivider: '|' })
    .use(remarkStringify, {
      bullet: '-',
      fences: true,
      listItemIndent: 'one',
    });
  const tree = processor.parse(raw) as Root & MutableNode;

  detectUnsupportedSyntax(tree, record.sourcePath, diagnostics);
  replaceWikiLinks(tree, inventory, record.sourcePath, diagnostics);
  transformCallouts(tree);
  setFrontmatter(tree, record);

  return String(processor.stringify(tree)).replace(/\r\n/g, '\n');
}

function buildManifest(
  config: CompilerConfig,
  records: ContentRecord[],
  contentSha: string,
): ContentManifest {
  const manifestRecords = records.map((record) => ({
    sourcePath: record.sourcePath,
    id: record.id,
    slug: record.slug,
    permalink: record.permalink,
    title: record.title,
    originalTitle: record.originalTitle,
    category: record.category,
    sourceSha256: record.sourceSha256,
    outputSha256: record.outputSha256!,
  }));
  const manifestHash = createHash('sha256')
    .update(stableJson(manifestRecords))
    .digest('hex');
  return {
    schemaVersion: 1,
    compilerVersion: 1,
    mode: config.mode,
    contentSha,
    manifestHash,
    articleCount: records.length,
    records: manifestRecords,
  };
}

export async function compileContent(config: CompilerConfig): Promise<CompilationResult> {
  const source = path.resolve(config.sourceDir);
  const output = path.resolve(config.outputDir);
  if (output === source || output.startsWith(`${source}${path.sep}`)) {
    throw new Error('Output directory must not be inside the immutable content source');
  }

  const inventory = await buildInventory(source, config.mode);
  const diagnostics = [...inventory.diagnostics];
  const outputs = new Map<string, string>();

  for (const record of inventory.records) {
    const compiled = await transformRecord(record, inventory, diagnostics);
    outputs.set(record.sourcePath, compiled);
    record.outputSha256 = sha256(compiled);
  }

  const manifest = buildManifest(
    config,
    inventory.records,
    detectContentSha(source),
  );
  return { inventory, diagnostics, outputs, manifest };
}

export async function writeCompilation(
  config: CompilerConfig,
  result: CompilationResult,
): Promise<void> {
  if (hasErrors(result.diagnostics)) {
    throw new Error('Content compilation contains blocking diagnostics');
  }

  await atomicReplaceDirectory(config.outputDir, async (temporaryDir) => {
    for (const [sourcePath, compiled] of result.outputs) {
      const outputPath = path.join(temporaryDir, sourcePath);
      await mkdir(path.dirname(outputPath), { recursive: true });
      await writeFile(outputPath, compiled);
    }
  });

  await mkdir(path.dirname(config.manifestPath), { recursive: true });
  await writeFile(config.manifestPath, stableJson(result.manifest));
}

export function migrationReport(result: CompilationResult): unknown {
  return {
    schemaVersion: 1,
    suggestions: result.inventory.records.map((record) => ({
      sourcePath: record.sourcePath,
      id: record.id,
      slug: record.slug,
      permalink: record.permalink,
    })),
  };
}

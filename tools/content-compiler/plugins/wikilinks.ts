import type { Diagnostic, Inventory } from '../model';
import { diagnostic } from '../diagnostics';

interface Position {
  start?: { line?: number; column?: number };
}

export interface WikiLinkNode {
  type: 'wikiLink';
  value: string;
  data?: {
    alias?: string;
  };
  position?: Position;
}

interface LinkNode {
  type: 'link';
  url: string;
  children: Array<{ type: 'text'; value: string }>;
}

function normalize(value: string): string {
  return value.trim().replace(/\\/g, '/').replace(/\.mdx?$/i, '').toLocaleLowerCase('zh-CN');
}

function headingSlug(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('zh-CN')
    .replace(/[^\p{Letter}\p{Number}\s_-]/gu, '')
    .replace(/\s+/g, '-');
}

export function resolveWikiLink(
  node: WikiLinkNode,
  inventory: Inventory,
  sourcePath: string,
  diagnostics: Diagnostic[],
): LinkNode | null {
  const [rawTarget = '', rawHeading] = node.value.split('#', 2);
  const target = normalize(rawTarget);
  const position = node.position?.start;

  if (!target || target.startsWith('../') || target.includes('/../')) {
    diagnostics.push(diagnostic(
      'WIKILINK_OUTSIDE_PUBLISH_ROOT',
      'error',
      `Wikilink target escapes the Blog publish root: ${node.value}`,
      sourcePath,
      position,
    ));
    return null;
  }

  const candidateGroups = target.includes('/')
    ? [inventory.indexes.bySource.get(target) ?? []]
    : [
        inventory.indexes.byId.get(target) ?? [],
        inventory.indexes.bySlug.get(target) ?? [],
        inventory.indexes.bySource.get(target) ?? [],
        inventory.indexes.byBasename.get(target) ?? [],
        inventory.indexes.byTitle.get(target) ?? [],
      ];
  const candidates = [...new Map(
    candidateGroups.flat().map((record) => [record.sourcePath, record]),
  ).values()];

  if (candidates.length === 0) {
    diagnostics.push(diagnostic(
      'WIKILINK_NOT_FOUND',
      'error',
      `Wikilink target is not published from Blog/: ${node.value}`,
      sourcePath,
      position,
    ));
    return null;
  }
  if (candidates.length > 1) {
    diagnostics.push(diagnostic(
      'WIKILINK_AMBIGUOUS',
      'error',
      `Wikilink target is ambiguous: ${node.value}`,
      sourcePath,
      position,
      { candidates: candidates.map((record) => record.sourcePath) },
    ));
    return null;
  }

  const targetRecord = candidates[0]!;
  const fragment = rawHeading ? `#${headingSlug(rawHeading)}` : '';
  return {
    type: 'link',
    url: `${targetRecord.permalink}${fragment}`,
    children: [{
      type: 'text',
      value: node.data?.alias || rawHeading || targetRecord.title,
    }],
  };
}

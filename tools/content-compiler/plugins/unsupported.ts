import type { Diagnostic } from '../model';
import { diagnostic } from '../diagnostics';

interface Node {
  type: string;
  value?: string;
  url?: string;
  lang?: string | null;
  position?: { start?: { line?: number; column?: number } };
  children?: Node[];
}

const LOCAL_ATTACHMENT_EXTENSIONS = /\.(?:png|jpe?g|gif|webp|svg|avif|mp3|wav|ogg|m4a|mp4|webm|mov|pdf)$/i;

function isRelativeLocalUrl(value: string): boolean {
  return !/^(?:https?:|mailto:|data:|\/|#)/i.test(value);
}

export function detectUnsupportedSyntax(
  tree: Node,
  sourcePath: string,
  diagnostics: Diagnostic[],
): void {
  visit(tree, undefined);

  function visit(node: Node, parent: Node | undefined): void {
    const position = node.position?.start;

    if (
      node.type === 'code'
      && typeof node.lang === 'string'
      && /^(?:dataview|dataviewjs|templater)$/i.test(node.lang)
    ) {
      diagnostics.push(diagnostic(
        'UNSUPPORTED_OBSIDIAN_PLUGIN',
        'error',
        `Executable Obsidian plugin block is not supported: ${node.lang}`,
        sourcePath,
        position,
      ));
    }

    if (
      (node.type === 'image' || node.type === 'link')
      && node.url
      && isRelativeLocalUrl(node.url)
      && LOCAL_ATTACHMENT_EXTENSIONS.test(node.url.split(/[?#]/, 1)[0] ?? '')
    ) {
      diagnostics.push(diagnostic(
        'LOCAL_ATTACHMENT_UNSUPPORTED',
        'error',
        `Local attachment publishing is not supported: ${node.url}`,
        sourcePath,
        position,
      ));
    }

    if (
      node.type === 'wikiLink'
      && parent?.children
    ) {
      const index = parent.children.indexOf(node);
      const previous = index > 0 ? parent.children[index - 1] : undefined;
      if (previous?.type === 'text' && previous.value?.endsWith('!')) {
        diagnostics.push(diagnostic(
          'TRANSCLUSION_UNSUPPORTED',
          'error',
          `Obsidian transclusion is not supported: ![[${node.value ?? ''}]]`,
          sourcePath,
          position,
        ));
      }
    }

    if (
      node.type === 'text'
      && node.value
      && /(?:^|\s)\^[A-Za-z0-9_-]+\s*$/m.test(node.value)
    ) {
      diagnostics.push(diagnostic(
        'BLOCK_REFERENCE_UNSUPPORTED',
        'error',
        'Obsidian block references are not supported',
        sourcePath,
        position,
      ));
    }

    for (const child of node.children ?? []) visit(child, node);
  }
}

interface Node {
  type: string;
  value?: string;
  children?: Node[];
}

const CALLOUT_PATTERN = /^\[!([A-Za-z][A-Za-z0-9_-]*)\][+-]?[ \t]*(.*?)(?:\n|$)/;

export function transformCallouts(tree: Node): void {
  visit(tree);
}

function visit(node: Node): void {
  if (node.type === 'blockquote') {
    const firstParagraph = node.children?.[0];
    const firstText = firstParagraph?.type === 'paragraph'
      ? firstParagraph.children?.[0]
      : undefined;
    const match = firstText?.type === 'text' && firstText.value
      ? CALLOUT_PATTERN.exec(firstText.value)
      : null;

    if (match && firstParagraph?.children) {
      const type = match[1]!.toUpperCase();
      const title = match[2]?.trim();
      const remainder = firstText!.value!.slice(match[0].length);
      const replacement: Node[] = [{
        type: 'strong',
        children: [{
          type: 'text',
          value: title ? `${type} — ${title}` : type,
        }],
      }];
      if (remainder) {
        replacement.push({ type: 'break' }, { type: 'text', value: remainder });
      }
      firstParagraph.children.splice(0, 1, ...replacement);
    }
  }

  for (const child of node.children ?? []) visit(child);
}

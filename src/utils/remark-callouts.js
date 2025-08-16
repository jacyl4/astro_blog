// Remark plugin to transform Obsidian-style callouts
// Syntax: > [!note] Optional title\n> content...
import { visit } from 'unist-util-visit';

/**
 * @typedef {import('mdast').Blockquote} Blockquote
 * @typedef {import('mdast').Paragraph} Paragraph
 * @typedef {import('mdast').Text} Text
 * @typedef {import('mdast').PhrasingContent} PhrasingContent
 */

const TYPE_MAP = {
  note: 'note',
  info: 'info',
  tip: 'tip',
  important: 'important',
  warning: 'warning',
  caution: 'caution',
  danger: 'danger',
  bug: 'bug',
  example: 'example',
  quote: 'quote',
  question: 'question',
  success: 'success',
};

/**
 * @param {string} s
 */
function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
}

/**
 * @returns {(tree: import('mdast').Root) => void}
 */
export default function remarkCallouts() {
  return (tree) => {
    visit(tree, 'blockquote', (node /** @type {Blockquote} */) => {
      if (!node.children || node.children.length === 0) return;
      const first = node.children[0];
      if (first.type !== 'paragraph') return;

      const para = /** @type {Paragraph} */ (first);
      if (!para.children || para.children.length === 0) return;

      const firstText = para.children[0];
      if (firstText.type !== 'text') return;

      const value = /** @type {Text} */ (firstText).value.trim();
      const match = value.match(/^\[!([A-Za-z]+)\](?:\s*(.*))?$/);
      if (!match) return;

      const rawType = match[1].toLowerCase();
      const type = TYPE_MAP[rawType] || 'note';
      const title = match[2] && match[2].trim().length > 0 ? match[2].trim() : capitalize(type);

      // Remove the marker line from the first paragraph
      // If there are more children in the paragraph, drop only the first text node line
      // Replace first paragraph content with remaining children (excluding the marker)
      const remaining = [...para.children];
      // If the first text node has more content after the marker on the same line, drop it
      // since we put it as title already.
      remaining.shift();
      // If the first paragraph still has content (other inline nodes after the marker), keep them as part of body
      if (remaining.length === 0) {
        // remove the first paragraph entirely
        node.children.shift();
      } else {
        para.children = remaining;
      }

      // Build a title paragraph node
      /** @type {Paragraph} */
      const titleNode = {
        type: 'paragraph',
        data: { hName: 'div', hProperties: { className: ['callout-title'] } },
        children: [{ type: 'text', value: title }],
      };

      // Insert title at the beginning
      node.children.unshift(titleNode);

      // Turn blockquote into a div with classes
      node.data = node.data || {};
      node.data.hName = 'div';
      node.data.hProperties = {
        className: ['callout', `callout-${type}`],
      };
    });
  };
}

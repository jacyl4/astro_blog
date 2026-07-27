import type { PageController } from '../runtime/types';

function normalizeFootnotes(document: Document): void {
  const adjustLinks = (selector: string) => {
    document.querySelectorAll<HTMLAnchorElement>(selector).forEach((link) => {
      const href = link.getAttribute('href');
      if (!href?.startsWith('#')) return;
      const id = href.slice(1);
      const target = document.getElementById(id)
        ?? document.querySelector<HTMLElement>(`[id$='${CSS.escape(id)}']`);
      if (target) link.setAttribute('href', `#${target.id}`);
      link.setAttribute('data-no-swup', 'true');
    });
  };
  adjustLinks('a[data-footnote-ref]');
  adjustLinks('.footnotes a[data-footnote-backref]');
}

export const footnotesController: PageController = {
  name: 'footnotes',
  mount({ document, window, generation }) {
    normalizeFootnotes(document);
    if (generation > 1) {
      const previousBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo({ top: 0, left: 0 });
      document.documentElement.style.scrollBehavior = previousBehavior;
    }
  },
};

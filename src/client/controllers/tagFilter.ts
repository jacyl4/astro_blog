import type { PageController } from '../runtime/types';

export const tagFilterController: PageController = {
  name: 'tag-filter',
  mount({ document, signal }) {
    document.querySelectorAll<HTMLElement>('[data-tag-list-root]').forEach((root) => {
      const input = root.querySelector<HTMLInputElement>('[data-tag-search]');
      const emptyState = root.querySelector<HTMLElement>('[data-tag-empty]');
      const entries = [...root.querySelectorAll<HTMLElement>('[data-tag-item]')].map((element) => ({
        element,
        keywords: `${element.dataset.tagName ?? ''} ${element.dataset.tagSlug ?? ''}`
          .trim()
          .toLocaleLowerCase('zh-CN'),
      }));
      if (!input || entries.length === 0) return;

      const applyFilter = () => {
        const query = input.value.trim().toLocaleLowerCase('zh-CN');
        let visible = 0;
        for (const entry of entries) {
          const matches = !query || entry.keywords.includes(query);
          entry.element.classList.toggle('hidden', !matches);
          if (matches) visible += 1;
        }
        emptyState?.classList.toggle('hidden', visible !== 0);
      };

      input.addEventListener('input', applyFilter, { signal });
      applyFilter();
    });
  },
};

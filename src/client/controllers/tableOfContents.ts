import type { PageController, PageContext } from '../runtime/types';

interface TocItem {
  element: HTMLElement;
  id: string;
  level: number;
  text: string;
}

interface TocState {
  items: TocItem[];
  page: number;
  activeId: string;
  observer: IntersectionObserver | null;
  hideTimer: number | null;
}

const ITEMS_PER_PAGE = 33;

function refs(document: Document) {
  return {
    container: document.getElementById('table-of-contents'),
    list: document.getElementById('toc-list'),
    pagination: document.getElementById('toc-pagination'),
    previous: document.getElementById('toc-prev') as HTMLButtonElement | null,
    next: document.getElementById('toc-next') as HTMLButtonElement | null,
    pageInfo: document.getElementById('toc-page-info'),
  };
}

function setVisibility(context: PageContext, state: TocState, visible: boolean): void {
  const { container } = refs(context.document);
  if (!container) return;
  if (state.hideTimer !== null) {
    context.window.clearTimeout(state.hideTimer);
    state.hideTimer = null;
  }
  if (visible) {
    container.style.display = 'block';
    context.window.requestAnimationFrame(() => container.classList.add('is-visible'));
  } else {
    container.classList.remove('is-visible');
    state.hideTimer = context.window.setTimeout(() => {
      container.style.display = 'none';
      state.hideTimer = null;
    }, 450);
  }
}

function collectItems(document: Document): TocItem[] {
  const main = document.querySelector('main');
  if (!main) return [];
  return [...main.querySelectorAll<HTMLElement>('h2, h3, h4, h5, h6')]
    .filter((heading) => !heading.closest('.footnotes'))
    .map((heading, index) => {
      if (!heading.id) heading.id = `heading-${index}`;
      return {
        element: heading,
        id: heading.id,
        level: Number.parseInt(heading.tagName.slice(1), 10) || 2,
        text: heading.textContent?.trim() || `Heading ${index + 1}`,
      };
    });
}

function render(context: PageContext, state: TocState): void {
  const { list, pagination, previous, next, pageInfo } = refs(context.document);
  if (!list) return;
  const totalPages = Math.max(1, Math.ceil(state.items.length / ITEMS_PER_PAGE));
  state.page = Math.min(Math.max(state.page, 0), totalPages - 1);
  list.replaceChildren();

  const visibleItems = state.items.slice(
    state.page * ITEMS_PER_PAGE,
    (state.page + 1) * ITEMS_PER_PAGE,
  );
  for (const item of visibleItems) {
    const listItem = context.document.createElement('li');
    const link = context.document.createElement('a');
    link.href = `#${item.id}`;
    link.textContent = item.text;
    link.dataset.headingId = item.id;
    link.setAttribute('data-no-swup', 'true');
    link.className = 'block w-full transition-colors duration-200 cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis';
    link.style.marginLeft = `${(item.level - 2) * 0.75}rem`;
    link.style.color = item.id === state.activeId ? 'var(--accent-color)' : 'var(--text-color)';
    link.style.fontWeight = item.id === state.activeId ? 'bold' : 'normal';
    link.addEventListener('click', (event) => {
      event.preventDefault();
      item.element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, { signal: context.signal });
    listItem.append(link);
    list.append(listItem);
  }

  if (pagination) pagination.style.display = totalPages > 1 ? 'flex' : 'none';
  if (pageInfo) pageInfo.textContent = totalPages > 1 ? `第 ${state.page + 1} / ${totalPages} 页` : '';
  if (previous) previous.disabled = state.page === 0;
  if (next) next.disabled = state.page === totalPages - 1;
}

function update(context: PageContext, state: TocState): void {
  state.observer?.disconnect();
  state.observer = null;
  const isPost = context.window.location.pathname.startsWith('/posts/');
  const isWide = context.window.matchMedia('(min-width: 1280px)').matches;
  if (!isPost || !isWide) {
    state.items = [];
    setVisibility(context, state, false);
    return;
  }

  state.items = collectItems(context.document);
  state.page = 0;
  state.activeId = state.items[0]?.id ?? '';
  if (state.items.length === 0) {
    setVisibility(context, state, false);
    return;
  }

  render(context, state);
  state.observer = new IntersectionObserver((entries) => {
    if (!context.isActive()) return;
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
    const activeId = visible[0]?.target.id;
    if (!activeId) return;
    state.activeId = activeId;
    const index = state.items.findIndex((item) => item.id === activeId);
    const page = Math.floor(Math.max(index, 0) / ITEMS_PER_PAGE);
    if (page !== state.page) state.page = page;
    render(context, state);
  }, { rootMargin: '0px 0px -80% 0px', threshold: 0 });
  for (const item of state.items) state.observer.observe(item.element);
  setVisibility(context, state, true);
}

const stateByWindow = new WeakMap<Window, TocState>();

export const tableOfContentsController: PageController = {
  name: 'table-of-contents',
  mount(context) {
    const state: TocState = {
      items: [],
      page: 0,
      activeId: '',
      observer: null,
      hideTimer: null,
    };
    stateByWindow.set(context.window, state);
    const { previous, next } = refs(context.document);
    previous?.addEventListener('click', () => {
      state.page = Math.max(0, state.page - 1);
      render(context, state);
    }, { signal: context.signal });
    next?.addEventListener('click', () => {
      const lastPage = Math.max(0, Math.ceil(state.items.length / ITEMS_PER_PAGE) - 1);
      state.page = Math.min(lastPage, state.page + 1);
      render(context, state);
    }, { signal: context.signal });
    update(context, state);

    return () => {
      state.observer?.disconnect();
      if (state.hideTimer !== null) context.window.clearTimeout(state.hideTimer);
      stateByWindow.delete(context.window);
      const { container, list } = refs(context.document);
      container?.classList.remove('is-visible');
      list?.replaceChildren();
    };
  },
  resize(context) {
    const state = stateByWindow.get(context.window);
    if (state) update(context, state);
  },
};

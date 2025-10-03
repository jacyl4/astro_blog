(() => {
  if (typeof window === 'undefined') return;
  if (window.__tocInitialized) return;

  const ITEMS_PER_PAGE = 39;
  const TOC_ID = 'table-of-contents';

  const state = {
    tocItems: [],
    headingIndexMap: new Map(),
    currentPage: 0,
    activeHeadingId: '',
    intersectionObserver: null,
    mutationObserver: null,
  };

  function getRefs() {
    return {
      tocContainer: document.getElementById(TOC_ID),
      tocList: document.getElementById('toc-list'),
      pagination: document.getElementById('toc-pagination'),
      prevBtn: document.getElementById('toc-prev'),
      nextBtn: document.getElementById('toc-next'),
      pageInfo: document.getElementById('toc-page-info'),
    };
  }

  function toggleVisibility(visible) {
    const { tocContainer } = getRefs();
    if (!tocContainer) return;
    tocContainer.classList.toggle('is-visible', visible);
    tocContainer.style.display = visible ? 'block' : 'none';
  }

  function highlightActiveLink() {
    document.querySelectorAll('#toc-list a').forEach((link) => {
      if (link instanceof HTMLElement) {
        link.style.color = 'var(--text-color)';
        link.style.fontWeight = 'normal';
      }
    });

    if (!state.activeHeadingId) return;

    const activeLink = document.querySelector(`#toc-list a[data-heading-id="${state.activeHeadingId}"]`);
    if (activeLink instanceof HTMLElement) {
      activeLink.style.color = 'var(--accent-color)';
      activeLink.style.fontWeight = 'bold';
    }
  }

  function renderPage() {
    const { tocList, pagination, prevBtn, nextBtn, pageInfo } = getRefs();
    if (!tocList) return;

    const totalPages = Math.max(1, Math.ceil(state.tocItems.length / ITEMS_PER_PAGE));
    state.currentPage = Math.min(Math.max(state.currentPage, 0), totalPages - 1);

    tocList.innerHTML = '';
    const start = state.currentPage * ITEMS_PER_PAGE;
    const visibleItems = state.tocItems.slice(start, start + ITEMS_PER_PAGE);

    const idsInPage = new Set(visibleItems.map((item) => item.id));
    if (visibleItems.length > 0 && !idsInPage.has(state.activeHeadingId)) {
      state.activeHeadingId = visibleItems[0].id;
    }

    visibleItems.forEach(({ id, level, text }) => {
      const listItem = document.createElement('li');
      const link = document.createElement('a');

      link.href = `#${id}`;
      link.textContent = text;
      link.className = 'block w-full transition-colors duration-200 cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis';
      link.style.color = 'var(--text-color)';
      link.style.textDecoration = 'none';
      link.dataset.headingId = id;
      link.setAttribute('data-no-swup', 'true');

      listItem.style.marginLeft = `${(level - 2) * 0.75}rem`;
      listItem.appendChild(link);
      tocList.appendChild(listItem);

      link.addEventListener('click', (event) => {
        event.preventDefault();
        const target = document.getElementById(id);
        target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    if (pagination) {
      const hasMultiplePages = state.tocItems.length > ITEMS_PER_PAGE;
      pagination.style.display = hasMultiplePages ? 'flex' : 'none';
      if (pageInfo) {
        pageInfo.textContent = hasMultiplePages ? `第 ${state.currentPage + 1} / ${totalPages} 页` : '';
      }
      if (prevBtn instanceof HTMLButtonElement) {
        prevBtn.disabled = state.currentPage === 0;
      }
      if (nextBtn instanceof HTMLButtonElement) {
        nextBtn.disabled = state.currentPage >= totalPages - 1;
      }
    }

    highlightActiveLink();
  }

  function setPage(page) {
    if (page === state.currentPage) return;
    state.currentPage = page;
    renderPage();
  }

  function ensurePaginationHandlers() {
    const { prevBtn, nextBtn } = getRefs();

    if (prevBtn instanceof HTMLButtonElement && prevBtn.dataset.bound !== 'true') {
      prevBtn.dataset.bound = 'true';
      prevBtn.addEventListener('click', () => {
        if (state.tocItems.length === 0) return;
        setPage(Math.max(0, state.currentPage - 1));
      });
    }

    if (nextBtn instanceof HTMLButtonElement && nextBtn.dataset.bound !== 'true') {
      nextBtn.dataset.bound = 'true';
      nextBtn.addEventListener('click', () => {
        if (state.tocItems.length === 0) return;
        const totalPages = Math.ceil(state.tocItems.length / ITEMS_PER_PAGE);
        setPage(Math.min(totalPages - 1, state.currentPage + 1));
      });
    }
  }

  function observeHeadings() {
    if (state.intersectionObserver) {
      state.intersectionObserver.disconnect();
      state.intersectionObserver = null;
    }

    if (state.tocItems.length === 0) return;

    state.intersectionObserver = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length === 0) return;

        visibleEntries.sort((a, b) => a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top);
        const activeId = visibleEntries[0].target.getAttribute('id');
        if (!activeId) return;

        const index = state.headingIndexMap.get(activeId);
        if (typeof index === 'number') {
          const pageForHeading = Math.floor(index / ITEMS_PER_PAGE);
          if (pageForHeading !== state.currentPage) {
            state.currentPage = pageForHeading;
            renderPage();
          }
        }

        state.activeHeadingId = activeId;
        highlightActiveLink();
      },
      { rootMargin: '0px 0px -80% 0px', threshold: 0 }
    );

    state.tocItems.forEach((item) => {
      state.intersectionObserver?.observe(item.element);
    });
  }

  function buildTocItems() {
    const mainContent = document.querySelector('main');
    if (!mainContent) {
      state.tocItems = [];
      state.headingIndexMap.clear();
      return;
    }

    const headings = Array.from(mainContent.querySelectorAll('h2, h3, h4, h5, h6'))
      .filter((heading) => !heading.closest('.footnotes'));

    if (headings.length === 0) {
      state.tocItems = [];
      state.headingIndexMap.clear();
      return;
    }

    state.tocItems = headings.map((heading, index) => {
      if (!heading.id) {
        heading.id = `heading-${index}`;
      }

      const level = parseInt(heading.tagName.substring(1), 10) || 2;
      const text = heading.textContent ? heading.textContent.trim() : `Heading ${index + 1}`;

      return {
        element: heading,
        id: heading.id,
        level,
        text,
      };
    });

    state.headingIndexMap = new Map(state.tocItems.map((item, index) => [item.id, index]));
    state.currentPage = 0;
    state.activeHeadingId = '';
  }

  function updateToc() {
    const { tocContainer } = getRefs();
    const isPostPage = window.location.pathname.startsWith('/posts/');
    const isLargeScreen = window.matchMedia('(min-width: 1280px)').matches;

    if (!isPostPage || !tocContainer || !isLargeScreen) {
      state.tocItems = [];
      state.headingIndexMap.clear();
      state.intersectionObserver?.disconnect();
      state.intersectionObserver = null;
      toggleVisibility(false);
      return;
    }

    buildTocItems();

    if (state.tocItems.length === 0) {
      state.intersectionObserver?.disconnect();
      state.intersectionObserver = null;
      toggleVisibility(false);
      return;
    }

    ensurePaginationHandlers();
    renderPage();
    observeHeadings();
    toggleVisibility(true);
  }

  function bindMutationObserver() {
    if (state.mutationObserver) {
      state.mutationObserver.disconnect();
    }

    const mainContent = document.querySelector('main');
    if (!mainContent) return;

    state.mutationObserver = new MutationObserver((mutations) => {
      const hasAddedNodes = mutations.some((mutation) => mutation.addedNodes.length > 0);
      if (hasAddedNodes) {
        updateToc();
      }
    });

    state.mutationObserver.observe(mainContent, {
      childList: true,
      subtree: true,
    });
  }

  function initTableOfContents() {
    if (window.__tocInitialized) return;
    window.__tocInitialized = true;

    updateToc();
    bindMutationObserver();

    document.addEventListener('astro:page-load', () => {
      updateToc();
      bindMutationObserver();
    });

    document.addEventListener('astro:after-swap', () => {
      updateToc();
      bindMutationObserver();
    });

    document.addEventListener('DOMContentLoaded', () => {
      updateToc();
      bindMutationObserver();
    });

    if (!window.__tocResizeBound) {
      window.__tocResizeBound = true;
      window.addEventListener('resize', () => {
        updateToc();
      });
    }
  }

  initTableOfContents();
})();

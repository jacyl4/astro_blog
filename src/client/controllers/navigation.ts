import type { PageController } from '../runtime/types';

const BLOG_CONTEXTS = ['/posts/', '/categories/', '/tags/', '/archive/'];

function normalize(path: string): string {
  return path.endsWith('/') ? path : `${path}/`;
}

function isActiveHref(targetHref: string, currentPath: string): boolean {
  const normalizedHref = normalize(targetHref);
  const normalizedCurrent = normalize(currentPath);
  if (normalizedHref === '/') {
    return normalizedCurrent === '/'
      || BLOG_CONTEXTS.some((segment) => normalizedCurrent.startsWith(segment));
  }
  return normalizedCurrent.startsWith(normalizedHref);
}

function closeMobileMenu(document: Document): void {
  const menu = document.getElementById('mobile-menu');
  const button = document.getElementById('mobile-menu-button');
  menu?.setAttribute('data-state', 'closed');
  button?.setAttribute('aria-expanded', 'false');
}

export const navigationController: PageController = {
  name: 'navigation',
  mount({ document, window, signal }) {
    const currentPath = window.location.pathname;
    document.querySelectorAll<HTMLElement>('[data-nav-link]').forEach((anchor) => {
      const active = isActiveHref(anchor.dataset.navLink || '/', currentPath);
      anchor.classList.toggle('text-accent', active);
      anchor.classList.toggle('opacity-80', !active);
      anchor.classList.toggle('hover:opacity-100', !active);
      if (active) anchor.setAttribute('aria-current', 'page');
      else anchor.removeAttribute('aria-current');
    });

    const menuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    menuButton?.addEventListener('click', () => {
      const isOpen = mobileMenu?.getAttribute('data-state') === 'open';
      mobileMenu?.setAttribute('data-state', isOpen ? 'closed' : 'open');
      menuButton.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
    }, { signal });
    mobileMenu?.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => closeMobileMenu(document), { signal });
    });
  },
  resize({ document, window }) {
    if (window.matchMedia('(min-width: 768px)').matches) closeMobileMenu(document);
  },
};

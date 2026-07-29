import { footnotesController } from '../controllers/footnotes';
import { navigationController } from '../controllers/navigation';
import { tableOfContentsController } from '../controllers/tableOfContents';
import { tagFilterController } from '../controllers/tagFilter';
import { PageLifecycle } from './PageLifecycle';
import type { LifecycleSnapshot } from './types';

declare global {
  interface Window {
    __blogLifecycleStarted?: boolean;
    __blogLifecycleSnapshot?: () => LifecycleSnapshot;
  }
}

export function startClientRuntime(): void {
  if (window.__blogLifecycleStarted) return;
  window.__blogLifecycleStarted = true;

  const lifecycle = new PageLifecycle([
    footnotesController,
    navigationController,
    tagFilterController,
    tableOfContentsController,
  ]);
  const mount = () => lifecycle.mount(document, window);
  const destroy = () => lifecycle.destroy();
  const resize = () => lifecycle.resize();

  document.addEventListener('astro:before-swap', destroy);
  document.addEventListener('astro:page-load', mount);
  window.addEventListener('resize', resize, { passive: true });
  window.__blogLifecycleSnapshot = () => lifecycle.snapshot();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    mount();
  }
}

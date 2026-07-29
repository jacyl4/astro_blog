import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import type { LifecycleSnapshot } from '../../src/client/runtime/types';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

declare global {
  interface Window {
    __testLifecycleMetrics?: {
      activeSignalListeners: number;
      activeIntersectionObservers: number;
    };
    __lifecycleEventTrace?: Array<{
      event: string;
      path: string;
      timestamp: number;
    }>;
    __blogLifecycleSnapshot?: () => LifecycleSnapshot;
  }
}

async function waitForSwup(page: Page): Promise<void> {
  await expect(page.locator('html')).toHaveClass(/swup-enabled/);
}

async function currentLifecycleGeneration(page: Page): Promise<number> {
  await expect.poll(
    () => page.evaluate(() => window.__blogLifecycleSnapshot?.().mounted ?? false),
  ).toBe(true);
  return page.evaluate(() => window.__blogLifecycleSnapshot!().generation);
}

async function waitForLifecycleAfter(page: Page, previousGeneration: number): Promise<void> {
  await expect.poll(
    () => page.evaluate(() => window.__blogLifecycleSnapshot?.().generation ?? 0),
  ).toBeGreaterThan(previousGeneration);
  await expect.poll(
    () => page.evaluate(() => window.__blogLifecycleSnapshot?.().mounted ?? false),
  ).toBe(true);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const metrics = {
      activeSignalListeners: 0,
      activeIntersectionObservers: 0,
    };
    window.__testLifecycleMetrics = metrics;

    const originalAdd = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function (
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ) {
      if (
        listener
        && typeof options === 'object'
        && options.signal
        && !options.signal.aborted
      ) {
        metrics.activeSignalListeners += 1;
        options.signal.addEventListener('abort', () => {
          metrics.activeSignalListeners -= 1;
        }, { once: true });
      }
      return originalAdd.call(this, type, listener, options);
    };

    const NativeIntersectionObserver = window.IntersectionObserver;
    window.IntersectionObserver = class extends NativeIntersectionObserver {
      private counted = true;

      constructor(...args: ConstructorParameters<typeof IntersectionObserver>) {
        super(...args);
        metrics.activeIntersectionObservers += 1;
      }

      override disconnect() {
        if (this.counted) {
          metrics.activeIntersectionObservers -= 1;
          this.counted = false;
        }
        return super.disconnect();
      }
    };
  });
});

test('records the authoritative initial, swap, page-load, and history event order', async ({
  page,
}, testInfo) => {
  await page.addInitScript(() => {
    const trace: NonNullable<Window['__lifecycleEventTrace']> = [];
    window.__lifecycleEventTrace = trace;
    const record = (event: string) => {
      trace.push({
        event,
        path: window.location.pathname,
        timestamp: performance.now(),
      });
    };
    document.addEventListener('DOMContentLoaded', () => record('DOMContentLoaded'));
    document.addEventListener('astro:before-swap', () => record('astro:before-swap'));
    document.addEventListener('astro:page-load', () => record('astro:page-load'));
    window.addEventListener('popstate', () => record('popstate'));
  });

  await page.goto('/');
  await expect(page.locator('main')).toBeVisible();
  await waitForSwup(page);
  const postPath = await page.locator('main a[href^="/posts/"]').first().getAttribute('href');
  expect(postPath).toBeTruthy();

  await page.locator('main a[href^="/posts/"]').first().click();
  await page.waitForURL((url) => url.pathname === postPath);
  await expect(page.locator('main article.prose')).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('main .post-card').first()).toBeVisible();

  const trace = await page.evaluate(() => window.__lifecycleEventTrace ?? []);
  const events = trace.map((item) => item.event);
  expect(events[0]).toBe('DOMContentLoaded');
  expect(events.filter((event) => event === 'astro:before-swap')).toHaveLength(2);
  expect(events.filter((event) => event === 'astro:page-load').length).toBeGreaterThanOrEqual(2);
  expect(events.filter((event) => event === 'popstate')).toHaveLength(1);

  for (const [index, event] of events.entries()) {
    if (event !== 'astro:before-swap') continue;
    expect(events.slice(index + 1)).toContain('astro:page-load');
  }
  const popstateIndex = events.indexOf('popstate');
  const lastBeforeSwapIndex = events.lastIndexOf('astro:before-swap');
  expect(popstateIndex).toBeLessThan(lastBeforeSwapIndex);

  const evidence = {
    schemaVersion: 1,
    test: testInfo.title,
    browser: testInfo.project.name || 'chromium',
    trace,
  };
  const evidencePath = path.resolve('.build/evidence/lifecycle-event-order.json');
  await mkdir(path.dirname(evidencePath), { recursive: true });
  await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  await testInfo.attach('lifecycle-event-order', {
    body: Buffer.from(JSON.stringify(evidence, null, 2)),
    contentType: 'application/json',
  });
});

test('site has no comments runtime boundary', async ({ page, context }) => {
  const commentRequests: string[] = [];
  page.on('request', (request) => {
    if (/comment|\/auth\/github|\/auth\/session|\/api\/comments/i.test(request.url())) {
      commentRequests.push(request.url());
    }
  });

  await page.goto('/');
  await expect(page.locator('main')).toBeVisible();
  await waitForSwup(page);
  await expect(page.locator('#comments-panel')).toHaveCount(0);
  await expect(page.locator('script[src*="comments"]')).toHaveCount(0);
  await expect(page.locator('link[href*="comments"]')).toHaveCount(0);
  expect((await context.cookies()).filter((cookie) => /comment|session/i.test(cookie.name))).toEqual([]);
  expect(commentRequests).toEqual([]);
});

test('twenty Swup navigations do not grow page-scoped listeners or observers', async ({ page }) => {
  const runtimeRequests: string[] = [];
  page.on('request', (request) => {
    if (/\/api\/|\/auth\//.test(new URL(request.url()).pathname)) {
      runtimeRequests.push(request.url());
    }
  });

  await page.goto('/');
  await expect(page.locator('main')).toBeVisible();
  await waitForSwup(page);
  await currentLifecycleGeneration(page);

  const navigatePostAndHome = async () => {
    const homeGeneration = await currentLifecycleGeneration(page);
    const postLink = page.locator('main a[href^="/posts/"]').first();
    const postPath = await postLink.getAttribute('href');
    await postLink.click();
    await page.waitForURL((url) => url.pathname === postPath);
    await expect(page.locator('main article.prose')).toBeVisible();
    await waitForLifecycleAfter(page, homeGeneration);

    const postGeneration = await currentLifecycleGeneration(page);
    const homeLink = page.locator('[data-nav-link="/"]').first();
    await homeLink.click();
    await page.waitForURL((url) => url.pathname === '/');
    await expect(page.locator('main .post-card').first()).toBeVisible();
    await waitForLifecycleAfter(page, postGeneration);
  };

  // Warm lazy Swup plugins once; the assertion below measures page-scope growth,
  // not the integration's one-time initialization listeners.
  await navigatePostAndHome();
  const initial = await page.evaluate(() => ({ ...window.__testLifecycleMetrics! }));

  for (let index = 0; index < 10; index += 1) {
    await navigatePostAndHome();
  }

  const final = await page.evaluate(() => ({ ...window.__testLifecycleMetrics! }));
  expect(final.activeSignalListeners).toBe(initial.activeSignalListeners);
  expect(final.activeIntersectionObservers).toBe(initial.activeIntersectionObservers);
  expect(runtimeRequests).toEqual([]);
});

test('viewport changes do not produce data requests', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => {
    if (/\/api\/|\/auth\//.test(new URL(request.url()).pathname)) {
      requests.push(request.url());
    }
  });
  await page.goto('/');
  for (const width of [1279, 1280, 800, 1440, 640, 1440]) {
    await page.setViewportSize({ width, height: 900 });
  }
  expect(requests).toEqual([]);
});

test('browser back and forward preserve lifecycle behavior', async ({ page }) => {
  await page.goto('/');
  await waitForSwup(page);
  const postPath = await page.locator('main a[href^="/posts/"]').first().getAttribute('href');
  expect(postPath).toBeTruthy();

  await page.locator('main a[href^="/posts/"]').first().click();
  await page.waitForURL((url) => url.pathname === postPath);
  await expect(page.locator('main article.prose')).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('main .post-card').first()).toBeVisible();

  await page.goForward();
  await page.waitForURL((url) => url.pathname === postPath);
  await expect(page.locator('main article.prose')).toBeVisible();
});

test('primary navigation is keyboard reachable and exposes a current page', async ({ page }) => {
  await page.goto('/');
  const navigation = page.locator('#header-container nav');
  await expect(navigation).toBeVisible();
  await expect(navigation.locator('[aria-current="page"]').first()).toBeVisible();

  await page.keyboard.press('Tab');
  const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
  expect(['A', 'BUTTON']).toContain(focusedTag);
});

test.describe('PWA runtime', () => {
  test.use({ serviceWorkers: 'allow' });

  test('generated service worker controls the site and serves the home page offline', async ({
    page,
    context,
  }) => {
    await page.goto('/');
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      if (!registration.active) throw new Error('service worker did not activate');
      if (!navigator.serviceWorker.controller) {
        await new Promise<void>((resolve) => {
          navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true });
        });
      }
    });

    await expect.poll(async () => {
      try {
        return await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL.endsWith('/sw.js'));
      } catch {
        return false;
      }
    }).toBe(true);

    await context.setOffline(true);
    try {
      await page.reload();
      await expect(page.locator('main')).toBeVisible();
    } finally {
      await context.setOffline(false);
    }
  });
});

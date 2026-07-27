import { expect, test } from '@playwright/test';

declare global {
  interface Window {
    __testLifecycleMetrics?: {
      activeSignalListeners: number;
      activeIntersectionObservers: number;
    };
  }
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

test('site has no comments runtime boundary', async ({ page, context }) => {
  const commentRequests: string[] = [];
  page.on('request', (request) => {
    if (/comment|\/auth\/github|\/auth\/session|\/api\/comments/i.test(request.url())) {
      commentRequests.push(request.url());
    }
  });

  await page.goto('/');
  await expect(page.locator('main')).toBeVisible();
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

  const navigatePostAndHome = async () => {
    const postLink = page.locator('main a[href^="/posts/"]').first();
    const postPath = await postLink.getAttribute('href');
    await postLink.click();
    await page.waitForURL((url) => url.pathname === postPath);
    await expect(page.locator('main article.prose')).toBeVisible();

    const homeLink = page.locator('[data-nav-link="/"]').first();
    await homeLink.click();
    await page.waitForURL((url) => url.pathname === '/');
    await expect(page.locator('main .post-card').first()).toBeVisible();
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

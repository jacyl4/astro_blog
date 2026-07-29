import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 },
] as const;

async function waitForSwup(page: Page): Promise<void> {
  await expect(page.locator('html')).toHaveClass(/swup-enabled/);
}

for (const viewport of viewports) {
  test(`${viewport.name} viewport preserves the public navigation surface`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto('/');

    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('#header-container')).toBeVisible();
    await waitForSwup(page);
    if (viewport.name === 'mobile') {
      const menuButton = page.getByRole('button', { name: '主导航菜单' });
      await expect(menuButton).toBeVisible();
      await menuButton.click();
      await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
      await expect(page.locator('#mobile-menu [aria-current="page"]')).toBeVisible();
    } else {
      await expect(page.locator('ul.md\\:flex [aria-current="page"]')).toBeVisible();
    }

    const horizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(horizontalOverflow).toBeLessThanOrEqual(1);

    const postLink = page.locator('main a[href^="/posts/"]').first();
    const postPath = await postLink.getAttribute('href');
    expect(postPath).toBeTruthy();
    await postLink.click();
    await page.waitForURL((url) => url.pathname === postPath);
    await expect(page.locator('main article.prose')).toBeVisible();

    await testInfo.attach(`${viewport.name}-viewport`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  });
}

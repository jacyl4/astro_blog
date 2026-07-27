import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import type { RouteManifest } from '../../tools/release/manifest';

test('every baseline route is reachable over HTTP', async ({ request }) => {
  const manifest = JSON.parse(
    await readFile('baselines/routes.json', 'utf8'),
  ) as RouteManifest;
  const failures: Array<{ path: string; status: number }> = [];

  for (const route of manifest.routes) {
    const response = await request.get(route.path);
    if (response.status() !== 200) {
      failures.push({ path: route.path, status: response.status() });
    }
  }

  expect(failures).toEqual([]);
});

test('dynamic API-shaped paths stay outside the static site surface', async ({ request }) => {
  for (const path of ['/api/comments', '/auth/session', '/api/unknown']) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(404);
  }
});

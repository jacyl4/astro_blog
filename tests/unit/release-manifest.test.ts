import { mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { mkdtemp } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import {
  classifyRoute,
  createRouteManifest,
  diffRouteManifests,
  routePathFromHtml,
} from '../../tools/release/manifest';

describe('route manifest', () => {
  it('normalizes Astro directory output routes', () => {
    expect(routePathFromHtml('index.html')).toBe('/');
    expect(routePathFromHtml('posts/example/index.html')).toBe('/posts/example/');
    expect(routePathFromHtml('404.html')).toBe('/404.html');
  });

  it('classifies the public route families', () => {
    expect(classifyRoute('/')).toBe('home');
    expect(classifyRoute('/posts/example/')).toBe('post');
    expect(classifyRoute('/categories/example/')).toBe('category');
    expect(classifyRoute('/tags/example/')).toBe('tag');
    expect(classifyRoute('/archive/2026-07/')).toBe('archive');
    expect(classifyRoute('/404.html')).toBe('not-found');
  });

  it('creates a stable, sorted manifest and reports route removals', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'route-manifest-'));
    await mkdir(path.join(root, 'posts', 'b'), { recursive: true });
    await writeFile(path.join(root, 'posts', 'b', 'index.html'), '<html>B</html>');
    await writeFile(path.join(root, 'index.html'), '<html>Home</html>');

    const baseline = await createRouteManifest(root);
    const candidate = {
      ...baseline,
      routeCount: 1,
      routes: baseline.routes.filter((route) => route.path === '/'),
    };

    expect(baseline.routes.map((route) => route.path)).toEqual(['/', '/posts/b/']);
    expect(diffRouteManifests(baseline, candidate).removed).toEqual(['/posts/b/']);
  });
});

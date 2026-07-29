import { mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { mkdtemp } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import {
  assessRouteDiff,
  classifyRoute,
  createRouteManifest,
  diffRouteManifests,
  routePathFromHtml,
  type RouteManifest,
} from '../../tools/release/manifest';
import {
  assessMainContentBaseline,
  normalizeMainContent,
  type MainContentBaseline,
} from '../../tools/release/html-baseline';

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

  it('reports additions, removals, kind changes, and approved migrations independently', () => {
    const route = (
      path: string,
      kind: RouteManifest['routes'][number]['kind'],
    ): RouteManifest['routes'][number] => ({
      path,
      kind,
      file: path === '/' ? 'index.html' : `${path.slice(1)}index.html`,
      bytes: 1,
      sha256: path,
    });
    const baseline: RouteManifest = {
      schemaVersion: 1,
      routeCount: 3,
      hash: 'baseline',
      routes: [
        route('/', 'home'),
        route('/posts/old/', 'post'),
        route('/legacy/', 'other'),
      ],
    };
    const candidate: RouteManifest = {
      schemaVersion: 1,
      routeCount: 3,
      hash: 'candidate',
      routes: [
        route('/', 'home'),
        route('/posts/new/', 'post'),
        route('/legacy/', 'page'),
      ],
    };

    const diff = diffRouteManifests(baseline, candidate);
    expect(diff).toEqual({
      added: ['/posts/new/'],
      removed: ['/posts/old/'],
      kindChanged: [{ path: '/legacy/', baseline: 'other', candidate: 'page' }],
    });
    expect(assessRouteDiff(diff, {})).toMatchObject({
      approvedRedirects: [],
      unapprovedRemovals: ['/posts/old/'],
    });
    expect(assessRouteDiff(diff, { '/posts/old/': '/posts/new/' })).toMatchObject({
      approvedRedirects: ['/posts/old/'],
      unapprovedRemovals: [],
    });
  });

  it('ignores Astro scoped-style IDs but preserves semantic main content', () => {
    const first = '<main id="swup"><article data-astro-cid-abc123>Same</article></main>';
    const second = '<main id="swup"><article data-astro-cid-xyz789>Same</article></main>';
    const changed = '<main id="swup"><article data-astro-cid-xyz789>Changed</article></main>';

    expect(normalizeMainContent(first)).toBe(normalizeMainContent(second));
    expect(normalizeMainContent(first)).not.toBe(normalizeMainContent(changed));
  });

  it('accepts only the exact reviewed HTML difference hash', () => {
    const baseline: MainContentBaseline = {
      schemaVersion: 1,
      pageCount: 1,
      pages: [{ file: 'posts/a/index.html', sha256: 'old' }],
    };
    const candidate: MainContentBaseline = {
      schemaVersion: 1,
      pageCount: 1,
      pages: [{ file: 'posts/a/index.html', sha256: 'new' }],
    };

    expect(assessMainContentBaseline(baseline, candidate, {
      'posts/a/index.html': { sha256: 'new', reason: 'reviewed' },
    })).toEqual({ missing: [], changed: [], approved: ['posts/a/index.html'] });
    expect(assessMainContentBaseline(baseline, candidate, {
      'posts/a/index.html': { sha256: 'other', reason: 'stale' },
    }).changed).toEqual(['posts/a/index.html']);
  });
});

import { createHash } from 'node:crypto';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

export type RouteKind =
  | 'home'
  | 'post'
  | 'category'
  | 'tag'
  | 'archive'
  | 'page'
  | 'not-found'
  | 'other';

export interface RouteRecord {
  path: string;
  kind: RouteKind;
  file: string;
  bytes: number;
  sha256: string;
}

export interface RouteManifest {
  schemaVersion: 1;
  routeCount: number;
  hash: string;
  routes: RouteRecord[];
}

export interface AssetRecord {
  path: string;
  bytes: number;
  sha256: string;
}

export interface AssetManifest {
  schemaVersion: 1;
  assetCount: number;
  totalBytes: number;
  hash: string;
  assets: AssetRecord[];
}

export interface RouteDiff {
  added: string[];
  removed: string[];
  kindChanged: Array<{ path: string; baseline: RouteKind; candidate: RouteKind }>;
}

export interface RouteDiffAssessment extends RouteDiff {
  approvedRedirects: string[];
  unapprovedRemovals: string[];
}

export function sha256(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

export function stableJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function toPosixPath(value: string): string {
  return value.split(path.sep).join('/');
}

export function routePathFromHtml(relativeFile: string): string {
  const normalized = toPosixPath(relativeFile).replace(/^\/+/, '');

  if (normalized === 'index.html') {
    return '/';
  }

  if (normalized.endsWith('/index.html')) {
    return `/${normalized.slice(0, -'index.html'.length)}`;
  }

  return `/${normalized}`;
}

export function classifyRoute(routePath: string): RouteKind {
  if (routePath === '/') return 'home';
  if (routePath === '/404.html' || routePath === '/404/') return 'not-found';
  if (routePath.startsWith('/posts/')) return 'post';
  if (routePath.startsWith('/categories/')) return 'category';
  if (routePath.startsWith('/tags/')) return 'tag';
  if (routePath.startsWith('/archive/')) return 'archive';
  if (routePath === '/about/') return 'page';
  return 'other';
}

export async function walkFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkFiles(absolute));
    } else if (entry.isFile()) {
      files.push(absolute);
    }
  }

  return files.sort((a, b) => a.localeCompare(b));
}

export async function createRouteManifest(distDir: string): Promise<RouteManifest> {
  const root = path.resolve(distDir);
  const files = (await walkFiles(root)).filter((file) => file.endsWith('.html'));
  const routes: RouteRecord[] = [];

  for (const file of files) {
    const relativeFile = toPosixPath(path.relative(root, file));
    const contents = await readFile(file);
    const fileStat = await stat(file);
    const routePath = routePathFromHtml(relativeFile);
    routes.push({
      path: routePath,
      kind: classifyRoute(routePath),
      file: relativeFile,
      bytes: fileStat.size,
      sha256: sha256(contents),
    });
  }

  routes.sort((a, b) => a.path.localeCompare(b.path));
  return {
    schemaVersion: 1,
    routeCount: routes.length,
    hash: sha256(stableJson(routes)),
    routes,
  };
}

export async function createAssetManifest(distDir: string): Promise<AssetManifest> {
  const root = path.resolve(distDir);
  const files = (await walkFiles(root)).filter((file) => {
    const relative = toPosixPath(path.relative(root, file));
    return !file.endsWith('.html') && relative !== '_meta/build-manifest.json';
  });
  const assets: AssetRecord[] = [];

  for (const file of files) {
    const contents = await readFile(file);
    const fileStat = await stat(file);
    assets.push({
      path: `/${toPosixPath(path.relative(root, file))}`,
      bytes: fileStat.size,
      sha256: sha256(contents),
    });
  }

  assets.sort((a, b) => a.path.localeCompare(b.path));
  return {
    schemaVersion: 1,
    assetCount: assets.length,
    totalBytes: assets.reduce((sum, asset) => sum + asset.bytes, 0),
    hash: sha256(stableJson(assets)),
    assets,
  };
}

export function diffRouteManifests(
  baseline: RouteManifest,
  candidate: RouteManifest,
): RouteDiff {
  const baselineByPath = new Map(baseline.routes.map((route) => [route.path, route]));
  const candidateByPath = new Map(candidate.routes.map((route) => [route.path, route]));

  const added = candidate.routes
    .filter((route) => !baselineByPath.has(route.path))
    .map((route) => route.path);
  const removed = baseline.routes
    .filter((route) => !candidateByPath.has(route.path))
    .map((route) => route.path);
  const kindChanged = baseline.routes.flatMap((route) => {
    const next = candidateByPath.get(route.path);
    if (!next || next.kind === route.kind) return [];
    return [{ path: route.path, baseline: route.kind, candidate: next.kind }];
  });

  return { added, removed, kindChanged };
}

export function assessRouteDiff(
  diff: RouteDiff,
  redirects: Record<string, string>,
): RouteDiffAssessment {
  const approvedRedirects = diff.removed.filter((route) => Boolean(redirects[route]));
  const unapprovedRemovals = diff.removed.filter((route) => !redirects[route]);

  return {
    ...diff,
    approvedRedirects,
    unapprovedRemovals,
  };
}

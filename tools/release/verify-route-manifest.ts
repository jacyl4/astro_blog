import { readFile } from 'node:fs/promises';
import { resolveArg } from './cli';
import {
  createRouteManifest,
  diffRouteManifests,
  type RouteManifest,
} from './manifest';

const baselinePath = resolveArg('baseline', 'baselines/routes.json');
const redirectsPath = resolveArg('redirects', 'baselines/redirects.json');
const distDir = resolveArg('dist', 'dist');

const baseline = JSON.parse(await readFile(baselinePath, 'utf8')) as RouteManifest;
const redirects = JSON.parse(await readFile(redirectsPath, 'utf8')) as Record<string, string>;
const candidate = await createRouteManifest(distDir);
const diff = diffRouteManifests(baseline, candidate);
const unapprovedRemovals = diff.removed.filter((route) => !redirects[route]);

if (diff.kindChanged.length > 0 || unapprovedRemovals.length > 0) {
  console.error(JSON.stringify({
    ...diff,
    unapprovedRemovals,
  }, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({
    baselineRoutes: baseline.routeCount,
    candidateRoutes: candidate.routeCount,
    added: diff.added,
    approvedRedirects: diff.removed.filter((route) => redirects[route]),
  }, null, 2));
}

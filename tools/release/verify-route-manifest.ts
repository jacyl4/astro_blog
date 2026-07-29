import { readFile } from 'node:fs/promises';
import { resolveArg } from './cli';
import {
  assessRouteDiff,
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
const assessment = assessRouteDiff(diffRouteManifests(baseline, candidate), redirects);

if (assessment.kindChanged.length > 0 || assessment.unapprovedRemovals.length > 0) {
  console.error(JSON.stringify(assessment, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({
    baselineRoutes: baseline.routeCount,
    candidateRoutes: candidate.routeCount,
    added: assessment.added,
    approvedRedirects: assessment.approvedRedirects,
  }, null, 2));
}

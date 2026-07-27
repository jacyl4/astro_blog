import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { readArg } from './cli';
import { stableJson, type RouteManifest } from './manifest';

const baseUrl = new URL(readArg('base'));
const manifestPath = readArg('manifest', 'baselines/routes.json');
const outputPath = readArg('output', '.build/evidence/http-sweep.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as RouteManifest;
const results: Array<{ path: string; status: number; finalUrl: string }> = [];
const errors: string[] = [];

async function requestWithRetry(routePath: string): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(new URL(routePath, baseUrl), {
        redirect: 'follow',
        signal: AbortSignal.timeout(15_000),
      });
      if (response.status < 500 || attempt === 4) return response;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, attempt * 1_000));
  }
  throw lastError;
}

for (const route of manifest.routes) {
  try {
    const response = await requestWithRetry(route.path);
    results.push({ path: route.path, status: response.status, finalUrl: response.url });
    if (response.status !== 200) errors.push(`${route.path}: HTTP ${response.status}`);
  } catch (error) {
    errors.push(`${route.path}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

for (const dynamicPath of ['/api/comments', '/auth/session', '/api/unknown']) {
  try {
    const response = await requestWithRetry(dynamicPath);
    results.push({ path: dynamicPath, status: response.status, finalUrl: response.url });
    if (response.status !== 404) errors.push(`${dynamicPath}: expected 404, got ${response.status}`);
  } catch (error) {
    errors.push(`${dynamicPath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, stableJson({
  schemaVersion: 1,
  baseUrl: baseUrl.href,
  checkedAt: new Date().toISOString(),
  routeCount: manifest.routeCount,
  passed: errors.length === 0,
  errors,
  results,
}));

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`HTTP sweep passed: ${manifest.routeCount} routes + 3 static 404 checks`);
}

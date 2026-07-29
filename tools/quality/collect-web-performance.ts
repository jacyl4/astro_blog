import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { chromium } from '@playwright/test';
import { readArg, resolveArg } from '../release/cli';
import { stableJson } from '../release/manifest';

interface PerformanceBudgets {
  blocking: {
    failedRequests: number;
    requestCount: number;
    totalEncodedBytes: number;
    largestResourceBytes: number;
  };
  trend: {
    lcpMs: number;
    cls: number;
    interactionProxyMs: number;
  };
}

const url = readArg('url', 'http://127.0.0.1:4173');
const label = readArg('label', new URL(url).hostname.replace(/[^a-z0-9-]/gi, '-'));
const output = resolveArg(
  'output',
  `.build/evidence/performance-${label}.json`,
);
const budgets = JSON.parse(
  await readFile('performance-budgets.json', 'utf8'),
) as PerformanceBudgets;

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  serviceWorkers: 'block',
});
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
await cdp.send('Network.enable');
await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });

const requests = new Map<string, { url: string; type: string }>();
const resources: Array<{ url: string; type: string; encodedBytes: number }> = [];
const failed: Array<{ url: string; error: string }> = [];
cdp.on('Network.requestWillBeSent', (event) => {
  requests.set(event.requestId, {
    url: event.request.url,
    type: event.type ?? 'Other',
  });
});
cdp.on('Network.loadingFinished', (event) => {
  const request = requests.get(event.requestId);
  if (request) {
    resources.push({
      ...request,
      encodedBytes: Math.round(event.encodedDataLength),
    });
  }
});
cdp.on('Network.loadingFailed', (event) => {
  const request = requests.get(event.requestId);
  failed.push({
    url: request?.url ?? event.requestId,
    error: event.errorText,
  });
});

await page.addInitScript(() => {
  const metrics = { lcpMs: 0, cls: 0 };
  Object.defineProperty(window, '__webPerformanceMetrics', {
    value: metrics,
    configurable: true,
  });
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const last = entries.at(-1);
    if (last) metrics.lcpMs = last.startTime;
  }).observe({ type: 'largest-contentful-paint', buffered: true });
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const shift = entry as PerformanceEntry & {
        value?: number;
        hadRecentInput?: boolean;
      };
      if (!shift.hadRecentInput) metrics.cls += shift.value ?? 0;
    }
  }).observe({ type: 'layout-shift', buffered: true });
});

const startedAt = new Date().toISOString();
await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
await page.waitForTimeout(1000);
const navigation = await page.evaluate(() => {
  const entry = window.performance
    .getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const metrics = (window as typeof window & {
    __webPerformanceMetrics?: { lcpMs: number; cls: number };
  }).__webPerformanceMetrics;
  return {
    domContentLoadedMs: entry.domContentLoadedEventEnd,
    loadMs: entry.loadEventEnd,
    responseStartMs: entry.responseStart,
    lcpMs: metrics?.lcpMs ?? 0,
    cls: metrics?.cls ?? 0,
  };
});

const postLink = page.locator('main a[href^="/posts/"]').first();
const postPath = await postLink.getAttribute('href');
let interactionProxyMs = 0;
if (postPath) {
  const interactionStarted = performance.now();
  await postLink.click();
  await page.waitForURL((current) => current.pathname === postPath);
  await page.locator('main article.prose').waitFor({ state: 'visible' });
  interactionProxyMs = performance.now() - interactionStarted;
}

const totalEncodedBytes = resources.reduce((total, resource) => total + resource.encodedBytes, 0);
const largest = [...resources].sort((left, right) => right.encodedBytes - left.encodedBytes)[0];
const blockingFailures: string[] = [];
if (failed.length > budgets.blocking.failedRequests) {
  blockingFailures.push(`failedRequests=${failed.length}`);
}
if (resources.length > budgets.blocking.requestCount) {
  blockingFailures.push(`requestCount=${resources.length}`);
}
if (totalEncodedBytes > budgets.blocking.totalEncodedBytes) {
  blockingFailures.push(`totalEncodedBytes=${totalEncodedBytes}`);
}
if ((largest?.encodedBytes ?? 0) > budgets.blocking.largestResourceBytes) {
  blockingFailures.push(`largestResourceBytes=${largest?.encodedBytes}`);
}
const trendWarnings = [
  navigation.lcpMs > budgets.trend.lcpMs
    ? `lcpMs=${Math.round(navigation.lcpMs)}`
    : null,
  navigation.cls > budgets.trend.cls
    ? `cls=${navigation.cls}`
    : null,
  interactionProxyMs > budgets.trend.interactionProxyMs
    ? `interactionProxyMs=${Math.round(interactionProxyMs)}`
    : null,
].filter((item): item is string => Boolean(item));

const report = {
  schemaVersion: 1,
  label,
  url,
  startedAt,
  viewport: { width: 1440, height: 1000 },
  coldCache: true,
  serviceWorkerBlocked: true,
  navigation: {
    ...navigation,
    interactionProxyMs: Math.round(interactionProxyMs * 100) / 100,
  },
  network: {
    requestCount: resources.length,
    failed,
    totalEncodedBytes,
    largestResources: [...resources]
      .sort((left, right) => right.encodedBytes - left.encodedBytes)
      .slice(0, 10),
  },
  budgets,
  blockingFailures,
  trendWarnings,
};
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, stableJson(report));
await browser.close();

console.log(stableJson(report));
if (blockingFailures.length > 0) process.exitCode = 1;

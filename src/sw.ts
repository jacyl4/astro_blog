/// <reference lib="webworker" />

interface PrecacheEntry {
  url: string;
  revision: string;
}

const serviceWorker = globalThis as unknown as ServiceWorkerGlobalScope;

const PRECACHE_ENTRIES: readonly PrecacheEntry[] = /* __PRECACHE_MANIFEST__ */ [];
const RELEASE_ID = '__PRECACHE_RELEASE_ID__';
const CACHE_PREFIX = 'astro-blog';
const PRECACHE = `${CACHE_PREFIX}-precache-${RELEASE_ID}`;
const PAGE_CACHE = `${CACHE_PREFIX}-pages-${RELEASE_ID}`;
const IMAGE_CACHE = `${CACHE_PREFIX}-images-${RELEASE_ID}`;
const STATIC_CACHE = `${CACHE_PREFIX}-static-${RELEASE_ID}`;
const ACTIVE_CACHES = new Set([PRECACHE, PAGE_CACHE, IMAGE_CACHE, STATIC_CACHE]);

function pathnameToDocument(pathname: string): string {
  if (pathname === '/index.html') return '/';
  if (pathname.endsWith('/index.html')) {
    return pathname.slice(0, -'index.html'.length);
  }
  if (pathname.endsWith('/')) return pathname;
  if (!pathname.split('/').at(-1)?.includes('.')) return `${pathname}/`;
  return pathname;
}

async function trimCache(cacheName: string, maxEntries: number): Promise<void> {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - maxEntries)).map((key) => cache.delete(key)));
}

async function precache(): Promise<void> {
  const cache = await caches.open(PRECACHE);
  await cache.addAll(PRECACHE_ENTRIES.map((entry) => entry.url));
}

async function offlineDocument(request: Request): Promise<Response> {
  const cached = await caches.match(pathnameToDocument(new URL(request.url).pathname));
  if (cached) return cached;
  const notFound = await caches.match('/404.html');
  return notFound ?? Response.error();
}

async function networkFirstDocument(request: Request): Promise<Response> {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
      await trimCache(PAGE_CACHE, 50);
    }
    return response;
  } catch {
    return (await cache.match(request)) ?? offlineDocument(request);
  }
}

async function cacheFirst(request: Request, cacheName: string, maxEntries: number): Promise<Response> {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
    await trimCache(cacheName, maxEntries);
  }
  return response;
}

async function staleWhileRevalidate(request: Request): Promise<Response> {
  const cached = await caches.match(request);
  const refresh = fetch(request).then(async (response) => {
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      await cache.put(request, response.clone());
      await trimCache(STATIC_CACHE, 100);
    }
    return response;
  }).catch(() => cached ?? Response.error());
  return cached ?? refresh;
}

serviceWorker.addEventListener('install', (event) => {
  event.waitUntil(precache().then(() => serviceWorker.skipWaiting()));
});

serviceWorker.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((name) => name.startsWith(`${CACHE_PREFIX}-`) && !ACTIVE_CACHES.has(name))
        .map((name) => caches.delete(name)),
    );
    await serviceWorker.clients.claim();
  })());
});

serviceWorker.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    void serviceWorker.skipWaiting();
  }
});

serviceWorker.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== serviceWorker.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstDocument(request));
    return;
  }
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, IMAGE_CACHE, 60));
    return;
  }
  if (request.destination === 'script' || request.destination === 'style') {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
  event.respondWith(cacheFirst(request, PRECACHE, PRECACHE_ENTRIES.length));
});

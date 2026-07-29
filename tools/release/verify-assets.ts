import { access, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { resolveArg } from './cli';
import { walkFiles } from './manifest';

interface PngInfo {
  width: number;
  height: number;
}

interface AssetBudgets {
  distTotalBytes: number;
  singleFileBytes: number;
  javascriptFileBytes: number;
  cssFileBytes: number;
  webpFileBytes: number;
  requiredAssets: string[];
  forbiddenAssets: string[];
}

export function readPngInfo(buffer: Buffer): PngInfo {
  const signature = '89504e470d0a1a0a';
  if (buffer.length < 24 || buffer.subarray(0, 8).toString('hex') !== signature) {
    throw new Error('not a valid PNG');
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

async function verifyIcon(root: string, file: string, size: number): Promise<string[]> {
  const errors: string[] = [];
  const absolute = path.join(root, file);
  try {
    const fileStat = await stat(absolute);
    if (fileStat.size === 0) errors.push(`${file}: empty file`);
    const info = readPngInfo(await readFile(absolute));
    if (info.width !== size || info.height !== size) {
      errors.push(`${file}: expected ${size}x${size}, got ${info.width}x${info.height}`);
    }
  } catch (error) {
    errors.push(`${file}: ${error instanceof Error ? error.message : String(error)}`);
  }
  return errors;
}

const distDir = resolveArg('dist', 'dist');
const budgets = JSON.parse(await readFile('asset-budgets.json', 'utf8')) as AssetBudgets;
const errors = [
  ...await verifyIcon(distDir, 'pwa-192x192.png', 192),
  ...await verifyIcon(distDir, 'pwa-512x512.png', 512),
];
const allFiles = await walkFiles(distDir);
let totalBytes = 0;
let combinedCss = '';

for (const file of allFiles) {
  const fileStat = await stat(file);
  const relative = `/${path.relative(distDir, file).split(path.sep).join('/')}`;
  totalBytes += fileStat.size;
  if (fileStat.size > budgets.singleFileBytes) {
    errors.push(`${relative}: ${fileStat.size} exceeds single-file budget ${budgets.singleFileBytes}`);
  }
  if (file.endsWith('.js') && fileStat.size > budgets.javascriptFileBytes) {
    errors.push(`${relative}: ${fileStat.size} exceeds JavaScript budget ${budgets.javascriptFileBytes}`);
  }
  if (file.endsWith('.webp') && fileStat.size > budgets.webpFileBytes) {
    errors.push(`${relative}: ${fileStat.size} exceeds WebP budget ${budgets.webpFileBytes}`);
  }
  if (file.endsWith('.css')) {
    if (fileStat.size > budgets.cssFileBytes) {
      errors.push(`${relative}: ${fileStat.size} exceeds CSS budget ${budgets.cssFileBytes}`);
    }
    combinedCss += await readFile(file, 'utf8');
  }
  if (fileStat.size === 0) errors.push(`${relative}: empty file`);
}

if (totalBytes > budgets.distTotalBytes) {
  errors.push(`dist total ${totalBytes} exceeds budget ${budgets.distTotalBytes}`);
}
for (const required of budgets.requiredAssets) {
  try {
    await access(path.join(distDir, required.replace(/^\/+/, '')));
  } catch {
    errors.push(`missing required asset: ${required}`);
  }
}
for (const forbidden of budgets.forbiddenAssets) {
  try {
    await access(path.join(distDir, forbidden.replace(/^\/+/, '')));
    errors.push(`forbidden asset present: ${forbidden}`);
  } catch {
    // Expected: forbidden assets must not exist.
  }
}

for (const htmlFile of allFiles.filter((file) => file.endsWith('.html'))) {
  const html = await readFile(htmlFile, 'utf8');
  if (!html.includes('rel="manifest" href="/manifest.webmanifest"')) {
    errors.push(`${path.relative(distDir, htmlFile)}: missing web app manifest link`);
  }
  if (!/<script\b[^>]*src="\/registerSW\.js"[^>]*data-swup-ignore-script[^>]*><\/script>/.test(html)) {
    errors.push(`${path.relative(distDir, htmlFile)}: missing Swup-safe service worker registration`);
  }
  const references = html.matchAll(/(?:src|href)="(\/[^"#?]+)"/g);
  for (const match of references) {
    const reference = match[1];
    if (!reference || reference === '/') continue;
    const candidate = path.join(distDir, reference.replace(/^\/+/, ''));
    try {
      await access(candidate);
    } catch {
      errors.push(`${path.relative(distDir, htmlFile)}: missing ${reference}`);
    }
  }

  for (const preload of html.matchAll(/<link\b[^>]*rel="preload"[^>]*href="(\/[^"#?]+)"[^>]*>/g)) {
    const href = preload[1]!;
    const htmlWithoutPreload = html.replace(preload[0], '');
    if (!htmlWithoutPreload.includes(href) && !combinedCss.includes(href)) {
      errors.push(`${path.relative(distDir, htmlFile)}: unused preload ${href}`);
    }
  }
}

for (const cssReference of combinedCss.matchAll(/url\((?:['"])?(\/[^'")?#]+)(?:['"])?\)/g)) {
  const reference = cssReference[1]!;
  try {
    await access(path.join(distDir, reference.replace(/^\/+/, '')));
  } catch {
    errors.push(`CSS references missing asset: ${reference}`);
  }
}

try {
  const manifest = JSON.parse(await readFile(path.join(distDir, 'manifest.webmanifest'), 'utf8')) as {
    icons?: Array<{ src?: string; sizes?: string; type?: string }>;
  };
  for (const expected of [
    { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
    { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
  ]) {
    if (!manifest.icons?.some((icon) => (
      icon.src === expected.src
      && icon.sizes === expected.sizes
      && icon.type === expected.type
    ))) {
      errors.push(`manifest.webmanifest: missing ${expected.src} metadata`);
    }
  }
} catch (error) {
  errors.push(`manifest.webmanifest: ${error instanceof Error ? error.message : String(error)}`);
}

try {
  const registration = await readFile(path.join(distDir, 'registerSW.js'), 'utf8');
  if (!registration.includes("register('/sw.js'")) {
    errors.push('registerSW.js: does not register /sw.js');
  }
  if (!registration.includes("registration.update()")) {
    errors.push('registerSW.js: missing update check');
  }
} catch (error) {
  errors.push(`registerSW.js: ${error instanceof Error ? error.message : String(error)}`);
}

try {
  const serviceWorker = await readFile(path.join(distDir, 'sw.js'), 'utf8');
  if (serviceWorker.includes('__PRECACHE_')) {
    errors.push('sw.js: unresolved precache marker');
  }
  if (!serviceWorker.includes('/index.html') || !serviceWorker.includes('/404.html')) {
    errors.push('sw.js: incomplete navigation precache');
  }
  if (!serviceWorker.includes('skipWaiting') || !serviceWorker.includes('clients.claim')) {
    errors.push('sw.js: incomplete update activation strategy');
  }
} catch (error) {
  errors.push(`sw.js: ${error instanceof Error ? error.message : String(error)}`);
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`static asset verification passed: ${allFiles.length} files, ${totalBytes} bytes`);
}

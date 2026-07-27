import { readFile } from 'node:fs/promises';

interface WranglerEnvironment {
  name?: string;
  routes?: Array<{ pattern?: string; custom_domain?: boolean }>;
  [key: string]: unknown;
}

interface WranglerConfig extends WranglerEnvironment {
  assets?: {
    directory?: string;
    html_handling?: string;
    not_found_handling?: string;
    run_worker_first?: unknown;
    binding?: unknown;
  };
  env?: Record<string, WranglerEnvironment>;
}

const config = JSON.parse(await readFile('wrangler.jsonc', 'utf8')) as WranglerConfig;
const errors: string[] = [];
const forbiddenKeys = new Set([
  'main',
  'd1_databases',
  'kv_namespaces',
  'r2_buckets',
  'services',
  'durable_objects',
  'queues',
  'workflows',
  'vars',
]);

function scanForbidden(value: unknown, prefix = 'config'): void {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    const path = `${prefix}.${key}`;
    if (forbiddenKeys.has(key)) errors.push(`${path}: dynamic runtime key is forbidden`);
    scanForbidden(child, path);
  }
}

scanForbidden(config);

if (config.name !== 'astro-blog') errors.push('production base name must be astro-blog');
if (config.assets?.directory !== './dist') errors.push('assets.directory must be ./dist');
if (config.assets?.html_handling !== 'auto-trailing-slash') {
  errors.push('assets.html_handling must preserve Astro trailing slash behavior');
}
if (config.assets?.not_found_handling !== '404-page') {
  errors.push('assets.not_found_handling must use the generated 404 page');
}
if ('run_worker_first' in (config.assets ?? {})) {
  errors.push('assets.run_worker_first must be absent for an assets-only Worker');
}
if ('binding' in (config.assets ?? {})) {
  errors.push('assets.binding must be absent because there is no user Worker');
}

const expected = {
  staging: {
    name: 'astro-blog-staging',
    hostname: 'blog-staging.seso.icu',
  },
  production: {
    name: 'astro-blog',
    hostname: 'blog.seso.icu',
  },
};
for (const [environment, contract] of Object.entries(expected)) {
  const actual = config.env?.[environment];
  if (actual?.name !== contract.name) {
    errors.push(`env.${environment}.name must be ${contract.name}`);
  }
  const route = actual?.routes?.find(
    (item) => item.pattern === contract.hostname && item.custom_domain === true,
  );
  if (!route) {
    errors.push(`env.${environment} must own custom domain ${contract.hostname}`);
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Cloudflare assets-only boundary verification passed');
}

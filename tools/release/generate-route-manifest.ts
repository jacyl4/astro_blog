import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { resolveArg } from './cli';
import { createRouteManifest, stableJson } from './manifest';

const distDir = resolveArg('dist', 'dist');
const output = resolveArg('output', '.build/manifests/routes.json');
const manifest = await createRouteManifest(distDir);

await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, stableJson(manifest));
console.log(`route manifest: ${manifest.routeCount} routes, ${manifest.hash}`);
console.log(output);

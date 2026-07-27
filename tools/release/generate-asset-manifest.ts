import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { resolveArg } from './cli';
import { createAssetManifest, stableJson } from './manifest';

const distDir = resolveArg('dist', 'dist');
const output = resolveArg('output', '.build/manifests/assets.json');
const manifest = await createAssetManifest(distDir);

await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, stableJson(manifest));
console.log(`asset manifest: ${manifest.assetCount} assets, ${manifest.totalBytes} bytes, ${manifest.hash}`);
console.log(output);

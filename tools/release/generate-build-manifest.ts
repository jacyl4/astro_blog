import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { resolveArg } from './cli';
import {
  createAssetManifest,
  createRouteManifest,
  sha256,
  stableJson,
} from './manifest';

function currentGitSha(): string {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    return 'local';
  }
}

async function lockedContentSha(): Promise<string> {
  try {
    const lock = JSON.parse(await readFile('content-source.lock.json', 'utf8')) as {
      sha?: unknown;
    };
    return typeof lock.sha === 'string' && /^[0-9a-f]{40}$/.test(lock.sha)
      ? lock.sha
      : 'local';
  } catch {
    return 'local';
  }
}

const distDir = resolveArg('dist', 'dist');
const output = resolveArg('output', '.build/manifests/build.json');
const publicOutput = path.join(distDir, '_meta', 'build-manifest.json');
const routes = await createRouteManifest(distDir);
const assets = await createAssetManifest(distDir);
const lockfile = await readFile('package-lock.json');

const manifest = {
  schemaVersion: 1,
  appSha: process.env.APP_SHA || process.env.CI_COMMIT_SHA || currentGitSha(),
  contentSha: process.env.CONTENT_SHA || await lockedContentSha(),
  lockfileSha256: sha256(lockfile),
  routeManifestSha256: routes.hash,
  assetManifestSha256: assets.hash,
  routeCount: routes.routeCount,
  assetCount: assets.assetCount,
  builtAt: new Date().toISOString(),
};

await mkdir(path.dirname(output), { recursive: true });
await mkdir(path.dirname(publicOutput), { recursive: true });
await writeFile(output, stableJson(manifest));
await writeFile(publicOutput, stableJson(manifest));
console.log(stableJson(manifest));

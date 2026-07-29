import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

interface PackageManifest {
  dependencies?: Record<string, string>;
}

interface Lockfile {
  packages: Record<string, {
    version?: string;
    dependencies?: Record<string, string>;
  }>;
}

describe('rendering dependency contract', () => {
  it('uses the Shiki theme bundled with the active Shiki major', async () => {
    const manifest = JSON.parse(await readFile('package.json', 'utf8')) as PackageManifest;
    const lockfile = JSON.parse(await readFile('package-lock.json', 'utf8')) as Lockfile;

    expect(manifest.dependencies).not.toHaveProperty('@shikijs/themes');
    expect(lockfile.packages).not.toHaveProperty('node_modules/@shikijs/themes');
    expect(lockfile.packages['node_modules/shiki']?.version).toBe('4.3.1');
    expect(
      lockfile.packages['node_modules/shiki/node_modules/@shikijs/themes']?.version,
    ).toBe('4.3.1');
  });
});

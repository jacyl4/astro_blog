import { chmod, mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { verifyCiContract } from '../../tools/quality/ci-contract';

describe('GitLab CI release contract', () => {
  it('keeps package transport, staging, and production safety explicit', async () => {
    const source = await readFile('.gitlab-ci.yml', 'utf8');
    expect(verifyCiContract(source).length).toBeGreaterThanOrEqual(14);
  });

  it('accepts the current deployment ref and rejects stale candidates', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'deploy-freshness-'));
    const fakeGit = path.join(root, 'git');
    await writeFile(fakeGit, `#!/usr/bin/env bash
repository_url="$3"
branch="\${4#refs/heads/}"
if [[ "$repository_url" == *"obsidian-digital"* ]]; then
  printf '%s\\trefs/heads/%s\\n' "$FAKE_CONTENT_SHA" "$branch"
else
  printf '%s\\trefs/heads/%s\\n' "$FAKE_APP_SHA" "$branch"
fi
`);
    await chmod(fakeGit, 0o755);

    const appSha = 'a'.repeat(40);
    const contentSha = 'b'.repeat(40);
    const baseEnv = {
      ...process.env,
      PATH: `${root}:${process.env.PATH}`,
      CI_JOB_TOKEN: 'test-token',
      CI_REPOSITORY_URL: 'https://gitlab-ci-token:test-token@gitlab.invalid/jacyl4/astro_blog.git',
      CI_SERVER_FQDN: 'gitlab.invalid',
      CI_SERVER_PROTOCOL: 'https',
      CI_DEFAULT_BRANCH: 'main',
      CI_COMMIT_REF_NAME: 'refactor/candidate',
      CI_COMMIT_SHA: appSha,
      DEPLOY_REF: 'refactor/candidate',
      CONTENT_PROJECT_PATH: 'jacyl4/obsidian-digital',
      CONTENT_REF: 'main',
      CONTENT_SHA: contentSha,
      FAKE_APP_SHA: appSha,
      FAKE_CONTENT_SHA: contentSha,
    };
    const run = (env: NodeJS.ProcessEnv) => spawnSync(
      'bash',
      ['tools/ci/verify-deploy-freshness.sh'],
      { cwd: process.cwd(), env, encoding: 'utf8' },
    );

    expect(run(baseEnv).status).toBe(0);
    const stale = run({ ...baseEnv, FAKE_APP_SHA: 'c'.repeat(40) });
    expect(stale.status).toBe(1);
    expect(stale.stderr).toContain('Refusing stale app deployment');
  });

  it('retries transient npm audit outages but fails critical findings immediately', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'npm-audit-retry-'));
    const fakeNpm = path.join(root, 'npm');
    const counter = path.join(root, 'counter');
    const output = path.join(root, 'audit.json');
    await writeFile(fakeNpm, `#!/usr/bin/env bash
count=0
[[ ! -f "$FAKE_NPM_COUNTER" ]] || count="$(cat "$FAKE_NPM_COUNTER")"
count=$((count + 1))
printf '%s' "$count" > "$FAKE_NPM_COUNTER"
if [[ "$FAKE_NPM_MODE" == "transient" && "$count" -lt 3 ]]; then
  printf '%s\n' '{"error":"registry unavailable"}'
  exit 1
fi
critical=0
[[ "$FAKE_NPM_MODE" != "critical" ]] || critical=1
printf '{"metadata":{"vulnerabilities":{"critical":%s}}}\n' "$critical"
[[ "$critical" == "0" ]]
`);
    await chmod(fakeNpm, 0o755);

    const run = (mode: string, attempts = '4') => {
      spawnSync('rm', ['-f', counter, output], { encoding: 'utf8' });
      return spawnSync(
        'bash',
        ['tools/ci/npm-audit-with-retry.sh', output],
        {
          cwd: process.cwd(),
          env: {
            ...process.env,
            PATH: `${root}:${process.env.PATH}`,
            FAKE_NPM_COUNTER: counter,
            FAKE_NPM_MODE: mode,
            NPM_AUDIT_ATTEMPTS: attempts,
            NPM_AUDIT_RETRY_DELAY: '0',
          },
          encoding: 'utf8',
        },
      );
    };

    const recovered = run('transient');
    expect(recovered.status).toBe(0);
    expect(await readFile(counter, 'utf8')).toBe('3');

    const critical = run('critical');
    expect(critical.status).toBe(1);
    expect(await readFile(counter, 'utf8')).toBe('1');

    const unavailable = run('transient', '2');
    expect(unavailable.status).toBe(2);
    expect(unavailable.stderr).toContain('remained unavailable');
  });
});

import { parse } from 'yaml';

type CiJob = {
  stage?: string;
  interruptible?: boolean;
  resource_group?: string;
  when?: string;
  rules?: Array<Record<string, unknown>>;
  script?: unknown;
  after_script?: unknown;
  artifacts?: unknown;
};

type CiConfig = {
  workflow?: {
    auto_cancel?: {
      on_new_commit?: string;
    };
  };
  default?: {
    interruptible?: boolean;
  };
  [key: string]: unknown;
};

const RESERVED_KEYS = new Set([
  'stages',
  'workflow',
  'default',
  'variables',
  'cache',
  'include',
]);

function scriptText(value: unknown): string {
  if (Array.isArray(value)) return value.map(scriptText).join('\n');
  return typeof value === 'string' ? value : '';
}

function job(config: CiConfig, name: string): CiJob {
  const value = config[name];
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`missing CI job: ${name}`);
  }
  return value as CiJob;
}

function requireMatch(value: string, pattern: RegExp, message: string): void {
  if (!pattern.test(value)) throw new Error(message);
}

export function verifyCiContract(source: string): string[] {
  const config = parse(source) as CiConfig;
  const checks: string[] = [];
  const assert = (condition: boolean, message: string) => {
    if (!condition) throw new Error(message);
    checks.push(message);
  };

  assert(
    config.workflow?.auto_cancel?.on_new_commit === 'interruptible',
    'new commits cancel interruptible pipelines',
  );
  assert(config.default?.interruptible === true, 'verification jobs are interruptible by default');

  for (const [name, value] of Object.entries(config)) {
    if (RESERVED_KEYS.has(name) || !value || typeof value !== 'object') {
      continue;
    }
    assert(!Object.hasOwn(value, 'artifacts'), `${name} does not publish GitLab Job Artifacts`);
  }

  const prepare = scriptText(job(config, 'prepare-content').script);
  requireMatch(
    prepare,
    /package-artifact\.sh upload "\$CONTENT_PACKAGE_NAME" "\$\{CI_PIPELINE_ID\}-\$\{CI_COMMIT_SHA\}"/,
    'content package is not keyed by pipeline and commit',
  );
  checks.push('content package is immutable per pipeline and commit');

  const verify = scriptText(job(config, 'verify').script);
  requireMatch(
    verify,
    /npm-audit-with-retry\.sh/,
    'dependency audit has no bounded retry for registry outages',
  );
  checks.push('dependency audit retries transient registry outages');

  const build = scriptText(job(config, 'build').script);
  requireMatch(
    build,
    /package-artifact\.sh upload "\$RELEASE_PACKAGE_NAME" "\$\{CI_PIPELINE_ID\}-\$\{CI_COMMIT_SHA\}"/,
    'release package is not keyed by pipeline and commit',
  );
  checks.push('release package is immutable per pipeline and commit');

  for (const [name, sourceJob] of [
    ['verify', 'verify'],
    ['browser', '.browser-base'],
  ] as const) {
    const text = scriptText(job(config, sourceJob).script);
    requireMatch(
      text,
      /CI_PIPELINE_ID\}-\$\{CI_COMMIT_SHA\}-\$\{CI_JOB_ID\}/,
      `${name} evidence is not retry-safe`,
    );
    checks.push(`${name} evidence is immutable per job attempt`);
  }

  const staging = job(config, 'staging');
  assert(staging.resource_group === 'astro-blog-staging', 'staging deployments are serialized');
  const stagingRules = JSON.stringify(staging.rules ?? []);
  requireMatch(stagingRules, /CI_DEFAULT_BRANCH/, 'staging has no default-branch rule');
  requireMatch(stagingRules, /"when":"manual"/, 'feature-branch staging is not manual');
  const stagingScript = scriptText(staging.script);
  requireMatch(stagingScript, /verify-deploy-freshness\.sh/, 'staging does not reject stale releases');
  requireMatch(stagingScript, /PLAYWRIGHT_BASE_URL=.*test:staging/, 'staging lacks live browser validation');
  const stagingAfterScript = scriptText(staging.after_script);
  requireMatch(
    stagingAfterScript,
    /STAGING_EVIDENCE_PACKAGE_NAME.*CI_JOB_ID/,
    'staging evidence is not uploaded per job attempt',
  );
  checks.push('staging stores retry-safe live evidence');

  const production = job(config, 'production');
  assert(production.resource_group === 'astro-blog-production', 'production deployments are serialized');
  assert(production.when === 'manual', 'production deployment remains manual');
  const productionRules = JSON.stringify(production.rules ?? []);
  requireMatch(productionRules, /CI_DEFAULT_BRANCH/, 'production is not restricted to the default branch');
  const productionAfterScript = scriptText(production.after_script);
  requireMatch(
    productionAfterScript,
    /PRODUCTION_EVIDENCE_PACKAGE_NAME.*CI_JOB_ID/,
    'production evidence is not uploaded per job attempt',
  );
  checks.push('production stores retry-safe release evidence');

  return checks;
}

import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

interface EvidenceMapping {
  status: '已验证' | '待验证' | '时间门';
  evidence: string;
}

const root = path.resolve('openspec/changes');
const output = path.resolve('operations/openspec-evidence-matrix.md');

const mappings: Record<string, EvidenceMapping> = {
  'build-obsidian-content-compiler/specs/content-identity/spec.md': {
    status: '已验证',
    evidence: '`tests/unit/content-compiler.test.ts`；`npm run content:validate`',
  },
  'build-obsidian-content-compiler/specs/content-integrity-validation/spec.md': {
    status: '已验证',
    evidence: '`tests/unit/content-compiler.test.ts`；`.build/diagnostics/content.json`',
  },
  'build-obsidian-content-compiler/specs/obsidian-content-normalization/spec.md': {
    status: '已验证',
    evidence: '`tests/unit/content-compiler.test.ts`；`npm run content:measure`',
  },
  'establish-refactor-baseline/specs/comments-decommission/spec.md': {
    status: '已验证',
    evidence: '`tests/unit/comments-zero-residue.test.ts`；`npm run comments:verify-removed`；`tests/browser/routes-http.spec.ts`',
  },
  'establish-refactor-baseline/specs/release-baseline/spec.md': {
    status: '已验证',
    evidence: '`tests/unit/release-manifest.test.ts`；`npm run manifest:build`；`.gitlab-ci.yml`',
  },
  'establish-refactor-baseline/specs/url-stability/spec.md': {
    status: '已验证',
    evidence: '`tests/unit/release-manifest.test.ts`；`npm run routes:verify`',
  },
  'harden-quality-and-operations/specs/asset-performance-integrity/spec.md': {
    status: '待验证',
    evidence: '`npm run assets:verify`；`operations/performance-budget.md`（Wave B 补齐响应式资产）',
  },
  'harden-quality-and-operations/specs/continuous-quality-gates/spec.md': {
    status: '待验证',
    evidence: '`.gitlab-ci.yml`；JUnit/Playwright trace；本矩阵的 `npm run openspec:evidence:check`',
  },
  'harden-quality-and-operations/specs/operational-observability/spec.md': {
    status: '待验证',
    evidence: '`wrangler.jsonc` observability；release evidence；staging 回滚记录',
  },
  'migrate-cloudflare-static-deployment/specs/cloudflare-release-rollback/spec.md': {
    status: '待验证',
    evidence: '`operations/rollback-runbook.md`；staging N → N+1 → N 回滚证据',
  },
  'migrate-cloudflare-static-deployment/specs/cloudflare-static-delivery/spec.md': {
    status: '已验证',
    evidence: '`.gitlab-ci.yml`；`npm run cloudflare:verify-static`；`npm run http:sweep`',
  },
  'modularize-blog-domain/specs/blog-module-boundary/spec.md': {
    status: '已验证',
    evidence: '`tests/unit/blog-domain.test.ts`；`npm run boundaries:verify`；`src/modules/blog/README.md`',
  },
  'replace-obsidian-sync-pipeline/specs/atomic-cross-repo-release/spec.md': {
    status: '待验证',
    evidence: '`tools/ci/prepare-content.sh`；双仓连续提交和失败传播演练',
  },
  'replace-obsidian-sync-pipeline/specs/immutable-content-build-input/spec.md': {
    status: '待验证',
    evidence: '`tools/ci/prepare-content.sh`；Generic Package Registry 双 SHA 证据；删除文章演练',
  },
  'replace-obsidian-sync-pipeline/specs/portable-content-development/spec.md': {
    status: '待验证',
    evidence: '`operations/content-authoring.md`；机器专属绝对路径扫描',
  },
  'unify-client-page-lifecycle/specs/client-async-cancellation/spec.md': {
    status: '已验证',
    evidence: '`tests/unit/page-lifecycle.test.ts` 的 generation、destroy 和 AbortSignal 测试',
  },
  'unify-client-page-lifecycle/specs/page-lifecycle-consistency/spec.md': {
    status: '已验证',
    evidence: '`tests/browser/lifecycle.spec.ts`；`.build/evidence/lifecycle-event-order.json`',
  },
  'upgrade-astro-major/specs/astro-major-upgrade-safety/spec.md': {
    status: '待验证',
    evidence: '`openspec/changes/upgrade-astro-major/verification.md`；Astro 7 staging 全回归',
  },
};

async function collectSpecFiles(directory: string): Promise<string[]> {
  const files: string[] = [];
  for (const change of await readdir(directory, { withFileTypes: true })) {
    if (!change.isDirectory() || change.name === 'archive') continue;
    const specsDir = path.join(directory, change.name, 'specs');
    let capabilities;
    try {
      capabilities = await readdir(specsDir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const capability of capabilities) {
      if (!capability.isDirectory()) continue;
      const spec = path.join(specsDir, capability.name, 'spec.md');
      try {
        await readFile(spec, 'utf8');
        files.push(spec);
      } catch {
        // A capability without spec.md is invalidated by OpenSpec itself.
      }
    }
  }
  return files.sort();
}

function escapeCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

const rows: string[] = [];
for (const file of await collectSpecFiles(root)) {
  const relative = path.relative(root, file);
  const mapping = mappings[relative];
  if (!mapping) throw new Error(`Missing evidence mapping for ${relative}`);
  const contents = await readFile(file, 'utf8');
  const scenarios = [...contents.matchAll(/^#### Scenario: (.+)$/gm)].map((match) => match[1]);
  if (scenarios.length === 0) throw new Error(`No scenarios found in ${relative}`);
  for (const scenario of scenarios) {
    rows.push(
      `| \`${escapeCell(relative)}\` | ${escapeCell(scenario)} | ${mapping.status} | ${mapping.evidence} |`,
    );
  }
}

const generated = `# OpenSpec Scenario → Evidence Matrix

生成日期：2026-07-29

本表由 \`npm run openspec:evidence\` 从所有活动 change 的 spec 生成。它保证每个
\`#### Scenario\` 都有证据入口，但“已映射”不等于“已通过”；\`待验证\` 与
\`时间门\` 必须保留到对应演练或观察窗口真实完成。

| Spec | Scenario | 状态 | 自动测试或人工证据 |
| --- | --- | --- | --- |
${rows.join('\n')}

## 门禁

- \`npm run openspec:evidence:check\`：检测 spec 新增、删除或矩阵漂移。
- \`npm run openspec:validate\`：验证 OpenSpec 结构和 requirement/scenario 格式。
- 只有状态为“已验证”且其命令在候选提交上通过，才可关闭对应任务。
`;

if (process.argv.includes('--check')) {
  const current = await readFile(output, 'utf8').catch(() => '');
  if (current !== generated) {
    console.error('OpenSpec evidence matrix is stale; run npm run openspec:evidence');
    process.exitCode = 1;
  } else {
    console.log(`OpenSpec evidence matrix is current (${rows.length} scenarios)`);
  }
} else {
  await writeFile(output, generated);
  console.log(`Wrote ${path.relative(process.cwd(), output)} (${rows.length} scenarios)`);
}

import { readFile } from 'node:fs/promises';
import { resolveArg } from './cli';
import {
  assessMainContentBaseline,
  createMainContentBaseline,
  type MainContentApproval,
  type MainContentBaseline,
} from './html-baseline';

const baselinePath = resolveArg('baseline', 'baselines/main-content.json');
const distDir = resolveArg('dist', 'dist');
const approvalsPath = resolveArg('approvals', 'baselines/html-differences.json');
const baseline = JSON.parse(await readFile(baselinePath, 'utf8')) as MainContentBaseline;
const approvals = JSON.parse(
  await readFile(approvalsPath, 'utf8'),
) as Record<string, MainContentApproval>;
const candidate = await createMainContentBaseline(distDir);
const assessment = assessMainContentBaseline(baseline, candidate, approvals);

if (assessment.missing.length > 0 || assessment.changed.length > 0) {
  console.error(JSON.stringify(assessment, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({
    baselinePages: baseline.pageCount,
    approvedDifferences: assessment.approved,
  }, null, 2));
}

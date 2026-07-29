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
  const baselineByFile = new Map(baseline.pages.map((page) => [page.file, page.sha256]));
  const candidateByFile = new Map(candidate.pages.map((page) => [page.file, page.sha256]));
  console.error(JSON.stringify({
    missing: assessment.missing,
    changed: assessment.changed.map((file) => ({
      file,
      baselineSha256: baselineByFile.get(file),
      candidateSha256: candidateByFile.get(file),
      approvedSha256: approvals[file]?.sha256,
    })),
    approved: assessment.approved,
  }, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({
    baselinePages: baseline.pageCount,
    approvedDifferences: assessment.approved,
  }, null, 2));
}

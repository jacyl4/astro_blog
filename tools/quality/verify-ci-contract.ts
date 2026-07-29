import { readFile } from 'node:fs/promises';
import { verifyCiContract } from './ci-contract';

const source = await readFile('.gitlab-ci.yml', 'utf8');
const checks = verifyCiContract(source);
console.log(`GitLab CI contract verification passed: ${checks.length} checks`);

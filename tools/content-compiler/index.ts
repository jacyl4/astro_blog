import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { compileContent, migrationReport, writeCompilation } from './compiler';
import { loadConfig } from './config';
import { hasErrors } from './diagnostics';
import { stableJson } from '../release/manifest';

try {
  const config = loadConfig();
  const result = await compileContent(config);
  await mkdir(path.dirname(config.diagnosticsPath), { recursive: true });
  await writeFile(config.diagnosticsPath, stableJson({
    schemaVersion: 1,
    sourceDir: config.sourceDir,
    mode: config.mode,
    scannedFiles: result.inventory.records.length,
    warningCount: result.diagnostics.filter((item) => item.severity === 'warning').length,
    errorCount: result.diagnostics.filter((item) => item.severity === 'error').length,
    diagnostics: result.diagnostics,
  }));
  await writeFile(config.migrationPath, stableJson(migrationReport(result)));

  if (config.command === 'compile') {
    await writeCompilation(config, result);
  }

  console.log(stableJson({
    command: config.command,
    mode: config.mode,
    sourceDir: config.sourceDir,
    articleCount: result.inventory.records.length,
    warningCount: result.diagnostics.filter((item) => item.severity === 'warning').length,
    errorCount: result.diagnostics.filter((item) => item.severity === 'error').length,
    manifestHash: result.manifest.manifestHash,
  }));

  if (hasErrors(result.diagnostics)) process.exitCode = 1;
} catch (error) {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
}

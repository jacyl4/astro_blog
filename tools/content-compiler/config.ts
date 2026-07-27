import path from 'node:path';
import type { CompilerConfig, CompilerMode } from './model';

function readOption(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

export function loadConfig(): CompilerConfig {
  const command = process.argv[2];
  if (!['inventory', 'validate', 'compile'].includes(command)) {
    throw new Error('Usage: content-compiler <inventory|validate|compile> [options]');
  }

  const requestedMode = readOption('mode') ?? process.env.CONTENT_COMPILER_MODE ?? 'compat';
  if (requestedMode !== 'compat' && requestedMode !== 'strict') {
    throw new Error(`Unsupported compiler mode: ${requestedMode}`);
  }

  const explicitSource = readOption('source');
  const sourceBase = process.env.CONTENT_SOURCE_PATH;
  const contentSubdir = process.env.CONTENT_SUBDIR || 'Blog';
  const sourceDir = explicitSource
    ? path.resolve(explicitSource)
    : sourceBase
      ? path.resolve(sourceBase, contentSubdir)
      : path.resolve('src/content/blog');

  return {
    command: command as CompilerConfig['command'],
    mode: requestedMode as CompilerMode,
    sourceDir,
    outputDir: path.resolve(readOption('output') ?? '.build/content/blog'),
    manifestPath: path.resolve(readOption('manifest') ?? '.build/content-manifest.json'),
    diagnosticsPath: path.resolve(
      readOption('diagnostics') ?? '.build/diagnostics/content.json',
    ),
    migrationPath: path.resolve(
      readOption('migration') ?? '.build/diagnostics/content-migration.json',
    ),
  };
}

import path from 'node:path';
import type { CompilerConfig, CompilerMode } from './model';

function readOption(argv: string[], name: string): string | undefined {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 ? argv[index + 1] : undefined;
}

export function loadConfig(
  argv: string[] = process.argv,
  env: NodeJS.ProcessEnv = process.env,
): CompilerConfig {
  const command = argv[2];
  if (!['inventory', 'validate', 'compile'].includes(command)) {
    throw new Error('Usage: content-compiler <inventory|validate|compile> [options]');
  }

  const requestedMode = readOption(argv, 'mode') ?? env.CONTENT_COMPILER_MODE ?? 'compat';
  if (requestedMode !== 'compat' && requestedMode !== 'strict') {
    throw new Error(`Unsupported compiler mode: ${requestedMode}`);
  }

  const explicitSource = readOption(argv, 'source');
  const sourceBase = env.CONTENT_SOURCE_PATH;
  const contentSubdir = env.CONTENT_SUBDIR || 'Blog';
  const sourceDir = explicitSource
    ? path.resolve(explicitSource)
    : sourceBase
      ? path.resolve(sourceBase, contentSubdir)
      : path.resolve('src/content/blog');

  return {
    command: command as CompilerConfig['command'],
    mode: requestedMode as CompilerMode,
    sourceDir,
    outputDir: path.resolve(readOption(argv, 'output') ?? '.build/content/blog'),
    manifestPath: path.resolve(readOption(argv, 'manifest') ?? '.build/content-manifest.json'),
    diagnosticsPath: path.resolve(
      readOption(argv, 'diagnostics') ?? '.build/diagnostics/content.json',
    ),
    migrationPath: path.resolve(
      readOption(argv, 'migration') ?? '.build/diagnostics/content-migration.json',
    ),
  };
}

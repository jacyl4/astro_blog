import path from 'node:path';

export function readArg(name: string, fallback?: string): string {
  const index = process.argv.indexOf(`--${name}`);
  const value = index >= 0 ? process.argv[index + 1] : undefined;

  if (value) return value;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing required argument: --${name}`);
}

export function resolveArg(name: string, fallback?: string): string {
  return path.resolve(readArg(name, fallback));
}

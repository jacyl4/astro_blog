import type { Diagnostic } from './model';

export function diagnostic(
  code: string,
  severity: Diagnostic['severity'],
  message: string,
  sourcePath?: string,
  position?: { line?: number; column?: number },
  details?: Record<string, unknown>,
): Diagnostic {
  return {
    code,
    severity,
    message,
    sourcePath,
    line: position?.line,
    column: position?.column,
    details,
  };
}

export function hasErrors(diagnostics: Diagnostic[]): boolean {
  return diagnostics.some((item) => item.severity === 'error');
}

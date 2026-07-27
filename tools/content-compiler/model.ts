export type CompilerMode = 'compat' | 'strict';
export type DiagnosticSeverity = 'warning' | 'error';

export interface Diagnostic {
  code: string;
  severity: DiagnosticSeverity;
  message: string;
  sourcePath?: string;
  line?: number;
  column?: number;
  details?: Record<string, unknown>;
}

export interface Frontmatter {
  id?: string;
  slug?: string;
  title?: string;
  created?: string | Date;
  updated?: string | Date;
  tags?: string[];
  category?: string;
  [key: string]: unknown;
}

export interface ContentRecord {
  sourcePath: string;
  absolutePath: string;
  id: string;
  slug: string;
  permalink: string;
  title: string;
  originalTitle: string;
  category: string;
  frontmatter: Frontmatter;
  sourceSha256: string;
  outputSha256?: string;
}

export interface ContentManifest {
  schemaVersion: 1;
  compilerVersion: 1;
  mode: CompilerMode;
  contentSha: string;
  manifestHash: string;
  articleCount: number;
  records: Array<{
    sourcePath: string;
    id: string;
    slug: string;
    permalink: string;
    title: string;
    originalTitle: string;
    category: string;
    sourceSha256: string;
    outputSha256: string;
  }>;
}

export interface CompilerConfig {
  command: 'inventory' | 'validate' | 'compile';
  mode: CompilerMode;
  sourceDir: string;
  outputDir: string;
  manifestPath: string;
  diagnosticsPath: string;
  migrationPath: string;
}

export interface Inventory {
  records: ContentRecord[];
  diagnostics: Diagnostic[];
  indexes: {
    byId: Map<string, ContentRecord[]>;
    bySlug: Map<string, ContentRecord[]>;
    bySource: Map<string, ContentRecord[]>;
    byBasename: Map<string, ContentRecord[]>;
    byTitle: Map<string, ContentRecord[]>;
  };
}

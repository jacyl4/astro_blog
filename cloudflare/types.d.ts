declare module 'marked' {
  export const marked: {
    parse: (markdown: string, options?: { async?: boolean }) => string | Promise<string>;
  };
}

declare module 'sanitize-html' {
  type TransformFn = (tagName: string, attribs: Record<string, string>) => {
    tagName: string;
    attribs: Record<string, string>;
  };

  interface SanitizeConfig {
    allowedTags?: string[];
    allowedAttributes?: Record<string, string[]>;
    transformTags?: Record<string, TransformFn>;
  }

  interface SanitizeHtmlFn {
    (dirty: string, options?: SanitizeConfig): string;
    defaults: {
      allowedTags: string[];
    };
  }

  const sanitizeHtml: SanitizeHtmlFn;
  export default sanitizeHtml;
}

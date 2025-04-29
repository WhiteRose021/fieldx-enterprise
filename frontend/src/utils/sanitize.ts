// src/utils/sanitize.ts
export function sanitizeHtml(html: string | null | undefined): string {
    if (!html) return '';
    
    // Simple sanitization - in production, use a library like DOMPurify
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/onerror|onclick|onload|onmouseover|onmouseout/gi, '');
  }
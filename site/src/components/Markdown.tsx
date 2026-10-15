import DOMPurify from 'dompurify';
import { Marked, type Tokens } from 'marked';
import { useMemo } from 'react';

// The ONLY place in the site that sets HTML. Repository content is not trusted
// HTML (docs/SITE-SPEC.md → Rendering and safety), so there are two layers:
//   1. raw HTML inside the Markdown is escaped, so `<script>` renders as text;
//   2. the whole rendered output always goes through DOMPurify.sanitize.

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const marked = new Marked({
  gfm: true,
  async: false,
  renderer: {
    html(token: Tokens.HTML | Tokens.Tag): string {
      const text = escapeHtml(token.text);
      return token.block ? `<p>${text}</p>\n` : text;
    },
  },
});

let hooksInstalled = false;
function installHooks(): void {
  if (hooksInstalled) return;
  hooksInstalled = true;
  // External links open in a new tab without handing the catalog to the target page.
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A' && /^https?:\/\//i.test(node.getAttribute('href') ?? '')) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });
}

/** Markdown → sanitised HTML. */
export function renderMarkdown(source: string): string {
  installHooks();
  const html = marked.parse(source) as string;
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}

export function Markdown({ source }: { source: string }) {
  const html = useMemo(() => renderMarkdown(source), [source]);
  // `html` is DOMPurify output, never the raw source.
  return <div className="markdown" dangerouslySetInnerHTML={{ __html: html }} />;
}

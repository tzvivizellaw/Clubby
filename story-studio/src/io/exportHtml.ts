import type { Story } from '../model/types';
import { SCHEMA_VERSION } from '../model/types';

/** Escape text for an HTML text/attribute context. */
export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

/**
 * Serialize data for embedding inside a <script type="application/json"> block.
 * Escapes every character that could close the script tag or confuse the HTML parser.
 */
export function jsonForScript(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/** Make sure a bundled script can't terminate its own <script> element early. */
export function safeInlineScript(js: string): string {
  return js.replace(/<\/(script)/gi, '<\\/$1').replace(/<!--/g, '<\\!--');
}

/** Build a single self-contained HTML file that opens the story in play mode — no server, CDN or external fonts. */
export function buildStandaloneHtml(story: Story, playerBundle: string): string {
  const title = escapeHtml(story.title);
  return `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="generator" content="הסיפור שלי">
<title>${title}</title>
<style>html,body{margin:0;min-height:100%;background:#fff8ec}body{font-family:'Rubik','Assistant','Heebo','Segoe UI','Arial Hebrew',Arial,system-ui,sans-serif}#root{min-height:100vh;display:flex;flex-direction:column}#root>*{flex:1}noscript p{padding:24px;font-size:18px}</style>
</head>
<body>
<noscript><p>כדי לשחק בסיפור צריך להפעיל JavaScript בדפדפן.</p></noscript>
<div id="root"></div>
<script type="application/json" id="hasipur-story" data-schema="${SCHEMA_VERSION}">${jsonForScript(story)}</script>
<script>${safeInlineScript(playerBundle)}</script>
</body>
</html>
`;
}

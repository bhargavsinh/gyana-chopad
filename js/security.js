/**
 * Gyāna Chopad V1.3 — Client-side safety helpers (static site)
 * Practical hardening: XSS-safe names, length limits, no dangerous HTML.
 */

const MAX_NAME_LEN = 20;
const NAME_RE = /^[\p{L}\p{N}\s.'’_-]+$/u;

export function sanitizePlayerName(raw, fallback = 'ખેલાડી') {
  if (raw == null) return fallback;
  let s = String(raw)
    .replace(/[<>&"'`\\/]/g, '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, MAX_NAME_LEN);
  if (!s) return fallback;
  if (!NAME_RE.test(s)) {
    s = s.replace(/[^\p{L}\p{N}\s.'’_-]/gu, '').trim().slice(0, MAX_NAME_LEN);
  }
  return s || fallback;
}

export function sanitizeNames(list) {
  return (list || []).map((n, i) =>
    sanitizePlayerName(n, `ખેલાડી ${i + 1}`)
  );
}

export function escapeText(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const SECURITY_META = {
  version: '1.3',
  level: 'static-client-hardening',
  notes: [
    'No authentication or server state',
    'No third-party analytics',
    'Player names sanitized client-side',
    'CSP recommended via meta on pages',
    'All game data is local JSON'
  ]
};

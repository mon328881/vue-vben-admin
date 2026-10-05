const FALLBACK_HOME = '/';

/** 仅允许站内相对路径，拒绝协议相对、外链与 javascript: 等。 */
export function safeInternalPath(
  raw: unknown,
  fallback: string = FALLBACK_HOME,
): string {
  if (typeof raw !== 'string' || !raw.trim()) {
    return fallback || FALLBACK_HOME;
  }
  let value = raw.trim();
  try {
    value = decodeURIComponent(value);
  } catch {
    return fallback || FALLBACK_HOME;
  }
  value = value.trim();
  if (
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    value.includes('://')
  ) {
    return fallback || FALLBACK_HOME;
  }
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value.slice(1))) {
    return fallback || FALLBACK_HOME;
  }
  return value;
}

export function isSafeHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url, 'http://localhost');
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

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

/**
 * 校验请求 URL 是否为内部 API（避免向第三方外域泄漏凭据 iToken）。
 * 支持传入可信 baseOrigin（如当前域名 + 后端 baseURL 跨子域绝对地址）。
 * 采取 fail-closed 策略：空 URL 或无法解析的 URL 返回 false。
 */
export function isInternalApiUrl(
  url: string | undefined,
  trustedOrigins?: string | string[],
): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  // 拒绝任何反斜杠走私（如 /\evil.com、/\/evil.com）
  if (trimmed.includes('\\')) {
    return false;
  }
  // 站内相对路径（拒绝协议相对 //）
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return true;
  }
  try {
    const defaultOrigin =
      (typeof window === 'undefined' ? '' : window.location?.origin) ||
      'http://localhost';
    const parsed = new URL(trimmed, defaultOrigin);

    let origins: string[];
    if (Array.isArray(trustedOrigins)) {
      origins = trustedOrigins;
    } else if (trustedOrigins) {
      origins = [trustedOrigins];
    } else {
      origins = [defaultOrigin];
    }

    return origins.some((item) => {
      if (!item) return false;
      try {
        const itemParsed = new URL(item, defaultOrigin);
        return parsed.origin === itemParsed.origin;
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

/**
 * 安全高亮格式化 JSON，采用全量 Tokenizer 机制，彻底阻断 XSS 注入。
 */
export function highlightJSON(value: unknown): string {
  const raw =
    typeof value === 'string' ? value : JSON.stringify(value, null, 4);
  const regex =
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g;
  let lastIndex = 0;
  let result = '';
  let match: null | RegExpExecArray;
  while ((match = regex.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      result += escapeHtml(raw.slice(lastIndex, match.index));
    }
    const token = match[0];
    let cls = 'json-number';
    if (token.startsWith('"')) {
      cls = token.endsWith(':') ? 'json-key' : 'json-string';
    } else if (/true|false/.test(token)) {
      cls = 'json-boolean';
    } else if (/null/.test(token)) {
      cls = 'json-null';
    }
    result += `<span class="${cls}">${escapeHtml(token)}</span>`;
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < raw.length) {
    result += escapeHtml(raw.slice(lastIndex));
  }
  return result;
}

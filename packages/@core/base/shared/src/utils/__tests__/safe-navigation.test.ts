import { describe, expect, it } from 'vitest';

import {
  escapeHtml,
  highlightJSON,
  isInternalApiUrl,
  isSafeHttpUrl,
  safeInternalPath,
} from '../safe-navigation';

describe('safeInternalPath', () => {
  it('keeps in-app paths', () => {
    expect(safeInternalPath('/payways', '/main')).toBe('/payways');
    expect(safeInternalPath('/main?tab=1', '/main')).toBe('/main?tab=1');
  });

  it('rejects external and protocol-relative targets', () => {
    expect(safeInternalPath('https://evil.example/phish', '/main')).toBe(
      '/main',
    );
    expect(safeInternalPath('//evil.example/phish', '/main')).toBe('/main');
    expect(safeInternalPath('javascript:alert(1)', '/main')).toBe('/main');
  });

  it('decodes once then rejects smuggled protocols', () => {
    expect(
      safeInternalPath(encodeURIComponent('https://evil.example'), '/main'),
    ).toBe('/main');
  });

  it('decodes encoded slashes and rejects %2f%2fevil.com protocol-relative attacks (R1)', () => {
    expect(safeInternalPath('%2f%2fevil.com', '/main')).toBe('/main');
    expect(safeInternalPath('/%2fevil.com', '/main')).toBe('/main');
    expect(safeInternalPath('///evil.com', '/main')).toBe('/main');
    expect(safeInternalPath(String.raw`/\evil.com`, '/main')).toBe('/main');
  });
});

describe('isSafeHttpUrl', () => {
  it('allows http(s) only', () => {
    expect(isSafeHttpUrl('https://cdn.example/file.xlsx')).toBe(true);
    expect(isSafeHttpUrl('javascript:alert(1)')).toBe(false);
  });
});

describe('escapeHtml', () => {
  it('encodes markup', () => {
    expect(escapeHtml('<img src=x onerror=1>')).toBe(
      '&lt;img src=x onerror=1&gt;',
    );
  });
});

describe('isInternalApiUrl', () => {
  it('allows relative paths without protocol smuggling', () => {
    expect(isInternalApiUrl('/api/current/user')).toBe(true);
    expect(isInternalApiUrl('/anon/auth/validate')).toBe(true);
    expect(isInternalApiUrl('//evil.example/steal')).toBe(false);
  });

  it('rejects backslash protocol smuggling attempts (F2)', () => {
    expect(isInternalApiUrl(String.raw`/\evil.com`)).toBe(false);
    expect(isInternalApiUrl(String.raw`/\/evil.com`)).toBe(false);
    expect(isInternalApiUrl(String.raw`\evil.com`)).toBe(false);
    expect(isInternalApiUrl(String.raw`/api\v1\users`)).toBe(false);
  });

  it('rejects external origins and dangerous schemes', () => {
    expect(isInternalApiUrl('https://third-party.com/webhook')).toBe(false);
    expect(isInternalApiUrl('http://attacker.com/api')).toBe(false);
    expect(isInternalApiUrl('javascript:alert(1)')).toBe(false);
  });

  it('enforces fail-closed on null/empty/invalid input', () => {
    expect(isInternalApiUrl('')).toBe(false);
    expect(isInternalApiUrl(undefined)).toBe(false);
    expect(isInternalApiUrl('   ')).toBe(false);
  });

  it('supports cross-subdomain API baseURL in trustedOrigins', () => {
    const trusted = ['http://mgr.example.com:5666', 'https://api.example.com'];
    expect(isInternalApiUrl('https://api.example.com/api/order', trusted)).toBe(
      true,
    );
    expect(
      isInternalApiUrl('http://mgr.example.com:5666/api/order', trusted),
    ).toBe(true);
    expect(
      isInternalApiUrl('https://phishing.example.com/api/order', trusted),
    ).toBe(false);
  });
});

describe('highlightJSON', () => {
  it('escapes raw HTML injection inputs without unescaped tags (X3)', () => {
    const output = highlightJSON('<img src=x onerror=alert(1)>');
    expect(output).not.toContain('<img');
    expect(output).toContain('&lt;img');
    expect(output).toContain('&gt;');
  });

  it('escapes SVG and script injections inside JSON values', () => {
    const output = highlightJSON({
      msg: '<svg><script>alert(1)</script></svg>',
    });
    expect(output).not.toContain('<script>');
    expect(output).toContain('&lt;script&gt;');
    expect(output).toContain('&lt;/script&gt;');
  });

  it('safely highlights normal JSON keys and numbers', () => {
    const output = highlightJSON({ code: 0, title: 'AsiaPay' });
    expect(output).toContain('json-key');
    expect(output).toContain('json-number');
    expect(output).toContain('json-string');
  });
});

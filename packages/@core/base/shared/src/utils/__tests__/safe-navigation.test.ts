import { describe, expect, it } from 'vitest';

import {
  escapeHtml,
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

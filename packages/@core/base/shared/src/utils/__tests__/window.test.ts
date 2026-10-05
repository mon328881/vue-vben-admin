import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { openWindow } from '../window';

describe('openWindow', () => {
  // 保存原始的 window.open 函数
  let originalOpen: typeof window.open;

  beforeEach(() => {
    originalOpen = window.open;
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    window.open = originalOpen;
    vi.restoreAllMocks();
  });

  it('should call window.open with correct arguments', () => {
    const url = 'https://example.com';
    const options = { noopener: true, noreferrer: true, target: '_blank' };

    window.open = vi.fn();

    // 调用函数
    openWindow(url, options);

    // 验证 window.open 是否被正确地调用
    expect(window.open).toHaveBeenCalledWith(
      url,
      options.target,
      'noopener=yes,noreferrer=yes',
    );
  });

  it('should reject unsafe protocols like javascript: and data:', () => {
    window.open = vi.fn();

    openWindow('javascript:alert(1)');
    expect(window.open).not.toHaveBeenCalled();

    openWindow('data:text/html;base64,PHNjcmlwdD4=');
    expect(window.open).not.toHaveBeenCalled();

    openWindow('vbscript:msgbox(1)');
    expect(window.open).not.toHaveBeenCalled();
  });

  it('should allow relative paths and https URLs', () => {
    window.open = vi.fn();

    openWindow('/relative/path');
    expect(window.open).toHaveBeenCalledWith(
      '/relative/path',
      '_blank',
      'noopener=yes,noreferrer=yes',
    );

    openWindow('https://trusted.example.com');
    expect(window.open).toHaveBeenCalledWith(
      'https://trusted.example.com',
      '_blank',
      'noopener=yes,noreferrer=yes',
    );
  });
});

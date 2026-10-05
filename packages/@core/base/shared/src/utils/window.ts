import { isSafeHttpUrl } from './safe-navigation';

interface OpenWindowOptions {
  noopener?: boolean;
  noreferrer?: boolean;
  target?: '_blank' | '_parent' | '_self' | '_top' | string;
}

/**
 * 新窗口打开URL。
 *
 * @param url - 需要打开的网址。
 * @param options - 打开窗口的选项。
 */
function openWindow(url: string, options: OpenWindowOptions = {}): void {
  if (typeof url !== 'string' || !url.trim()) return;
  const trimmed = url.trim();
  // 仅允许内部相对路径或安全的 http/https URL，拒绝 javascript:/data:/vbscript: 协议注入
  if (!trimmed.startsWith('/') && !isSafeHttpUrl(trimmed)) {
    console.warn('[Security] openWindow rejected unsafe URL:', url);
    return;
  }

  // 解构并设置默认值
  const { noopener = true, noreferrer = true, target = '_blank' } = options;

  // 基于选项创建特性字符串
  const features = [noopener && 'noopener=yes', noreferrer && 'noreferrer=yes']
    .filter(Boolean)
    .join(',');

  // 打开窗口
  window.open(trimmed, target, features);
}

/**
 * 在新窗口中打开路由。
 * @param path
 */
function openRouteInNewWindow(path: string) {
  const { hash, origin } = location;
  const fullPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${origin}${hash && !fullPath.startsWith('/#') ? '/#' : ''}${fullPath}`;
  openWindow(url, { target: '_blank' });
}

export { openRouteInNewWindow, openWindow };

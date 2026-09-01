/** 解析 JWT payload（不校验签名，仅用于本地过期判断） */
export function decodeJwtPayload(
  token: string,
): null | Record<string, unknown> {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      Array.from(atob(base64), (c) =>
        `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`,
      ).join(''),
    );
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * 本地判断 iToken 是否已过期。
 * mgr-api 对 ExpiredJwtException 会直接 500，需在发请求前拦截。
 */
export function isJwtExpired(
  token: null | string | undefined,
  skewSeconds = 30,
): boolean {
  if (!token) return true;
  const payload = decodeJwtPayload(token);
  if (!payload) return true;
  const exp = payload.exp;
  if (typeof exp !== 'number') return false;
  return exp * 1000 <= Date.now() + skewSeconds * 1000;
}

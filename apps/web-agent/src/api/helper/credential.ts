/** 登录凭证 Base64（对齐 mgr-web encodeCredential） */
export function encodeCredential(value: string): string {
  return btoa(unescape(encodeURIComponent(value)));
}

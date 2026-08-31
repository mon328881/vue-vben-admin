import { baseRequestClient, requestClient } from '#/api/request';

import { encodeCredential } from '#/api/helper/credential';
import type { VercodeResult } from '#/api/types';

export namespace AuthApi {
  /** 登录接口参数（明文，发送前会 Base64） */
  export interface LoginParams {
    username: string;
    password: string;
    vercode: string;
    vercodeToken: string;
    google?: string;
  }

  export interface LoginResult {
    accessToken: string;
  }
}

/**
 * 获取站点标题
 */
export async function getTitleApi() {
  return requestClient.get<string>('/anon/auth/getTitle');
}

/**
 * 获取图形验证码
 */
export async function getVercodeApi() {
  return requestClient.get<VercodeResult>('/anon/auth/vercode');
}

/**
 * 登录 — POST /anon/auth/validate，返回 iToken 映射为 accessToken
 */
export async function loginApi(data: AuthApi.LoginParams) {
  const result = await requestClient.post<{ iToken: string }>(
    '/anon/auth/validate',
    {
      ia: encodeCredential(data.username),
      ip: encodeCredential(data.password),
      vc: encodeCredential(data.vercode),
      vt: encodeCredential(data.vercodeToken),
      gc: encodeCredential(data.google ?? ''),
    },
  );
  return { accessToken: result.iToken } satisfies AuthApi.LoginResult;
}

/**
 * 退出登录（走 baseRequestClient，避免 401 拦截器再次触发登出死循环）
 */
export async function logoutApi(token?: null | string) {
  return baseRequestClient.post(
    '/current/logout',
    {},
    token ? { headers: { iToken: token } } : undefined,
  );
}

/**
 * 兼容旧调用：权限码来自 /current/user 的 entIdList，由 store 填充。
 * 保留空实现避免误请求 Vben 默认路径。
 */
export async function getAccessCodesApi(): Promise<string[]> {
  return [];
}

/** @deprecated mgr-api 无 refresh，勿调用 */
export async function refreshTokenApi() {
  return baseRequestClient.post('/auth/refresh');
}

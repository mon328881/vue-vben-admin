/**
 * 该文件可自行根据业务逻辑进行调整
 */
import type { RequestClientOptions } from '@vben/request';

import { useAppConfig } from '@vben/hooks';
import { preferences } from '@vben/preferences';
import {
  authenticateResponseInterceptor,
  defaultResponseInterceptor,
  errorMessageResponseInterceptor,
  RequestClient,
} from '@vben/request';
import { useAccessStore } from '@vben/stores';

import { message } from 'ant-design-vue';

import { useAuthStore } from '#/store';
import { isJwtExpired } from '#/utils/jwt';

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

/** 防止 401 → logout → 401 死循环（后端重启后旧 token 失效时易触发） */
let reAuthPromise: null | Promise<void> = null;

function createRequestClient(baseURL: string, options?: RequestClientOptions) {
  const client = new RequestClient({
    ...options,
    baseURL,
  });

  /**
   * 重新认证逻辑（mch-api 无 refresh，直接登出）
   */
  async function doReAuthenticate() {
    if (reAuthPromise) return reAuthPromise;
    console.warn('iToken is invalid or expired.');
    reAuthPromise = (async () => {
      const accessStore = useAccessStore();
      const authStore = useAuthStore();
      accessStore.setAccessToken(null);
      if (
        preferences.app.loginExpiredMode === 'modal' &&
        accessStore.isAccessChecked
      ) {
        accessStore.setLoginExpired(true);
      } else {
        await authStore.logout();
      }
    })().finally(() => {
      reAuthPromise = null;
    });
    return reAuthPromise;
  }

  async function doRefreshToken() {
    // mch-api 不支持 refresh
    await doReAuthenticate();
    return '';
  }

  // 请求头：AsiaPay 使用 iToken，而非 Bearer
  client.addRequestInterceptor({
    fulfilled: async (config) => {
      const accessStore = useAccessStore();
      let token = accessStore.accessToken;
      // 过期 JWT 发往 mch-api 会变成 500，本地先拦截并登出
      if (token && isJwtExpired(token)) {
        accessStore.setAccessToken(null);
        void doReAuthenticate();
        token = null;
      }
      if (token) {
        config.headers.iToken = token;
      }
      config.headers['Accept-Language'] = preferences.app.locale;
      return config;
    },
  });

  // 处理返回的响应数据格式 { code, data, msg }
  client.addResponseInterceptor(
    defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data',
      successCode: 0,
    }),
  );

  // token 过期（HTTP 401）；mch-api 对 ExpiredJwt 也可能返回 500
  client.addResponseInterceptor(
    authenticateResponseInterceptor({
      client,
      doReAuthenticate,
      doRefreshToken,
      enableRefreshToken: false,
      formatToken: () => null,
    }),
  );

  client.addResponseInterceptor({
    rejected: async (error) => {
      const status = error?.response?.status;
      const sentToken = error?.config?.headers?.iToken;
      const token =
        typeof sentToken === 'string'
          ? sentToken
          : useAccessStore().accessToken;
      if (status === 500 && token && isJwtExpired(token)) {
        (error as { __authExpired?: boolean }).__authExpired = true;
        await doReAuthenticate();
      }
      throw error;
    },
  });

  // 通用错误处理：业务错误字段为 msg
  client.addResponseInterceptor(
    errorMessageResponseInterceptor((msg: string, error) => {
      if (
        error?.__authExpired ||
        error?.response?.status === 401
      ) {
        return;
      }
      const responseData = error?.response?.data ?? {};
      const errorMessage =
        responseData?.msg ?? responseData?.error ?? responseData?.message ?? '';
      message.error(errorMessage || msg);
    }),
  );

  return client;
}

export const requestClient = createRequestClient(apiURL, {
  responseReturn: 'data',
});

export const baseRequestClient = new RequestClient({ baseURL: apiURL });

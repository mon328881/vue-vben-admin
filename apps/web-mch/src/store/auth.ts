import type { Recordable, UserInfo } from '@vben/types';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';

import { notification } from 'ant-design-vue';
import { defineStore } from 'pinia';

import {
  clearCurrentUserCache,
  fetchCurrentUserApi,
  getUserInfoApi,
  loginApi,
  logoutApi,
  mapToUserInfo,
} from '#/api/core';
import { $t } from '#/locales';

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const router = useRouter();

  const loginLoading = ref(false);

  async function authLogin(
    params: Recordable<any>,
    onSuccess?: () => Promise<void> | void,
  ) {
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;
      const { accessToken } = await loginApi({
        username: String(params.username ?? ''),
        password: String(params.password ?? ''),
        vercode: String(params.vercode ?? ''),
        vercodeToken: String(params.vercodeToken ?? ''),
        google: params.google ? String(params.google) : '',
      });

      if (accessToken) {
        accessStore.setAccessToken(accessToken);

        const current = await fetchCurrentUserApi(true);
        userInfo = mapToUserInfo(current);

        userStore.setUserInfo(userInfo);
        accessStore.setAccessCodes(current.entIdList ?? []);

        if (accessStore.loginExpired) {
          accessStore.setLoginExpired(false);
        } else {
          onSuccess
            ? await onSuccess?.()
            : await router.push(
                userInfo.homePath || preferences.app.defaultHomePath,
              );
        }

        if (userInfo?.realName) {
          notification.success({
            description: `${$t('authentication.loginSuccessDesc')}: ${userInfo.realName}`,
            duration: 3,
            message: $t('authentication.loginSuccess'),
          });
        }
      }
    } finally {
      loginLoading.value = false;
    }

    return {
      userInfo,
    };
  }

  async function logout(redirect: boolean = true) {
    const token = accessStore.accessToken;
    // 先清本地 token，避免并发请求继续带旧凭证
    accessStore.setAccessToken(null);
    try {
      await logoutApi(token);
    } catch {
      // 忽略退出接口失败
    }
    clearCurrentUserCache();
    resetAllStores();
    accessStore.setLoginExpired(false);

    await router.replace({
      path: LOGIN_PATH,
      query: redirect
        ? {
            redirect: encodeURIComponent(router.currentRoute.value.fullPath),
          }
        : {},
    });
  }

  async function fetchUserInfo() {
    const userInfo = await getUserInfoApi();
    userStore.setUserInfo(userInfo);
    const current = await fetchCurrentUserApi();
    accessStore.setAccessCodes(current.entIdList ?? []);
    return userInfo;
  }

  function $reset() {
    loginLoading.value = false;
  }

  return {
    $reset,
    authLogin,
    fetchUserInfo,
    loginLoading,
    logout,
  };
});

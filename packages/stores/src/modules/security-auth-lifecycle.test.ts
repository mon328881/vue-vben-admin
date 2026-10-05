import { isInternalApiUrl, safeInternalPath } from '@vben-core/shared/utils';

import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { resetAllStores, setupCrossTabStorageSync } from '../setup';
import { useAccessStore } from './access';
import { useUserStore } from './user';

describe('security Auth Lifecycle & Credential Safety (T1, T2, Storage Broadcast)', () => {
  let pinia: ReturnType<typeof createPinia>;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
  });

  it('t1: verifies atomic logout clears all sensitive auth tokens and user data via real Pinia stores', () => {
    const accessStore = useAccessStore();
    const userStore = useUserStore();

    // 1. 模拟用户登录态：填充 Access Token, Refresh Token, 权限码和用户信息
    accessStore.setAccessToken(
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token-xyz',
    );
    accessStore.setRefreshToken('refresh-secret-token-12345');
    accessStore.setAccessCodes([
      'system:user:add',
      'system:role:delete',
      'order:export',
    ]);
    userStore.setUserInfo({
      userId: '10001',
      username: 'sec_admin',
      realName: 'Security Admin',
      roles: ['super_admin'],
    } as any);

    // 验证状态真实填充
    expect(accessStore.accessToken).toBeTruthy();
    expect(accessStore.refreshToken).toBeTruthy();
    expect(accessStore.accessCodes.length).toBe(3);
    expect(userStore.userInfo?.username).toBe('sec_admin');

    // 2. 模拟真实生产 logout 动作：置空 token 并驱动 resetAllStores
    accessStore.setAccessToken(null);
    accessStore.setRefreshToken(null);
    resetAllStores(pinia);

    // 3. 断言敏感凭证与用户数据已被原子化物理清空
    expect(accessStore.accessToken).toBeNull();
    expect(accessStore.refreshToken).toBeNull();
    expect(accessStore.accessCodes).toEqual([]);
    expect(userStore.userInfo).toBeNull();
  });

  it('t2: attaches iToken only to internal / trusted origins, strictly omitting it for external requests', () => {
    const trustedOrigins = [
      'http://localhost:5666',
      'https://api.asiapay.internal',
    ];
    const currentToken = 'iToken-session-xyz-12345';

    function mockRequestInterceptor(config: {
      headers: Record<string, string>;
      url: string;
    }) {
      if (currentToken && isInternalApiUrl(config.url, trustedOrigins)) {
        config.headers.iToken = currentToken;
      }
      return config;
    }

    // Internal relative endpoint
    const req1 = mockRequestInterceptor({ url: '/api/v1/orders', headers: {} });
    expect(req1.headers.iToken).toBe(currentToken);

    // Internal absolute endpoint
    const req2 = mockRequestInterceptor({
      url: 'https://api.asiapay.internal/api/v1/users',
      headers: {},
    });
    expect(req2.headers.iToken).toBe(currentToken);

    // Third-party external endpoint (e.g. payment gateway / analytics webhook)
    const req3 = mockRequestInterceptor({
      url: 'https://thirdparty-bank.com/pay/notify',
      headers: {},
    });
    expect(req3.headers.iToken).toBeUndefined();

    // Protocol-relative phishing attempt
    const req4 = mockRequestInterceptor({
      url: '//phishing-domain.com/collect',
      headers: {},
    });
    expect(req4.headers.iToken).toBeUndefined();
  });

  it('storage Broadcast: invalidates real session and triggers onLogout callback across tabs', () => {
    const accessStore = useAccessStore();
    const userStore = useUserStore();

    accessStore.setAccessToken('valid-jwt-token-for-tab-1');
    userStore.setUserInfo({ username: 'operator' } as any);

    const onLogoutCallback = vi.fn();
    const cleanup = setupCrossTabStorageSync(onLogoutCallback);

    try {
      // 模拟其他标签页登出广播：key 包含 access 且 newValue 为 null
      const storageEvent = new StorageEvent('storage', {
        key: 'asiapay-access-store',
        oldValue: 'some-token',
        newValue: null,
      });

      window.dispatchEvent(storageEvent);

      // 断言真实生产回调与 Pinia store 清理动作均被触发
      expect(onLogoutCallback).toHaveBeenCalledTimes(1);
      expect(accessStore.accessToken).toBeNull();
      expect(userStore.userInfo).toBeNull();

      // 模拟 localStorage.clear() 产生的 key === null 广播
      const clearEvent = new StorageEvent('storage', {
        key: null,
        newValue: null,
      });
      window.dispatchEvent(clearEvent);
      expect(onLogoutCallback).toHaveBeenCalledTimes(2);
    } finally {
      cleanup?.();
    }
  });

  it('mCH-03 E2E: setupAuthStorageListener invalidates session and navigates to login across tabs', async () => {
    const accessStore = useAccessStore();
    const userStore = useUserStore();

    accessStore.setAccessToken('tab-active-token');
    userStore.setUserInfo({ username: 'mch_user' } as any);

    const mockRouter = {
      replace: vi.fn().mockResolvedValue(true),
    };

    // 模拟应用启动 bootstrap 时注册真实正典监听器 setupCrossTabStorageSync
    const cleanup = setupCrossTabStorageSync(async () => {
      await mockRouter.replace({ path: '/auth/login' });
    });

    try {
      const storageLogoutEvent = new StorageEvent('storage', {
        key: 'asiapay-access',
        oldValue: 'tab-active-token',
        newValue: null,
      });
      window.dispatchEvent(storageLogoutEvent);

      expect(accessStore.accessToken).toBeNull();
      expect(userStore.userInfo).toBeNull();
      expect(mockRouter.replace).toHaveBeenCalledWith({ path: '/auth/login' });
    } finally {
      cleanup?.();
    }
  });

  it('g1/G2: Route redirect parameter sanitization prevents open redirect attacks', () => {
    const unauthenticatedRedirectAttack = 'https://evil.com/phishing';
    const fallbackPath = '/dashboard/analytics';

    // Route guard sanitizes redirect query parameter before forwarding to login page
    const sanitized = safeInternalPath(
      unauthenticatedRedirectAttack,
      fallbackPath,
    );
    expect(sanitized).toBe(fallbackPath);

    // Encoded attack
    const encodedAttack = '%2f%2fevil.com';
    expect(safeInternalPath(encodedAttack, fallbackPath)).toBe(fallbackPath);

    // Protocol-relative attack
    expect(safeInternalPath('//evil.com', fallbackPath)).toBe(fallbackPath);
    expect(safeInternalPath(String.raw`/\evil.com`, fallbackPath)).toBe(
      fallbackPath,
    );

    // Valid internal redirect
    const validInternalRedirect = '/order/list?status=1';
    expect(safeInternalPath(validInternalRedirect, fallbackPath)).toBe(
      validInternalRedirect,
    );
  });
});

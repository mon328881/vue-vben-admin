import type { UserInfo } from '@vben/types';

import { useAccessStore } from '@vben/stores';

import type { CurrentUser } from '#/api/types';

import { platRolesOf } from '#/constants/entitlements';
import { mockPlatUsers } from '#/mock/data';
import { applyPlatSession, mockCurrentUser } from '#/mock/session';

let cachedUser: CurrentUser | null = null;

export function clearCurrentUserCache() {
  cachedUser = null;
}

export function getCachedCurrentUser() {
  return cachedUser;
}

function hydrateSessionFromToken() {
  const token = useAccessStore().accessToken ?? '';
  const prefix = 'mock-plat-token-';
  if (!token.startsWith(prefix)) return;
  const username = token.slice(prefix.length);
  const account = mockPlatUsers.find((item) => item.loginUsername === username);
  if (account) applyPlatSession(account);
}

/** 超管端当前阶段：本地 Mock 用户，不请求后端 */
export async function fetchCurrentUserApi(force = false) {
  if (!force && cachedUser) {
    return cachedUser;
  }
  hydrateSessionFromToken();
  cachedUser = { ...mockCurrentUser };
  return cachedUser;
}

export function mapToUserInfo(user: CurrentUser): UserInfo {
  const account = mockPlatUsers.find(
    (item) => item.loginUsername === user.loginUsername,
  );
  return {
    avatar: '',
    desc: user.sysType,
    homePath: '/main',
    realName: account?.realname || user.loginUsername,
    roles: platRolesOf(user),
    token: '',
    userId: String(user.sysUserId),
    username: user.loginUsername,
    belongInfoId: user.belongInfoId,
    entIdList: user.entIdList,
    googleAuth: user.googleAuth,
    isAdmin: user.isAdmin,
    sysType: user.sysType,
  };
}

export async function getUserInfoApi() {
  const user = await fetchCurrentUserApi(true);
  return mapToUserInfo(user);
}

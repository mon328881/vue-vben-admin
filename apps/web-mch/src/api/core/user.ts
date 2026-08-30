import type { UserInfo } from '@vben/types';

import { requestClient } from '#/api/request';

import type { CurrentUser } from '#/api/types';

let cachedUser: CurrentUser | null = null;

export function clearCurrentUserCache() {
  cachedUser = null;
}

export function getCachedCurrentUser() {
  return cachedUser;
}

/**
 * 拉取当前用户（含菜单树、权限码）
 */
export async function fetchCurrentUserApi(force = false) {
  if (!force && cachedUser) {
    return cachedUser;
  }
  cachedUser = await requestClient.get<CurrentUser>('/current/user');
  return cachedUser;
}

/** 映射为 Vben UserInfo */
export function mapToUserInfo(user: CurrentUser): UserInfo {
  const roles =
    user.isAdmin === 1 ? ['admin', 'user'] : (['user'] as string[]);
  return {
    avatar: '',
    desc: user.sysType,
    homePath: '/main',
    realName: user.loginUsername,
    roles,
    token: '',
    userId: String(user.sysUserId),
    username: user.loginUsername,
    // 扩展字段，供业务页使用
    belongInfoId: user.belongInfoId,
    entIdList: user.entIdList,
    googleAuth: user.googleAuth,
    isAdmin: user.isAdmin,
    sysType: user.sysType,
  };
}

/**
 * 获取用户信息（Vben 约定）
 */
export async function getUserInfoApi() {
  const user = await fetchCurrentUserApi(true);
  return mapToUserInfo(user);
}

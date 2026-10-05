import type { CurrentUser } from '#/api/types';

import { ALL_PLAT_ENTS } from '#/constants/entitlements';

import type { PlatUser } from './types';

/** 超管端本地会话用户（登录 / 刷新时按账号回填） */
export const mockCurrentUser: CurrentUser = {
  sysUserId: 1,
  loginUsername: 'platadmin',
  sysType: 'PLAT',
  belongInfoId: '0',
  isAdmin: 1,
  state: 1,
  googleAuth: 0,
  entIdList: [...ALL_PLAT_ENTS],
  allMenuRouteTree: [],
};

export function applyPlatSession(user: PlatUser) {
  const numericId = Number(String(user.userId).replace(/\D/g, '')) || Date.now();
  mockCurrentUser.sysUserId = numericId;
  mockCurrentUser.loginUsername = user.loginUsername;
  mockCurrentUser.isAdmin = user.isAdmin;
  mockCurrentUser.state = user.state;
  mockCurrentUser.googleAuth = user.googleAuth;
  mockCurrentUser.entIdList =
    user.isAdmin === 1 ? [...ALL_PLAT_ENTS] : [...(user.entIdList ?? [])];
}

export function requirePlatAdmin() {
  if (mockCurrentUser.isAdmin === 1) return;
  throw new Error('无权限');
}

export function requirePlatEnt(entId: string) {
  if (mockCurrentUser.isAdmin === 1) return;
  if (mockCurrentUser.entIdList?.includes(entId)) return;
  throw new Error('无权限');
}

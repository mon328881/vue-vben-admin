import { useAccessStore, useUserStore } from '@vben/stores';

import { getCachedCurrentUser } from '#/api/core/user';

export function isAdmin(): boolean {
  const cached = getCachedCurrentUser();
  if (cached?.isAdmin === 1) return true;
  const userInfo = useUserStore().userInfo as null | { isAdmin?: number };
  return userInfo?.isAdmin === 1;
}

/** 是否拥有权限码；超管视为全部拥有 */
export function hasEnt(entId: string): boolean {
  if (isAdmin()) return true;
  const codes = useAccessStore().accessCodes ?? [];
  return codes.includes(entId);
}

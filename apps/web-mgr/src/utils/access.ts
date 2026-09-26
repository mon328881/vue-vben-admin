import { useAccessStore, useUserStore } from '@vben/stores';

import { getCachedCurrentUser } from '#/api/core/user';

/** 是否超管（对齐后端 isAdmin===1；resetAll/closeAll 等敏感接口） */
export function isAdmin(): boolean {
  const cached = getCachedCurrentUser();
  if (cached?.isAdmin === 1) return true;
  const userInfo = useUserStore().userInfo as null | { isAdmin?: number };
  return userInfo?.isAdmin === 1;
}

/** 是否拥有后端 entId；超管视为全权限（对齐旧端 isAdmin===1） */
export function hasEnt(entId: string): boolean {
  if (isAdmin()) return true;
  const codes = useAccessStore().accessCodes ?? [];
  return codes.includes(entId);
}

import { useAccessStore, useUserStore } from '@vben/stores';

import { getCachedCurrentUser } from '#/api/core/user';

/** 是否拥有后端 entId；超管视为全权限（对齐旧端 isAdmin===1） */
export function hasEnt(entId: string): boolean {
  const cached = getCachedCurrentUser();
  if (cached?.isAdmin === 1) return true;
  const userInfo = useUserStore().userInfo as null | { isAdmin?: number };
  if (userInfo?.isAdmin === 1) return true;
  const codes = useAccessStore().accessCodes ?? [];
  return codes.includes(entId);
}

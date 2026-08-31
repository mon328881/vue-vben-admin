import { useAccessStore } from '@vben/stores';

export function hasEnt(entId: string): boolean {
  const accessStore = useAccessStore();
  return accessStore.accessCodes?.includes(entId) ?? false;
}

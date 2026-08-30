import { requestClient } from '#/api/request';

import type { PageResult } from '#/api/types/business';

export interface MchGroupInfo {
  mchGroupId?: number;
  mchGroupName: string;
  state: number;
  isAutoSettle?: number;
  autoSettleTime?: string;
  mchCount?: number;
  settleMchCount?: number;
  totalPrepaid?: number;
  totalBalance?: number;
  settleDiff?: number;
  remark?: string;
}

export async function fetchMchGroupListApi(params: Record<string, unknown>) {
  return requestClient.get<PageResult<MchGroupInfo>>('/mchGroup', { params });
}

export async function fetchMchGroupApi(mchGroupName: string) {
  return requestClient.get<MchGroupInfo>(
    `/mchGroup/${encodeURIComponent(mchGroupName)}`,
  );
}

export async function deleteMchGroupApi(mchGroupName: string) {
  return requestClient.delete(`/mchGroup/${encodeURIComponent(mchGroupName)}`);
}

export async function createMchGroupApi(payload: Record<string, unknown>) {
  return requestClient.post('/mchGroup', payload);
}

export async function updateMchGroupApi(
  mchGroupName: string,
  payload: Record<string, unknown>,
) {
  return requestClient.put(
    `/mchGroup/${encodeURIComponent(mchGroupName)}`,
    payload,
  );
}

export async function settleMchGroupApi(mchGroupName: string) {
  return requestClient.post<{ settledCount?: number }>(
    `/mchGroup/${encodeURIComponent(mchGroupName)}/settle`,
  );
}

import { requestClient } from '#/api/request';

import type { PrepaidHistoryStat } from '#/api/modules/history';
import type { PageResult } from '#/api/types/business';

export interface PassageGroupInfo {
  passageGroupName: string;
  state?: number;
  prepaid?: number;
  balance?: number;
  diff?: number;
  quota?: number;
  creditAmount?: number;
  quotaLimitState?: number;
  prepaidWarnAmount?: number;
  prepaidLowState?: number;
  canThirdNotify?: number;
  successAmount?: number | null;
  successRate?: number | null;
  successCount?: number | null;
  totalCount?: number | null;
  passageCount?: number;
  isAutoSettle?: number;
  autoSettleTime?: string;
  createdAt?: string;
  remark?: string;
  canPush?: number;
  canNotify?: number;
  canRemind?: number;
  canWarn?: number;
}

export interface PassageGroupStat {
  num?: number;
  totalPrepaid?: number;
  totalBalance?: number;
  payPassageAutoClean?: number;
  payPassageAutoCleanTime?: string;
}

export async function fetchPassageGroupListApi(params: Record<string, unknown>) {
  return requestClient.get<PageResult<PassageGroupInfo>>('/passageGroup', {
    params,
  });
}

export async function fetchPassageGroupStatApi(params: {
  passageGroupName?: string;
}) {
  return requestClient.post<PassageGroupStat>('/passageGroupStat', params);
}

export async function deletePassageGroupApi(name: string) {
  return requestClient.delete(`/passageGroup/${encodeURIComponent(name)}`);
}

export async function createPassageGroupApi(payload: Record<string, unknown>) {
  return requestClient.post('/passageGroup', payload);
}

export async function updatePassageGroupApi(
  name: string,
  payload: Record<string, unknown>,
) {
  return requestClient.put(
    `/passageGroup/${encodeURIComponent(name)}`,
    payload,
  );
}

export async function fetchPassageGroupApi(name: string) {
  return requestClient.get<PassageGroupInfo>(
    `/passageGroup/${encodeURIComponent(name)}`,
  );
}

export async function setPassageGroupStateApi(
  passageGroupName: string,
  state: number,
) {
  return requestClient.post('/passageGroupPrepaid/setState', {
    passageGroupName,
    state,
  });
}

export async function fetchPassagePrepaidHistoryByGroupApi(
  params: Record<string, unknown>,
) {
  return requestClient.get<PageResult<Record<string, unknown>>>(
    '/passagePrepaidHistory',
    { params },
  );
}

export async function fetchPassagePrepaidHistoryByGroupStatApi(
  params: Record<string, unknown>,
) {
  return requestClient.post<PrepaidHistoryStat>(
    '/passagePrepaidHistory/stat',
    params,
  );
}

export async function changePassageGroupPrepaidApi(
  name: string,
  payload: { changeAmount: number; changeRemark: string },
) {
  return requestClient.post(
    `/passageGroupPrepaid/change/${encodeURIComponent(name)}`,
    payload,
  );
}

export async function settlePassageGroupApi(name: string) {
  return requestClient.post(
    `/passageGroupPrepaid/settle/${encodeURIComponent(name)}`,
  );
}

export async function multiplePassageGroupPrepaidResetApi(
  selectedIds: string[],
) {
  return requestClient.post('/passageGroupPrepaid/multiple/setPrepaidReset', {
    selectedIds,
  });
}

export async function multiplePassageGroupSettleApi(selectedIds: string[]) {
  return requestClient.post('/passageGroupPrepaid/multiple/settle', {
    selectedIds,
  });
}

export async function allPassageGroupPrepaidResetApi() {
  return requestClient.post('/passageGroupPrepaid/multiple/allPrepaidReset', {});
}

export async function allPassageGroupSettleApi() {
  return requestClient.post('/passageGroupPrepaid/multiple/allSettle', {});
}

export async function postPassageGroupMultipleSetApi(
  action: string,
  payload: Record<string, unknown>,
) {
  return requestClient.post(`/passageGroupMultipleSet/${action}`, payload);
}

import { requestClient } from '#/api/request';

import type { PageResult } from '#/api/types/business';

export interface PayPassage {
  payPassageId: number;
  payPassageName: string;
  productId?: number;
  productName?: string;
  productIcon?: string;
  ifCode?: string;
  payType?: number;
  payRules?: string;
  rate?: number;
  passageGroup?: string;
  passageGroupName?: string;
  agentNo?: string;
  agentName?: string;
  agentRate?: number;
  weights?: number;
  balance?: number;
  state: number;
  timeLimit?: number;
  timeRules?: string;
  openLimit?: number;
  timeLimitState?: number;
  payInterfaceConfig?: string;
  successRate?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PassageStatInfo {
  totalBalance?: number;
  passageNum?: number;
  openPassageNum?: number;
  closedPassageNum?: number;
  payPassageAutoClean?: number;
  payPassageAutoCleanTime?: string;
}

export interface PassageHourlyPoint {
  hour: number;
  hourLabel: string;
  totalCount: number;
  successCount: number;
  successRate: number;
}

export interface PassageHourlyStat {
  points: PassageHourlyPoint[];
  summary: {
    totalCount: number;
    successCount: number;
    successRate: number;
  } | null;
}

export interface PassageHourlyArchive {
  objectKey: string;
  statDate: string;
  rowCount: number;
  url?: string;
}

export interface PassageMchBind {
  mchNo: string;
  mchName?: string;
  agentNo?: string;
  agentName?: string;
  productRate?: number;
  state: number;
}

export interface MchAppsListParams {
  pageNumber?: number;
  pageSize?: number;
  payPassageName?: string;
  payPassageId?: string | number;
  productId?: number | string;
  passageGroup?: string;
  state?: string | number;
  payInterfaceConfig?: string;
  enabledFirst?: number;
  sortField?: string;
  sortOrder?: string;
}

export async function fetchMchAppsApi(params: MchAppsListParams) {
  return requestClient.get<PageResult<PayPassage>>('/mchApps', { params });
}

export async function fetchMchAppApi(payPassageId: number | string) {
  return requestClient.get<PayPassage>(`/mchApps/${payPassageId}`);
}

export async function createMchAppApi(payload: Record<string, unknown>) {
  return requestClient.post<PayPassage>('/mchApps', payload);
}

export async function updateMchAppApi(
  payPassageId: number | string,
  payload: Record<string, unknown>,
) {
  return requestClient.put<PayPassage>(`/mchApps/${payPassageId}`, payload);
}

export async function deleteMchAppApi(payPassageId: number | string) {
  return requestClient.delete(`/mchApps/${payPassageId}`);
}

export async function fetchPassageRealTimeStatApi(params: MchAppsListParams) {
  return requestClient.post<PassageStatInfo>('/passageRealTimeStat', params);
}

export async function changeMchAppBalanceApi(
  payPassageId: number | string,
  payload: { changeAmount: number; changeRemark: string },
) {
  return requestClient.put(`/mchAppsBalance/${payPassageId}`, payload);
}

export async function resetAllMchAppBalanceApi(googleCode: string) {
  return requestClient.post('/mchAppsBalanceReset/resetAll', { googleCode });
}

export async function setPassageAutoCleanApi(payload: {
  googleCode: string;
  autoCleanEnable: number;
  time: string;
}) {
  return requestClient.post<PassageStatInfo>(
    '/passageStatInfo/setPassageAutoClean',
    payload,
  );
}

export async function closeAllMchAppsApi(googleCode: string) {
  return requestClient.post('/mchAppsMultipleSet/closeAll', { googleCode });
}

export async function openRecentlyMchAppsApi() {
  return requestClient.post('/mchAppsMultipleSet/openRecently', {});
}

export async function postMchAppsMultipleSetApi(
  action: string,
  payload: Record<string, unknown>,
) {
  return requestClient.post(`/mchAppsMultipleSet/${action}`, payload);
}

export async function fetchPassageHourlyStatApi(params: {
  payPassageId: number | string;
  date?: string;
}) {
  return requestClient.get<PassageHourlyStat>('/passageHourlyStat', { params });
}

export async function fetchPassageHourlyArchivesApi() {
  const page = await requestClient.get<PageResult<PassageHourlyArchive>>(
    '/passageHourlyStat/archives',
  );
  return page?.records ?? [];
}

export async function fetchPassageMchInfoApi(params: Record<string, unknown>) {
  return requestClient.get<PageResult<PassageMchBind>>('/passageMchInfo', {
    params,
  });
}

export async function updatePassageMchInfoApi(payload: {
  payPassageId: number;
  mchNo: string;
  state: number;
}) {
  return requestClient.put('/passageMchInfo', payload);
}

export async function passageMchBlindAllApi(payPassageId: number | string) {
  return requestClient.post(`/passageMchInfo/blindAll/${payPassageId}`);
}

export async function passageMchUnBlindAllApi(payPassageId: number | string) {
  return requestClient.post(`/passageMchInfo/unBlindAll/${payPassageId}`);
}

export async function passageMchBatchSetApi(
  payPassageId: number | string,
  payload: { selectedIds: string[]; state: number },
) {
  return requestClient.post(
    `/passageMchInfo/batchSet/${payPassageId}`,
    payload,
  );
}

export async function doPassagePayTestApi(payload: {
  testOrderNo: string;
  passageId: number;
  amount: number;
  testOrderIn: number;
  productId?: number;
}) {
  return requestClient.post<{ payData?: string }>('/passageTest/doPay', payload);
}

export async function fetchPayIfCodeApi() {
  return requestClient.get<Array<{ ifCode: string; ifName: string }>>(
    '/payIfCode',
  );
}

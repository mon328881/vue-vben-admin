import type { PageResult, PayTestEnvelope } from '#/api/types/business';

import { requestClient } from '#/api/request';

export interface PayPassage {
  payPassageId: number;
  payPassageName: string;
  productId?: number;
  /** 列表字段；GET /mchApps/{id} 详情契约不含此键 */
  productName?: string;
  /** 所属产品图标文件名（列表字段；详情契约不含） */
  icon?: string;
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
  /** 通道日限额（分）；详情契约字段 */
  quota?: number;
  /** 限额开关：0 关 / 1 开 */
  quotaLimitState?: number;
  state: number;
  timeLimit?: number;
  timeRules?: string;
  openLimit?: number;
  isBindAll?: number;
  timeLimitState?: number;
  payInterfaceConfig?: null | string;
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
  /** 请求回显 */
  payPassageId?: number | string;
  /** 请求回显（非法 date → 全 0 空表，不兜底今日） */
  date?: string;
  points: PassageHourlyPoint[];
  summary: null | {
    successCount: number;
    successRate: number;
    totalCount: number;
  };
}

export interface PassageHourlyArchive {
  objectKey: string;
  statDate: string;
  rowCount: number;
  url?: string;
  fileName?: string;
  createdAt?: string;
}

/** GET /passageHourlyStat/archives 新契约 */
export interface PassageHourlyArchivesResult {
  records: PassageHourlyArchive[];
  maxCount?: number;
  totalCoverageDays?: number;
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
  payPassageId?: number | string;
  productId?: number | string;
  passageGroup?: string;
  state?: number | string;
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
  return requestClient.post('/mchApps', payload);
}

export async function updateMchAppApi(
  payPassageId: number | string,
  payload: Record<string, unknown>,
) {
  return requestClient.put(`/mchApps/${payPassageId}`, payload);
}

export async function deleteMchAppApi(payPassageId: number | string) {
  return requestClient.delete(`/mchApps/${payPassageId}`);
}

export async function fetchPassageRealTimeStatApi(params: MchAppsListParams) {
  return requestClient.post<PassageStatInfo>('/passageRealTimeStat', params);
}

export async function changeMchAppBalanceApi(
  payPassageId: number | string,
  // demo 实发：changeAmount 为字符串（后端 yuanToCent 接受串/数）
  payload: { changeAmount: number | string; changeRemark: string },
) {
  return requestClient.put(`/mchAppsBalance/${payPassageId}`, payload);
}

export async function resetAllMchAppBalanceApi(googleCode: string) {
  return requestClient.post('/mchAppsBalanceReset/resetAll', { googleCode });
}

export async function setPassageAutoCleanApi(payload: {
  autoCleanEnable: number;
  googleCode: string;
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

export async function batchCopyMchAppsApi(
  items: { payPassageName: string; sourcePayPassageId: number }[],
) {
  return requestClient.post<{
    failCount?: number;
    failItems?: Array<{
      reason?: string;
      sourcePayPassageId?: number;
      sourcePayPassageName?: string;
    }>;
    newPayPassageIds?: number[];
    successCount?: number;
  }>('/mchAppsCopy/batchCopy', { items });
}

export async function fetchPassageHourlyStatApi(params: {
  date?: string;
  payPassageId: number | string;
}) {
  return requestClient.get<PassageHourlyStat>('/passageHourlyStat', { params });
}

export async function fetchPassageHourlyArchivesApi(): Promise<PassageHourlyArchivesResult> {
  const page = await requestClient.get<
    | PageResult<PassageHourlyArchive>
    | PassageHourlyArchive[]
    | PassageHourlyArchivesResult
  >('/passageHourlyStat/archives');
  // 兼容：新契约 {records,maxCount,totalCoverageDays} / 直接数组 / 偶发多包一层 data
  if (Array.isArray(page)) return { records: page };
  if (page && typeof page === 'object') {
    if (Array.isArray(page.records)) {
      return {
        records: page.records,
        maxCount: (page as PassageHourlyArchivesResult).maxCount,
        totalCoverageDays: (page as PassageHourlyArchivesResult)
          .totalCoverageDays,
      };
    }
    const nested = (page as { data?: unknown }).data;
    if (Array.isArray(nested))
      return { records: nested as PassageHourlyArchive[] };
    if (
      nested &&
      typeof nested === 'object' &&
      Array.isArray((nested as PassageHourlyArchivesResult).records)
    ) {
      const body = nested as PassageHourlyArchivesResult;
      return {
        records: body.records,
        maxCount: body.maxCount,
        totalCoverageDays: body.totalCoverageDays,
      };
    }
  }
  return { records: [] };
}

export async function fetchPassageMchInfoApi(params: Record<string, unknown>) {
  return requestClient.get<PageResult<PassageMchBind>>('/passageMchInfo', {
    params,
  });
}

export async function updatePassageMchInfoApi(payload: {
  mchNo: string;
  payPassageId: number;
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
  amount: number;
  passageId: number;
  productId?: null | number | string;
  testOrderIn: number;
  testOrderNo: string;
}) {
  // 拦截器剥外层后为内层信封 {code,data:{payData,...},msg,sign}
  return requestClient.post<PayTestEnvelope>('/passageTest/doPay', payload);
}

export async function fetchPayIfCodeApi() {
  return requestClient.get<Array<{ ifCode: string; ifName: string }>>(
    '/payIfCode',
  );
}

import { requestClient } from '#/api/request';

import type { PageResult, TwoDayCount } from '#/api/types/business';

export interface SystemInfo {
  type?: number;
  balance?: number;
  expireDate?: string;
}

export interface RealTimePassageItem {
  passageId?: number;
  passageName?: string;
  allCount?: number;
  successCount?: number;
  successAmount?: number;
  totalAmount?: number;
}

export interface DashboardRankRow {
  name?: string;
  mchNo?: string;
  mchName?: string;
  agentNo?: string;
  agentName?: string;
  payPassageId?: number;
  payPassageName?: string;
  passageGroupName?: string;
  balance?: number;
  prepaid?: number;
  diff?: number;
  successAmount?: number;
  successRate?: number;
  successCount?: number;
  totalCount?: number;
  state?: number;
}

export interface ConcurrentRow {
  mchNo?: string;
  mchName?: string;
  allCount?: number;
  successCount?: number;
  realTimeRate?: number;
  perMinCount?: number;
}

export interface MchVolumeRateRow {
  mchFeeRate?: number;
  totalAmount?: number;
  totalSuccessAmount?: number;
  totalOrderCount?: number;
  orderSuccessCount?: number;
  platTotalIncome?: number;
}

export interface MchVolumeProduct {
  productId?: number;
  productName?: string;
  totalAmount?: number;
  totalSuccessAmount?: number;
  totalOrderCount?: number;
  orderSuccessCount?: number;
  totalCost?: number;
  platTotalIncome?: number;
  rates?: MchVolumeRateRow[];
}

export interface MchVolumeSummary {
  statisticsDate?: string;
  totalSuccessAmount?: number;
  totalAmount?: number;
  totalOrderCount?: number;
  orderSuccessCount?: number;
  totalCost?: number;
  platTotalIncome?: number;
  products?: MchVolumeProduct[];
}

export interface PassageRateRow {
  passageRate?: number;
  totalAmount?: number;
  totalSuccessAmount?: number;
  totalOrderCount?: number;
  orderSuccessCount?: number;
}

export interface PassageRateDetail {
  totalAmount?: number;
  totalSuccessAmount?: number;
  totalOrderCount?: number;
  orderSuccessCount?: number;
  totalCost?: number;
  payPassageId?: number;
  payPassageName?: string;
  productId?: number;
  productName?: string;
  statisticsDate?: string;
  successRate?: number;
  rates?: PassageRateRow[];
}

export async function fetchSystemInfoApi() {
  return requestClient.get<SystemInfo>('/mainChart/querySystemInfo');
}

export async function fetchTwoDayCountApi() {
  return requestClient.get<TwoDayCount>('/mainChart/twoDayCount');
}

/** 进单开关状态：1 开 / 0 关 */
export async function fetchOpenStateApi() {
  return requestClient.get<number>('/mainChart/getOpenState');
}

export async function setOpenStateApi(payload: {
  setOpenState: number;
  googleCode?: string;
}) {
  return requestClient.put('/mainChart/setOpenState', payload);
}

export async function fetchRealTimeCountApi(minutes: number | string) {
  return requestClient.get<null | Record<string, RealTimePassageItem>>(
    `/mainChart/realTimeCount/${minutes}`,
  );
}

export async function fetchRealTimeConcurrentApi(
  params: Record<string, unknown>,
) {
  return requestClient.get<PageResult<ConcurrentRow>>(
    '/mainChart/realTimeConcurrent',
    { params },
  );
}

export async function fetchDashboardMchRankApi(params: Record<string, unknown>) {
  return requestClient.get<PageResult<DashboardRankRow>>('/mchStatInfo', {
    params,
  });
}

export async function fetchDashboardPassageRankApi(
  params: Record<string, unknown>,
) {
  return requestClient.get<PageResult<DashboardRankRow>>('/passageStatInfo', {
    params,
  });
}

export async function fetchDashboardPassageGroupRankApi(
  params: Record<string, unknown>,
) {
  return requestClient.get<PageResult<DashboardRankRow>>('/passageGroup', {
    params,
  });
}

export async function fetchDashboardAgentRankApi(
  params: Record<string, unknown>,
) {
  return requestClient.get<PageResult<DashboardRankRow>>('/agentStatInfo', {
    params,
  });
}

export async function fetchMchVolumeSummaryApi(params: {
  mchNo: string;
  statisticsDate: string;
}) {
  return requestClient.get<MchVolumeSummary>('/mchStat/volumeSummary', {
    params,
  });
}

export async function fetchPassageRateDetailApi(params: {
  statisticsDate: string;
  payPassageId: number;
}) {
  return requestClient.get<PassageRateDetail>('/passageStat/rateDetail', {
    params,
  });
}

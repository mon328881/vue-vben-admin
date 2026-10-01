import type { PageResult, TwoDayCount } from '#/api/types/business';

import { requestClient } from '#/api/request';

export interface SystemInfo {
  type?: number;
  balance?: number;
  expireDate?: string;
  /** 三端地址，来自 tenant_endpoint（role=MGR/MCH/AGENT 的 api_host） */
  mgrUrl?: string;
  mchUrl?: string;
  agentUrl?: string;
}

export interface RealTimePassageItem {
  payPassageId?: number;
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

/** demo 2026-10-01：products[] 14 键字母序 */
export interface MchVolumeProduct {
  icon?: string;
  mchName?: string;
  mchNo?: string;
  orderSuccessCount?: number;
  platTotalIncome?: number;
  productId?: number;
  productName?: string;
  rates?: MchVolumeRateRow[];
  statisticsDate?: string;
  successRate?: number;
  totalAmount?: number;
  totalCost?: number;
  totalOrderCount?: number;
  totalSuccessAmount?: number;
}

export interface MchVolumeSummary {
  mchName?: string;
  mchNo?: string;
  statisticsDate?: string;
  totalSuccessAmount?: number;
  totalAmount?: number;
  totalOrderCount?: number;
  orderSuccessCount?: number;
  successRate?: number;
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
  googleCode?: string;
  setOpenState: number;
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

export async function fetchDashboardMchRankApi(
  params: Record<string, unknown>,
) {
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
  payPassageId: number;
  statisticsDate: string;
}) {
  return requestClient.get<PassageRateDetail>('/passageStat/rateDetail', {
    params,
  });
}

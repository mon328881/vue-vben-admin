import { requestClient } from '#/api/request';

import type { MchPrepaidHistory, PageResult } from '#/api/types/business';

export interface HistoryStat {
  totalAmount?: number;
  totalCount?: number;
}

export interface HistoryListParams {
  pageNumber?: number;
  pageSize?: number;
  createdStart?: string;
  createdEnd?: string;
  [key: string]: unknown;
}

/** 商户预付流水 */
export async function fetchMchPrepaidHistoryApi(params: HistoryListParams) {
  return requestClient.get<PageResult<MchPrepaidHistory>>('/mchPrepaidHistory', {
    params,
  });
}

export async function fetchMchPrepaidHistoryStatApi(params: HistoryListParams) {
  return requestClient.post<HistoryStat>('/mchPrepaidHistory/stat', params);
}

/** 商户资金流水 */
export async function fetchMchHistoryApi(params: HistoryListParams) {
  return requestClient.get<PageResult<Record<string, unknown>>>('/mchHistory', {
    params,
  });
}

export async function fetchMchHistoryStatApi(params: HistoryListParams) {
  return requestClient.post<HistoryStat>('/mchHistory/count', params);
}

/** 代理资金流水 */
export async function fetchAgentHistoryApi(params: HistoryListParams) {
  return requestClient.get<PageResult<Record<string, unknown>>>(
    '/agentHistory',
    { params },
  );
}

export async function fetchAgentHistoryStatApi(params: HistoryListParams) {
  return requestClient.post<HistoryStat>('/agentHistory/count', params);
}

/** 通道资金流水 */
export async function fetchPassageHistoryApi(params: HistoryListParams) {
  return requestClient.get<PageResult<Record<string, unknown>>>(
    '/passageHistory',
    { params },
  );
}

export async function fetchPassageHistoryStatApi(params: HistoryListParams) {
  return requestClient.post<HistoryStat>('/passageHistory/count', params);
}

/** 供应商预付流水 */
export async function fetchPassagePrepaidHistoryApi(params: HistoryListParams) {
  return requestClient.get<PageResult<Record<string, unknown>>>(
    '/passagePrepaidHistoryPage',
    { params },
  );
}

export async function fetchPassagePrepaidHistoryStatApi(
  params: HistoryListParams,
) {
  return requestClient.post<HistoryStat>(
    '/passagePrepaidHistoryPage/stat',
    params,
  );
}

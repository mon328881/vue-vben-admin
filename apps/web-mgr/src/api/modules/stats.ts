import { requestClient } from '#/api/request';

import type { PageResult } from '#/api/types/business';

export interface StatCount {
  totalSuccessAmount?: number;
  totalSuccessCount?: number;
  totalIncome?: number;
  totalMchCost?: number;
  platTotalIncome?: number;
  totalCost?: number;
  totalAgentIncome?: number;
  [key: string]: unknown;
}

export interface StatListParams {
  pageNumber?: number;
  pageSize?: number;
  createdStart?: string;
  createdEnd?: string;
  [key: string]: unknown;
}

export async function fetchPlatStatApi(params: StatListParams) {
  return requestClient.get<PageResult<Record<string, unknown>>>('/platStat', {
    params,
  });
}

export async function fetchPlatStatCountApi(params: StatListParams) {
  return requestClient.post<StatCount>('/platStat/count', params);
}

export async function fetchMchStatApi(params: StatListParams) {
  return requestClient.get<PageResult<Record<string, unknown>>>('/mchStat', {
    params,
  });
}

export async function fetchMchStatCountApi(params: StatListParams) {
  return requestClient.post<StatCount>('/mchStat/count', params);
}

export async function fetchMchProductStatApi(params: StatListParams) {
  return requestClient.get<PageResult<Record<string, unknown>>>(
    '/mchProductStat',
    { params },
  );
}

export async function fetchMchProductStatCountApi(params: StatListParams) {
  return requestClient.post<StatCount>('/mchProductStat/count', params);
}

export async function fetchPassageStatApi(params: StatListParams) {
  return requestClient.get<PageResult<Record<string, unknown>>>(
    '/passageStat',
    { params },
  );
}

export async function fetchPassageStatCountApi(params: StatListParams) {
  return requestClient.post<StatCount>('/passageStat/count', params);
}

export async function fetchProductStatApi(params: StatListParams) {
  return requestClient.get<PageResult<Record<string, unknown>>>(
    '/productStat',
    { params },
  );
}

export async function fetchProductStatCountApi(params: StatListParams) {
  return requestClient.post<StatCount>('/productStat/count', params);
}

export async function fetchAgentStatApi(params: StatListParams) {
  return requestClient.get<PageResult<Record<string, unknown>>>('/agentStat', {
    params,
  });
}

export async function fetchAgentStatCountApi(params: StatListParams) {
  return requestClient.post<StatCount>('/agentStat/count', params);
}

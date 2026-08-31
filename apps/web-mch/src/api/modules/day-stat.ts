import { requestClient } from '#/api/request';

import type { MchStat, PageResult } from '#/api/types/business';

export interface DayStatCount {
  totalMchCost: number;
  totalSuccessAmount: number;
  totalSuccessCount: number;
}

export async function fetchDayStatListApi(params: {
  pageNumber: number;
  pageSize: number;
  createdStart?: string;
  createdEnd?: string;
}) {
  return requestClient.get<PageResult<MchStat>>('/mchDayStat', { params });
}

export async function fetchDayStatCountApi(params: {
  createdStart?: string;
  createdEnd?: string;
}) {
  return requestClient.post<DayStatCount>('/mchDayStat/count', params);
}

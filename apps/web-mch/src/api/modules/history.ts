import { requestClient } from '#/api/request';

import type { MchAccountHistory, PageResult } from '#/api/types/business';

export interface HistoryQuery {
  pageNumber?: number;
  pageSize?: number;
  mchOrderNo?: string;
  payOrderId?: string;
  bizType?: number;
  fundDirection?: number;
  createdStart?: string;
  createdEnd?: string;
}

export async function fetchHistoryListApi(params: HistoryQuery) {
  return requestClient.get<PageResult<MchAccountHistory>>('/mchHistory', {
    params,
  });
}

export async function fetchHistoryCountApi(params: HistoryQuery) {
  return requestClient.post<{ totalAmount: number; totalCount: number }>(
    '/mchHistory/count',
    params,
  );
}

import { requestClient } from '#/api/request';

import type {
  MchPrepaidHistory,
  PageResult,
} from '#/api/types/business';

export async function fetchMchPrepaidHistoryApi(params: {
  pageNumber: number;
  pageSize: number;
  fundDirection?: number;
  createdStart?: string;
  createdEnd?: string;
}) {
  return requestClient.get<PageResult<MchPrepaidHistory>>('/mchPrepaidHistory', {
    params,
  });
}

export async function fetchMchPrepaidHistoryStatApi(params: {
  fundDirection?: number;
  createdStart?: string;
  createdEnd?: string;
}) {
  return requestClient.post<{ totalAmount: number; totalCount: number }>(
    '/mchPrepaidHistory/stat',
    params,
  );
}

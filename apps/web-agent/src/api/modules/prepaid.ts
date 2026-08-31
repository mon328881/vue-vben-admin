import { requestClient } from '#/api/request';
import type { PageResult, PrepaidHistory } from '#/api/types/business';

export async function fetchPrepaidHistoryListApi(params: {
  pageNumber?: number;
  pageSize?: number;
  mchNo?: string;
  mchName?: string;
  fundDirection?: number;
  createdStart?: string;
  createdEnd?: string;
}) {
  return requestClient.get<PageResult<PrepaidHistory>>('/mchPrepaidHistory', {
    params,
  });
}

export async function fetchPrepaidHistoryStatApi(body: {
  mchNo?: string;
  mchName?: string;
  fundDirection?: number;
  createdStart?: string;
  createdEnd?: string;
}) {
  return requestClient.post<{ totalAmount: number }>(
    '/mchPrepaidHistory/stat',
    body,
  );
}

export async function fetchPicBase64Api(pic?: string) {
  return requestClient.post<string>('/file/getPicBase64', null, {
    params: { pic },
  });
}

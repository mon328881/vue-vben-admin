import { requestClient } from '#/api/request';

import type {
  MchInfoResult,
  MchProductStat,
  PageResult,
  TwoDayCountResult,
} from '#/api/types/business';

export async function fetchMchInfoApi() {
  return requestClient.get<MchInfoResult>('/mainChart/mchInfo');
}

export async function fetchTwoDayCountApi() {
  return requestClient.get<TwoDayCountResult>('/mainChart/twoDayCount');
}

export async function fetchProductStatPageApi(
  pageNumber = 1,
  pageSize = 10,
  date?: string,
) {
  return requestClient.get<PageResult<MchProductStat>>('/mainChart', {
    params: { date, pageNumber, pageSize },
  });
}

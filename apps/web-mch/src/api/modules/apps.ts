import { requestClient } from '#/api/request';

import type { MchAppItem, PageResult } from '#/api/types/business';

export async function fetchMchAppsApi(params: {
  pageNumber: number;
  pageSize: number;
  productId?: number;
  productName?: string;
  state?: number;
}) {
  return requestClient.get<PageResult<MchAppItem>>('/mchApps', { params });
}

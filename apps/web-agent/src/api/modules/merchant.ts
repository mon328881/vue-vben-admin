import { requestClient } from '#/api/request';
import type { MchAgentRow, MchProductRate, PageResult } from '#/api/types/business';

export async function fetchMchAgentListApi(params: {
  pageNumber?: number;
  pageSize?: number;
  mchNo?: string;
  mchName?: string;
}) {
  return requestClient.get<PageResult<MchAgentRow>>('/mchInfo', { params });
}

export async function fetchMchProductListApi(params: {
  pageNumber?: number;
  pageSize?: number;
  mchNo: string;
  productId?: number;
}) {
  return requestClient.get<PageResult<MchProductRate>>('/mchProduct', {
    params,
  });
}

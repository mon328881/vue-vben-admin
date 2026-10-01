import type { PageResult } from '#/api/types/business';

import { requestClient } from '#/api/request';

export interface PayWay {
  productId: number;
  productName: string;
  detail?: string;
  icon?: string;
  mode?: number;
  state?: number;
  limitState?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductMchBind {
  productId: number;
  productName?: string;
  mchNo: string;
  mchName?: string;
  agentNo?: string;
  agentName?: string;
  state?: number;
  mchRate?: number;
  agentRate?: number;
}

export interface PayWayListParams {
  pageNumber?: number;
  pageSize?: number;
  productId?: number | string;
  productName?: string;
  state?: string;
  limitState?: string;
  sortField?: string;
  sortOrder?: string;
}

export async function fetchPayWaysApi(params: PayWayListParams) {
  // 不传 sortField 时后端默认 state DESC + productId ASC（demo 2026-09-30）；
  // 勿再硬塞 sortOrder=descend，否则易被误当成「按 ID 降序」。
  return requestClient.get<PageResult<PayWay>>('/payWays', { params });
}

export async function fetchPayWayApi(productId: number) {
  return requestClient.get<PayWay>(`/payWays/${productId}`);
}

export async function createPayWayApi(payload: {
  detail?: string;
  icon?: string;
  mode: number;
  productId: number;
  productName: string;
}) {
  return requestClient.post('/payWays', payload);
}

export async function updatePayWayApi(
  productId: number,
  payload: Partial<
    Pick<
      PayWay,
      'detail' | 'icon' | 'limitState' | 'mode' | 'productName' | 'state'
    >
  >,
) {
  return requestClient.put(`/payWays/${productId}`, payload);
}

export async function deletePayWayApi(productId: number) {
  return requestClient.delete(`/payWays/${productId}`);
}

export async function queryPayWayBatchRateKeyApi() {
  return requestClient.post<number>('/payWays/queryBatchRateKey', {});
}

export async function verifyPayWayBatchRateAuthApi(googleCode: number) {
  return requestClient.post('/payWays/verifyBatchRateAuth', { googleCode });
}

export async function batchPayWayRateApi(payload: Record<string, unknown>) {
  return requestClient.post('/payWays/batchRate', payload);
}

export async function fetchProductMchInfoApi(params: Record<string, unknown>) {
  return requestClient.get<PageResult<ProductMchBind>>('/productMchInfo', {
    params,
  });
}

export async function updateProductMchInfoApi(
  payload: Record<string, unknown>,
) {
  return requestClient.put('/productMchInfo', payload);
}

export async function productMchBlindAllApi(productId: number) {
  return requestClient.post(`/productMchInfo/blindAll/${productId}`);
}

export async function productMchUnBlindAllApi(productId: number) {
  return requestClient.post(`/productMchInfo/unBlindAll/${productId}`);
}

export async function setProductMchBatchRateApi(
  productId: number,
  payload: Record<string, unknown>,
) {
  return requestClient.post(
    `/productMchInfo/setBatchRate/${productId}`,
    payload,
  );
}

export async function setProductMchAllRateApi(
  productId: number,
  payload: Record<string, unknown>,
) {
  return requestClient.post(`/productMchInfo/setAllRate/${productId}`, payload);
}

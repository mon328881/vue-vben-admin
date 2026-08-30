import { requestClient } from '#/api/request';

import type { PageResult } from '#/api/types/business';

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
}

export async function fetchPayWaysApi(params: PayWayListParams) {
  return requestClient.get<PageResult<PayWay>>('/payWays', { params });
}

export async function fetchPayWayApi(productId: number) {
  return requestClient.get<PayWay>(`/payWays/${productId}`);
}

export async function createPayWayApi(payload: {
  productId: number;
  productName: string;
  detail?: string;
  mode: number;
  icon?: string;
}) {
  return requestClient.post<PayWay>('/payWays', payload);
}

export async function updatePayWayApi(
  productId: number,
  payload: Partial<
    Pick<PayWay, 'productName' | 'detail' | 'mode' | 'icon' | 'state' | 'limitState'>
  >,
) {
  return requestClient.put<PayWay>(`/payWays/${productId}`, payload);
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

export async function updateProductMchInfoApi(payload: Record<string, unknown>) {
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

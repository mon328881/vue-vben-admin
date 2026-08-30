import { requestClient } from '#/api/request';

import type { PageResult } from '#/api/types/business';

export interface PayIfDefine {
  ifCode: string;
  ifName: string;
  ifParams?: string;
  remark?: string;
  bgColor?: string;
  createdAt?: string;
}

export async function fetchPayIfDefinesApi(params: Record<string, unknown>) {
  return requestClient.get<PageResult<PayIfDefine>>('/payIfDefines', {
    params,
  });
}

export async function fetchPayIfDefineApi(ifCode: string) {
  return requestClient.get<PayIfDefine>(`/payIfDefines/${ifCode}`);
}

export async function createPayIfDefineApi(payload: Record<string, unknown>) {
  return requestClient.post('/payIfDefines', payload);
}

export async function updatePayIfDefineApi(
  ifCode: string,
  payload: Record<string, unknown>,
) {
  return requestClient.put(`/payIfDefines/${ifCode}`, payload);
}

export async function deletePayIfDefineApi(ifCode: string) {
  return requestClient.delete(`/payIfDefines/${ifCode}`);
}

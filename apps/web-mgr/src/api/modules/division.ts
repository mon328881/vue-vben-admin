import type { PageResult } from '#/api/types/business';

import { requestClient } from '#/api/request';

export interface DivisionRecord {
  /** demo 2026-10-01：列表返回数字 id；审核路径按字符串 long 解析 */
  recordId: number | string;
  userNo?: string;
  userName?: string;
  /** 申请金额 */
  amount?: number;
  applyAmount?: number;
  /** 到账金额 */
  divisionAmount?: number;
  receiveAmount?: number;
  /** 服务费 */
  divisionAmountFee?: number;
  feeAmount?: number;
  state?: number;
  remark?: string;
  createdAt?: string;
  expiredTime?: string;
}

export async function fetchMchDivisionListApi(params: Record<string, unknown>) {
  return requestClient.get<PageResult<DivisionRecord>>('/mchDivision', {
    params,
  });
}

export async function fetchMchDivisionCountApi(
  params?: Record<string, unknown>,
) {
  return requestClient.post('/mchDivision/count', params ?? {});
}

export async function reviewMchDivisionOkApi(id: number | string) {
  return requestClient.post(`/mchDivision/reviewOk/${id}`, { state: 2 });
}

export async function reviewMchDivisionRefuseApi(id: number | string) {
  return requestClient.post(`/mchDivision/reviewRefuse/${id}`, { state: 3 });
}

export async function fetchMchDivisionConfigApi() {
  return requestClient.post<Record<string, unknown>>(
    '/mchDivision/getConfig',
    {},
  );
}

export async function setMchDivisionConfigApi(
  payload: Record<string, unknown>,
) {
  return requestClient.post('/mchDivision/setConfig', payload);
}

export async function fetchAgentDivisionListApi(
  params: Record<string, unknown>,
) {
  return requestClient.get<PageResult<DivisionRecord>>('/agentDivision', {
    params,
  });
}

export async function fetchAgentDivisionCountApi(
  params?: Record<string, unknown>,
) {
  return requestClient.post('/agentDivision/count', params ?? {});
}

export async function reviewAgentDivisionOkApi(id: number | string) {
  return requestClient.post(`/agentDivision/reviewOk/${id}`, { state: 2 });
}

export async function reviewAgentDivisionRefuseApi(id: number | string) {
  return requestClient.post(`/agentDivision/reviewRefuse/${id}`, { state: 3 });
}

export async function fetchAgentDivisionConfigApi() {
  return requestClient.post<Record<string, unknown>>(
    '/agentDivision/getConfig',
    {},
  );
}

export async function setAgentDivisionConfigApi(
  payload: Record<string, unknown>,
) {
  return requestClient.post('/agentDivision/setConfig', payload);
}

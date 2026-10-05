import type {
  DivisionConfig,
  DivisionInfo,
  DivisionRecord,
  PageResult,
} from '#/api/types/business';

import { requestClient } from '#/api/request';

export async function fetchDivisionListApi(params: {
  createdEnd?: string;
  createdStart?: string;
  pageNumber?: number;
  pageSize?: number;
  recordId?: string;
  state?: number;
}) {
  return requestClient.get<PageResult<DivisionRecord>>('/agentDivision', {
    params,
  });
}

export async function fetchDivisionConfigApi() {
  return requestClient.post<DivisionConfig>('/agentDivision/getConfig', {});
}

export async function fetchDivisionInfoApi() {
  // 本地 agent-api 账户信息在 GET /agentInfo；/agentDivision/info 无路由会 401 空体并被鉴权拦截器整页登出
  return requestClient.get<DivisionInfo>('/agentInfo');
}

export async function applyDivisionApi(amount: number, remark?: string) {
  return requestClient.post<DivisionRecord>('/agentDivision', {
    amount,
    remark,
  });
}

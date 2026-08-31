import { requestClient } from '#/api/request';
import type {
  DivisionConfig,
  DivisionInfo,
  DivisionRecord,
  PageResult,
} from '#/api/types/business';

export async function fetchDivisionListApi(params: {
  pageNumber?: number;
  pageSize?: number;
  state?: number;
  recordId?: string;
  createdStart?: string;
  createdEnd?: string;
}) {
  return requestClient.get<PageResult<DivisionRecord>>('/agentDivision', {
    params,
  });
}

export async function fetchDivisionConfigApi() {
  return requestClient.post<DivisionConfig>('/agentDivision/getConfig', {});
}

export async function fetchDivisionInfoApi() {
  return requestClient.get<DivisionInfo>('/agentDivision/info');
}

export async function applyDivisionApi(amount: number, remark?: string) {
  return requestClient.post<DivisionRecord>('/agentDivision', {
    amount,
    remark,
  });
}

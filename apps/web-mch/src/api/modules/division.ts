import { requestClient } from '#/api/request';

import type {
  MchDivisionConfig,
  MchDivisionRecord,
  MchInfoDetail,
  PageResult,
} from '#/api/types/business';

export async function fetchDivisionMchInfoApi() {
  return requestClient.get<MchInfoDetail>('/mchInfo/info');
}

export async function fetchDivisionConfigApi() {
  return requestClient.post<MchDivisionConfig>('/mchDivision/getConfig', {});
}

export async function fetchDivisionListApi(params: {
  pageNumber: number;
  pageSize: number;
  recordId?: string;
  state?: number;
  createdStart?: string;
  createdEnd?: string;
}) {
  return requestClient.get<PageResult<MchDivisionRecord>>('/mchDivision', {
    params,
  });
}

export async function applyDivisionApi(amount: number, remark?: string) {
  return requestClient.post<MchDivisionRecord>('/mchDivision', {
    amount,
    remark,
  });
}

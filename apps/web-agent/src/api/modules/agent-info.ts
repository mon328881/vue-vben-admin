import { requestClient } from '#/api/request';
import type { AgentInfo, PageResult } from '#/api/types/business';

export async function fetchAgentInfoApi() {
  return requestClient.get<AgentInfo>('/agentInfo');
}

export async function fetchMchInfoListApi(params: {
  pageNumber?: number;
  pageSize?: number;
  mchNo?: string;
  mchName?: string;
  date?: string;
}) {
  return requestClient.get<PageResult<import('#/api/types/business').MchAgentRow>>(
    '/mchInfo',
    { params },
  );
}

export async function fetchPassageInfoListApi(params: {
  pageNumber?: number;
  pageSize?: number;
  date?: string;
}) {
  return requestClient.get<
    PageResult<import('#/api/types/business').PassageInfoRow>
  >('/passageInfo', { params });
}

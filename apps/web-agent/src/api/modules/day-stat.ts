import { requestClient } from '#/api/request';
import type { AgentDayStat, PageResult } from '#/api/types/business';

export async function fetchDayStatListApi(params: {
  pageNumber?: number;
  pageSize?: number;
  createdStart?: string;
  createdEnd?: string;
}) {
  return requestClient.get<PageResult<AgentDayStat>>('/agentDayStat', {
    params,
  });
}

export async function fetchDayStatCountApi(params: {
  createdStart?: string;
  createdEnd?: string;
}) {
  return requestClient.post<{
    totalSuccessAmount: number;
    totalAgentIncome: number;
    totalSuccessCount: number;
  }>('/agentDayStat/count', undefined, { params });
}

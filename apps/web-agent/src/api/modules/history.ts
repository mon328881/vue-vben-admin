import { requestClient } from '#/api/request';
import type { AgentHistory, PageResult } from '#/api/types/business';

export async function fetchAgentHistoryListApi(params: {
  pageNumber?: number;
  pageSize?: number;
  payOrderId?: string;
  bizType?: number;
  fundDirection?: number;
  createdStart?: string;
  createdEnd?: string;
}) {
  return requestClient.get<PageResult<AgentHistory>>('/agentHistory', {
    params,
  });
}

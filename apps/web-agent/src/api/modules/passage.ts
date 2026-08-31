import { requestClient } from '#/api/request';
import type { PageResult, PassageRow } from '#/api/types/business';

export async function fetchAgentPassageListApi(params: {
  pageNumber?: number;
  pageSize?: number;
  payPassageId?: string;
  payPassageName?: string;
}) {
  return requestClient.get<PageResult<PassageRow>>('/agentPassage', { params });
}

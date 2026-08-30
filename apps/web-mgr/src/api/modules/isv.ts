import { requestClient } from '#/api/request';

import type { AgentInfo, PageResult } from '#/api/types/business';

export interface IsvListParams {
  pageNumber?: number;
  pageSize?: number;
  agentNo?: string;
  agentName?: string;
  state?: string | number;
}

export interface AgentInfoPayload {
  agentName: string;
  loginUserName: string;
  state: number;
  remark: string;
  [key: string]: unknown;
}

export interface AgentStatInfo {
  agentNum?: number;
  totalBalance?: number;
  freezeBalance?: number;
}

export async function fetchIsvListApi(params: IsvListParams) {
  return requestClient.get<PageResult<AgentInfo>>('/isvInfo', { params });
}

export async function fetchIsvInfoApi(agentNo: string) {
  return requestClient.get<AgentInfo>(`/isvInfo/${agentNo}`);
}

export async function createIsvInfoApi(payload: AgentInfoPayload) {
  return requestClient.post<AgentInfo>('/isvInfo', payload);
}

export async function updateIsvInfoApi(
  agentNo: string,
  payload: AgentInfoPayload | Record<string, unknown>,
) {
  return requestClient.put<AgentInfo>(`/isvInfo/${agentNo}`, payload);
}

export async function resetIsvLoginAuthApi(agentNo: string, state: number) {
  return requestClient.put(`/isvInfo/${agentNo}`, {
    state,
    resetPass: true,
    defaultPass: true,
    confirmPwd: '',
  });
}

export async function deleteIsvInfoApi(agentNo: string) {
  return requestClient.delete(`/isvInfo/${agentNo}`);
}

export async function changeIsvBalanceApi(
  agentNo: string,
  payload: { changeAmount: number; changeRemark: string },
) {
  return requestClient.put(`/isvBalance/${agentNo}`, payload);
}

export async function fetchAgentStatInfoApi(params: IsvListParams) {
  return requestClient.post<AgentStatInfo>(
    '/agentStatInfo/statAgentInfo',
    params,
  );
}

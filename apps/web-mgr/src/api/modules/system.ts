import type { PageResult, SysUser } from '#/api/types/business';

import { requestClient } from '#/api/request';

export interface SysUserListParams {
  pageNumber?: number;
  pageSize?: number;
  loginUsername?: string;
  sysUserId?: number | string;
  state?: number | string;
}

export interface SysRole {
  roleId: string;
  roleName: string;
}

export interface SysUserRoleRela {
  userId?: number | string;
  roleId: string;
}

export interface SysRoleEntRela {
  roleId?: string;
  entId: string;
}

export interface SysEntNode {
  entId: string;
  entName: string;
  pid?: string;
  menuIcon?: string;
  menuUri?: string;
  componentName?: string;
  entType?: string;
  menuType?: string;
  quickJump?: number;
  state?: number;
  entSort?: number | string;
  updatedAt?: string;
  children?: SysEntNode[];
}

export async function fetchSysUsersApi(params: SysUserListParams) {
  return requestClient.get<PageResult<SysUser>>('/sysUsers', { params });
}

export async function fetchSysUserApi(sysUserId: number | string) {
  return requestClient.get<SysUser>(`/sysUsers/${sysUserId}`);
}

export async function createSysUserApi(payload: {
  isAdmin: number;
  loginUsername: string;
}) {
  return requestClient.post('/sysUsers', payload);
}

export async function updateSysUserApi(
  sysUserId: number | string,
  payload: {
    defaultPass?: boolean;
    isAdmin?: number;
    resetPass?: boolean;
  },
) {
  return requestClient.put(`/sysUsers/${sysUserId}`, payload);
}

export async function updateSysUserStateApi(
  sysUserId: number | string,
  state: number,
) {
  return requestClient.put(`/sysUsers/${sysUserId}/state`, { state });
}

export async function deleteSysUserApi(sysUserId: number | string) {
  return requestClient.delete(`/sysUsers/${sysUserId}`);
}

export async function fetchSysRolesApi(
  params: {
    pageNumber?: number;
    pageSize?: number;
    roleId?: string;
    roleName?: string;
  } = {},
) {
  return requestClient.get<PageResult<SysRole>>('/sysRoles', {
    params: { pageNumber: 1, ...params },
  });
}

export async function fetchSysRoleApi(roleId: number | string) {
  return requestClient.get<SysRole>(`/sysRoles/${roleId}`);
}

export async function createSysRoleApi(payload: {
  entIdListStr: string;
  roleName: string;
}) {
  return requestClient.post('/sysRoles', payload);
}

export async function updateSysRoleApi(
  roleId: number | string,
  payload: { entIdListStr: string; roleName: string },
) {
  return requestClient.put(`/sysRoles/${roleId}`, payload);
}

export async function deleteSysRoleApi(roleId: number | string) {
  return requestClient.delete(`/sysRoles/${roleId}`);
}

export async function fetchSysUserRoleRelasApi(userId: number | string) {
  const page = await requestClient.get<PageResult<SysUserRoleRela>>(
    '/sysUserRoleRelas',
    { params: { userId, pageSize: -1 } },
  );
  return page?.records ?? [];
}

export async function saveSysUserRoleRelasApi(
  userId: number | string,
  roleIds: Array<number | string>,
) {
  const ids = roleIds.map(String);
  return requestClient.post(`/sysUserRoleRelas/relas/${userId}`, {
    roleIds: ids,
    roleIdListStr: JSON.stringify(ids),
  });
}

export async function fetchSysRoleEntRelasApi(roleId: number | string) {
  const page = await requestClient.get<PageResult<SysRoleEntRela>>(
    '/sysRoleEntRelas',
    { params: { roleId, pageSize: -1 } },
  );
  return page?.records ?? [];
}

export async function fetchSysEntTreeApi() {
  return requestClient.get<SysEntNode[]>('/sysEnts/showTree', {
    params: { sysType: 'MGR' },
  });
}

export async function fetchSysEntBySysTypeApi(entId: string, sysType = 'MGR') {
  return requestClient.get<SysEntNode>('/sysEnts/bySysType', {
    params: { entId, sysType },
  });
}

export async function updateSysEntApi(
  entId: string,
  payload: Record<string, unknown>,
) {
  return requestClient.put(`/sysEnts/${entId}`, payload);
}

export interface SysConfigItem {
  configKey: string;
  configVal?: string;
  configName?: string;
  type?: string;
  groupKey?: string;
  configDesc?: string;
}

export async function fetchSysConfigsApi(groupKey: string) {
  return requestClient.get<SysConfigItem[]>(`/sysConfigs/${groupKey}`);
}

export async function updateSysConfigsApi(
  groupKey: string,
  formData: FormData,
) {
  return requestClient.put(`/sysConfigs/${groupKey}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export interface SysLog {
  sysLogId: number;
  loginUsername?: string;
  userIp?: string;
  sysType?: string;
  methodRemark?: string;
  methodName?: string;
  reqUrl?: string;
  optReqParam?: string;
  optResInfo?: string;
  createdAt?: string;
}

export async function fetchSysLogListApi(params: Record<string, unknown>) {
  return requestClient.get<PageResult<SysLog>>('/sysLog', { params });
}

export async function fetchSysLogDetailApi(sysLogId: number | string) {
  return requestClient.get<SysLog>(`/sysLog/${sysLogId}`);
}

export async function modifyPwdApi(payload: {
  confirmPwd: string;
  originalPwd: string;
  /** demo 契约忽略；可省略 */
  recordId?: number | string;
}) {
  return requestClient.put('/current/modifyPwd', payload);
}

export async function fetchGoogleKeyApi() {
  return requestClient.get<{ key?: string; qrCode?: string }>(
    '/current/getGoogleKey',
  );
}

export async function bindGoogleApi(payload: {
  googleCode: string;
  googleKey: string;
}) {
  return requestClient.put('/current/bindGoogle', payload);
}

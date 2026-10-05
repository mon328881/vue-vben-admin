import type { PlatTenant } from '#/mock/types';

import { PLAT_ENT } from '#/constants/entitlements';
import { mockAuditLogs, mockTenants } from '#/mock/data';
import { mockCurrentUser, requirePlatEnt } from '#/mock/session';

function delay(ms = 180) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nowStamp() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function requireTenant(tenantId: string) {
  const row = mockTenants.find((item) => item.tenantId === tenantId);
  if (!row) throw new Error('租户不存在');
  return row;
}

function appendAudit(payload: {
  action: string;
  target: string;
  remark?: string;
}) {
  mockAuditLogs.unshift({
    id: `a${Date.now()}`,
    createdAt: nowStamp(),
    operator: mockCurrentUser.loginUsername,
    module: 'tenant',
    action: payload.action,
    target: payload.target,
    result: 'success',
    remark: payload.remark,
  });
}

export type { PlatTenant };

export async function fetchTenantsApi(query?: {
  keyword?: string;
  state?: number | '';
}) {
  await delay();
  const keyword = String(query?.keyword ?? '')
    .trim()
    .toLowerCase();
  const state = query?.state;
  let list = [...mockTenants];
  if (keyword) {
    list = list.filter(
      (item) =>
        item.tenantCode.toLowerCase().includes(keyword) ||
        item.tenantName.toLowerCase().includes(keyword) ||
        item.mgrDomain.toLowerCase().includes(keyword) ||
        item.mgrAdminUsername.toLowerCase().includes(keyword),
    );
  }
  if (state === 0 || state === 1) {
    list = list.filter((item) => item.state === state);
  }
  return { records: list, total: list.length };
}

export async function saveTenantApi(
  payload: Partial<PlatTenant> & {
    tenantCode: string;
    tenantName: string;
    initialPassword?: string;
  },
) {
  await delay();
  requirePlatEnt(PLAT_ENT.TENANT_EDIT);
  const now = nowStamp();
  const existing = mockTenants.find(
    (item) => item.tenantId === payload.tenantId,
  );
  if (existing) {
    Object.assign(existing, {
      tenantName: payload.tenantName,
      mgrDomain: payload.mgrDomain ?? existing.mgrDomain,
      contactName: payload.contactName ?? existing.contactName,
      contactMobile: payload.contactMobile ?? existing.contactMobile,
      state: payload.state ?? existing.state,
      remark: payload.remark,
      updatedAt: now,
    });
    return existing;
  }
  const username = String(payload.mgrAdminUsername ?? '').trim();
  const password = String(payload.initialPassword ?? '').trim();
  if (!username) throw new Error('请填写运营端主账号');
  if (password.length < 6) throw new Error('主账号初始密码至少 6 位');
  const created: PlatTenant = {
    tenantId: `t_${payload.tenantCode}`,
    tenantCode: payload.tenantCode,
    tenantName: payload.tenantName,
    mgrDomain: payload.mgrDomain ?? '',
    contactName: payload.contactName ?? '',
    contactMobile: payload.contactMobile ?? '',
    mgrAdminUsername: username,
    mgrAdminState: 1,
    mgrAdminGoogleAuth: 0,
    state: (payload.state ?? 1) as 0 | 1,
    ifCount: payload.ifCount ?? 0,
    distributedIfVersions: payload.distributedIfVersions ?? {},
    remark: payload.remark,
    createdAt: now,
    updatedAt: now,
  };
  mockTenants.unshift(created);
  appendAudit({
    action: '开户主账号',
    target: `${created.tenantName} / ${username}`,
  });
  return created;
}

export async function updateTenantStateApi(tenantId: string, state: 0 | 1) {
  await delay();
  requirePlatEnt(PLAT_ENT.TENANT_EDIT);
  const row = requireTenant(tenantId);
  row.state = state;
  row.updatedAt = nowStamp();
  return row;
}

export async function resetMgrAdminPasswordApi(
  tenantId: string,
  password: string,
) {
  await delay();
  requirePlatEnt(PLAT_ENT.TENANT_ADMIN);
  const row = requireTenant(tenantId);
  if (password.trim().length < 6) throw new Error('新密码至少 6 位');
  row.updatedAt = nowStamp();
  appendAudit({
    action: '重置主账号密码',
    target: `${row.tenantName} / ${row.mgrAdminUsername}`,
  });
  return row;
}

export async function unbindMgrAdminGoogleApi(tenantId: string) {
  await delay();
  requirePlatEnt(PLAT_ENT.TENANT_ADMIN);
  const row = requireTenant(tenantId);
  row.mgrAdminGoogleAuth = 0;
  row.updatedAt = nowStamp();
  appendAudit({
    action: '解绑主账号谷歌验证',
    target: `${row.tenantName} / ${row.mgrAdminUsername}`,
  });
  return row;
}

export async function updateMgrAdminStateApi(tenantId: string, state: 0 | 1) {
  await delay();
  requirePlatEnt(PLAT_ENT.TENANT_ADMIN);
  const row = requireTenant(tenantId);
  row.mgrAdminState = state;
  row.updatedAt = nowStamp();
  appendAudit({
    action: state === 1 ? '启用主账号' : '停用主账号',
    target: `${row.tenantName} / ${row.mgrAdminUsername}`,
  });
  return row;
}

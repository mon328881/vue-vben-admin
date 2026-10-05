import type { DistributeRecord } from '#/mock/types';

import { PLAT_ENT } from '#/constants/entitlements';
import {
  mockDistributeRecords,
  mockPayIfDefines,
  mockPlatConfig,
  mockTenants,
} from '#/mock/data';
import { mockCurrentUser, requirePlatEnt } from '#/mock/session';

function delay(ms = 220) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type { DistributeRecord };

export async function fetchDistributeRecordsApi(query?: {
  ifCode?: string;
  status?: string;
  tenantId?: string;
}) {
  await delay();
  let list = [...mockDistributeRecords];
  const code = String(query?.ifCode ?? '')
    .trim()
    .toLowerCase();
  const status = String(query?.status ?? '').trim();
  const tenantId = String(query?.tenantId ?? '').trim();
  if (code) list = list.filter((item) => item.ifCode.toLowerCase().includes(code));
  if (status) list = list.filter((item) => item.status === status);
  if (tenantId) {
    list = list.filter((item) => item.tenantIds.includes(tenantId));
  }
  return { records: list, total: list.length };
}

export async function distributePayIfApi(payload: {
  ifCode: string;
  tenantIds: string[];
}) {
  await delay(400);
  requirePlatEnt(PLAT_ENT.TENANT_DIST);
  const define = mockPayIfDefines.find((item) => item.ifCode === payload.ifCode);
  if (!define) throw new Error('支付接口不存在');
  if (!payload.tenantIds.length) throw new Error('请选择下发目标运营端');

  const tenants = mockTenants.filter((item) =>
    payload.tenantIds.includes(item.tenantId),
  );
  const inactive = tenants.filter((item) => item.state !== 1);
  const targets = mockPlatConfig.allowInactiveTenant
    ? tenants
    : tenants.filter((item) => item.state === 1);
  const skipped = mockPlatConfig.allowInactiveTenant ? [] : inactive;

  let status: DistributeRecord['status'] = 'success';
  let message = `已同步 Schema ${define.version} 至 ${targets.length} 个运营端`;
  if (targets.length === 0) {
    status = 'failed';
    message = mockPlatConfig.allowInactiveTenant
      ? '未选中运营端'
      : '所选运营端均不可用';
  } else if (skipped.length > 0) {
    status = 'partial';
    message = `${targets.length} 成功，${skipped.length} 跳过（停用）`;
  }

  for (const tenant of targets) {
    const versions = { ...(tenant.distributedIfVersions ?? {}) };
    versions[define.ifCode] = define.version;
    tenant.distributedIfVersions = versions;
    tenant.ifCount = Object.keys(versions).length;
    tenant.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
  }

  const record: DistributeRecord = {
    id: `d${Date.now()}`,
    ifCode: define.ifCode,
    ifName: define.ifName,
    version: define.version,
    tenantIds: tenants.map((item) => item.tenantId),
    tenantNames: tenants.map((item) => item.tenantName),
    status,
    operator: mockCurrentUser.loginUsername,
    message,
    createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
  };
  mockDistributeRecords.unshift(record);
  return record;
}

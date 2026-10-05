import type {
  PlatTenant,
  TenantBillingKind,
  TenantBillingRecord,
} from '#/mock/types';

import { PLAT_ENT } from '#/constants/entitlements';
import { mockAuditLogs, mockTenantBilling, mockTenants } from '#/mock/data';
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
  remark?: string;
  target: string;
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

export type { PlatTenant, TenantBillingKind, TenantBillingRecord };

export function formatTenantPlan(
  row: Pick<PlatTenant, 'monthlyFee' | 'planType' | 'ratePercent'>,
) {
  if (row.planType === 'perpetual') return '永久有效';
  if (row.planType === 'rate') {
    const percent = Number(row.ratePercent ?? 0);
    return `流水扣费（${Number(percent.toFixed(4))}%）`;
  }
  const fee = Number(row.monthlyFee ?? 0);
  const amount = Number.isInteger(fee)
    ? String(fee)
    : String(Number(fee.toFixed(2)));
  return `包月用户（${amount}）`;
}

export function formatTenantExpire(
  row: Pick<PlatTenant, 'planExpireOn' | 'planType'>,
) {
  if (row.planType === 'perpetual') return '—';
  return row.planExpireOn || '—';
}

export function formatTenantBalance(
  row: Pick<PlatTenant, 'planBalance' | 'planType'>,
) {
  if (row.planType !== 'rate') return '—';
  const n = Number(row.planBalance ?? 0);
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

export const TENANT_BILLING_KIND_LABEL: Record<TenantBillingKind, string> = {
  recharge: '充值',
  adjust: '调账',
  renew: '续期',
  'sample-debit': '模拟抽成',
};

function normalizePlan(
  payload: Partial<PlatTenant>,
): Pick<
  PlatTenant,
  | 'monthlyFee'
  | 'planBalance'
  | 'planEffectiveOn'
  | 'planExpireOn'
  | 'planType'
  | 'ratePercent'
> {
  let planType: PlatTenant['planType'] = 'monthly';
  if (payload.planType === 'rate' || payload.planType === 'perpetual') {
    planType = payload.planType;
  }
  const effective =
    String(payload.planEffectiveOn ?? '').trim() ||
    new Date().toISOString().slice(0, 10);
  if (planType === 'perpetual') {
    return {
      planType,
      monthlyFee: undefined,
      ratePercent: undefined,
      planEffectiveOn: effective,
      planExpireOn: '',
      planBalance: undefined,
    };
  }
  const expire = String(payload.planExpireOn ?? '').trim();
  if (!expire) throw new Error('请选择到期日');
  if (planType === 'rate') {
    const ratePercent = Number(payload.ratePercent);
    if (!Number.isFinite(ratePercent) || ratePercent <= 0) {
      throw new Error('请填写大于 0 的抽成比例');
    }
    const planBalance = Number(payload.planBalance ?? 0);
    if (!Number.isFinite(planBalance) || planBalance < 0) {
      throw new Error('租户余额不能为负数');
    }
    return {
      planType,
      ratePercent,
      monthlyFee: undefined,
      planEffectiveOn: effective,
      planExpireOn: expire,
      planBalance,
    };
  }
  const monthlyFee = Number(payload.monthlyFee);
  if (!Number.isFinite(monthlyFee) || monthlyFee <= 0) {
    throw new Error('请填写大于 0 的月费金额');
  }
  return {
    planType,
    monthlyFee,
    ratePercent: undefined,
    planEffectiveOn: effective,
    planExpireOn: expire,
    planBalance: undefined,
  };
}

export async function fetchTenantsApi(query?: {
  keyword?: string;
  state?: '' | number;
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
    initialPassword?: string;
    tenantCode: string;
    tenantName: string;
  },
) {
  await delay();
  requirePlatEnt(PLAT_ENT.TENANT_EDIT);
  const now = nowStamp();
  const existing = mockTenants.find(
    (item) => item.tenantId === payload.tenantId,
  );
  const plan = normalizePlan({
    ...payload,
    planBalance:
      payload.planType === 'rate' &&
      payload.planBalance === undefined &&
      existing?.planType === 'rate'
        ? existing.planBalance
        : payload.planBalance,
  });
  if (existing) {
    const prevPlan = formatTenantPlan(existing);
    const prevExpire = existing.planExpireOn;
    Object.assign(existing, {
      tenantName: payload.tenantName,
      mgrDomain: payload.mgrDomain ?? existing.mgrDomain,
      contactName: payload.contactName ?? existing.contactName,
      contactMobile: payload.contactMobile ?? existing.contactMobile,
      state: payload.state ?? existing.state,
      remark: payload.remark,
      ...plan,
      updatedAt: now,
    });
    const nextPlan = formatTenantPlan(existing);
    if (prevPlan !== nextPlan) {
      appendAudit({
        action: '调整套餐',
        target: existing.tenantName,
        remark: `${prevPlan} → ${nextPlan}`,
      });
    }
    if (
      existing.planType !== 'perpetual' &&
      prevExpire !== existing.planExpireOn
    ) {
      mockTenantBilling.unshift({
        id: `b${Date.now()}`,
        tenantId: existing.tenantId,
        createdAt: now,
        kind: 'renew',
        amount: 0,
        expireOn: existing.planExpireOn,
        operator: mockCurrentUser.loginUsername,
        remark: `到期日 ${prevExpire} → ${existing.planExpireOn}`,
      });
      appendAudit({
        action: '续期',
        target: existing.tenantName,
        remark: `${prevExpire} → ${existing.planExpireOn}`,
      });
    }
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
    ...plan,
    createdAt: now,
    updatedAt: now,
  };
  mockTenants.unshift(created);
  let openRemark = `开户，到期 ${created.planExpireOn}`;
  if (created.planType === 'rate') openRemark = '开户充值';
  else if (created.planType === 'perpetual') openRemark = '开户，永久有效';
  mockTenantBilling.unshift({
    id: `b${Date.now()}`,
    tenantId: created.tenantId,
    createdAt: now,
    kind: created.planType === 'rate' ? 'recharge' : 'renew',
    amount: created.planType === 'rate' ? Number(created.planBalance ?? 0) : 0,
    beforeBalance: created.planType === 'rate' ? 0 : undefined,
    afterBalance: created.planType === 'rate' ? created.planBalance : undefined,
    expireOn: created.planExpireOn || undefined,
    operator: mockCurrentUser.loginUsername,
    remark: openRemark,
  });
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

export async function fetchTenantBillingApi(tenantId: string) {
  await delay();
  requirePlatEnt(PLAT_ENT.TENANT_VIEW);
  requireTenant(tenantId);
  const records = mockTenantBilling
    .filter((item) => item.tenantId === tenantId)
    .toSorted((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return { records, total: records.length };
}

export async function adjustTenantBalanceApi(payload: {
  amount: number;
  kind: Extract<TenantBillingKind, 'adjust' | 'recharge'>;
  remark?: string;
  tenantId: string;
}) {
  await delay();
  requirePlatEnt(PLAT_ENT.TENANT_EDIT);
  const row = requireTenant(payload.tenantId);
  if (row.planType !== 'rate') {
    throw new Error('仅流水扣费租户可调整余额');
  }
  const delta = Number(payload.amount);
  if (!Number.isFinite(delta) || delta === 0) {
    throw new Error('请填写非 0 金额');
  }
  if (payload.kind === 'recharge' && delta < 0) {
    throw new Error('充值金额须大于 0');
  }
  const before = Number(row.planBalance ?? 0);
  const after = Number((before + delta).toFixed(2));
  if (after < 0) throw new Error('余额不足');
  const now = nowStamp();
  row.planBalance = after;
  row.updatedAt = now;
  mockTenantBilling.unshift({
    id: `b${Date.now()}`,
    tenantId: row.tenantId,
    createdAt: now,
    kind: payload.kind,
    amount: delta,
    beforeBalance: before,
    afterBalance: after,
    operator: mockCurrentUser.loginUsername,
    remark: payload.remark,
  });
  appendAudit({
    action: payload.kind === 'recharge' ? '充值' : '调账',
    target: row.tenantName,
    remark: `${before} → ${after}`,
  });
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

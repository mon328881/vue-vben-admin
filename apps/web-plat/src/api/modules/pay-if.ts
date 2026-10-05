import type { IfParamField, PlatPayIfDefine } from '#/mock/types';

import { PLAT_ENT } from '#/constants/entitlements';
import { mockPayIfDefines } from '#/mock/data';
import { requirePlatEnt } from '#/mock/session';

function delay(ms = 180) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type { IfParamField, PlatPayIfDefine };

export async function fetchPayIfDefinesApi(query?: {
  ifCode?: string;
  ifName?: string;
}) {
  await delay();
  const code = String(query?.ifCode ?? '')
    .trim()
    .toLowerCase();
  const name = String(query?.ifName ?? '')
    .trim()
    .toLowerCase();
  let list = [...mockPayIfDefines];
  if (code) list = list.filter((item) => item.ifCode.toLowerCase().includes(code));
  if (name) list = list.filter((item) => item.ifName.toLowerCase().includes(name));
  return { records: list, total: list.length };
}

export async function fetchPayIfDefineApi(ifCode: string) {
  await delay();
  const row = mockPayIfDefines.find((item) => item.ifCode === ifCode);
  if (!row) throw new Error('支付接口不存在');
  return structuredClone(row);
}

export async function savePayIfDefineApi(payload: {
  ifCode: string;
  ifName: string;
  ifParams: IfParamField[];
  bgColor?: string;
  remark?: string;
  state?: 0 | 1;
  creating?: boolean;
}) {
  await delay();
  requirePlatEnt(PLAT_ENT.IF_EDIT);
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const existing = mockPayIfDefines.find((item) => item.ifCode === payload.ifCode);
  if (payload.creating && existing) {
    throw new Error('接口代码已存在');
  }
  if (existing) {
    const [major, minor, patch] = existing.version.split('.').map(Number);
    existing.ifName = payload.ifName;
    existing.ifParams = payload.ifParams;
    existing.bgColor = payload.bgColor || existing.bgColor;
    existing.remark = payload.remark;
    existing.state = payload.state ?? existing.state;
    existing.version = `${major}.${minor}.${(patch ?? 0) + 1}`;
    existing.updatedAt = now;
    return structuredClone(existing);
  }
  const created: PlatPayIfDefine = {
    ifCode: payload.ifCode,
    ifName: payload.ifName,
    ifParams: payload.ifParams,
    bgColor: payload.bgColor || '#1677FF',
    remark: payload.remark,
    state: payload.state ?? 1,
    version: '1.0.0',
    createdAt: now,
    updatedAt: now,
  };
  mockPayIfDefines.unshift(created);
  return structuredClone(created);
}

export async function deletePayIfDefineApi(ifCode: string) {
  await delay();
  requirePlatEnt(PLAT_ENT.IF_EDIT);
  const idx = mockPayIfDefines.findIndex((item) => item.ifCode === ifCode);
  if (idx < 0) throw new Error('支付接口不存在');
  mockPayIfDefines.splice(idx, 1);
  return true;
}

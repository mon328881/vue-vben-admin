import type { PlatConfig } from '#/mock/types';

import { mockAuditLogs, mockPlatConfig } from '#/mock/data';
import { mockCurrentUser, requirePlatAdmin } from '#/mock/session';

function delay(ms = 160) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type { PlatConfig };

export async function fetchPlatConfigApi() {
  await delay();
  requirePlatAdmin();
  return { ...mockPlatConfig };
}

export async function savePlatConfigApi(payload: PlatConfig) {
  await delay();
  requirePlatAdmin();
  const name = String(payload.platformName ?? '').trim();
  if (!name) throw new Error('请填写平台名称');
  mockPlatConfig.platformName = name;
  mockPlatConfig.allowInactiveTenant = !!payload.allowInactiveTenant;
  mockAuditLogs.unshift({
    id: `a${Date.now()}`,
    createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
    operator: mockCurrentUser.loginUsername,
    module: 'config',
    action: '更新平台配置',
    target: name,
    result: 'success',
    remark: mockPlatConfig.allowInactiveTenant
      ? '停用租户仍可下发'
      : '停用租户跳过下发',
  });
  return { ...mockPlatConfig };
}

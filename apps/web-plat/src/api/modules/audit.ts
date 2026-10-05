import type { PlatAuditLog, PlatAuditModule } from '#/mock/types';

import { mockAuditLogs } from '#/mock/data';

function delay(ms = 160) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type { PlatAuditLog, PlatAuditModule };

export async function fetchPlatAuditLogsApi(query?: {
  keyword?: string;
  module?: PlatAuditModule | '';
}) {
  await delay();
  const keyword = String(query?.keyword ?? '')
    .trim()
    .toLowerCase();
  const module = query?.module;
  let list = [...mockAuditLogs];
  if (module) {
    list = list.filter((item) => item.module === module);
  }
  if (keyword) {
    list = list.filter(
      (item) =>
        item.operator.toLowerCase().includes(keyword) ||
        item.action.toLowerCase().includes(keyword) ||
        item.target.toLowerCase().includes(keyword),
    );
  }
  return { records: list, total: list.length };
}

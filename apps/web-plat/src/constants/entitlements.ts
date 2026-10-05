/** 超管端 Mock 权限码。超管（isAdmin=1）视为全部拥有，不依赖勾选。 */

export const PLAT_ENT = {
  TENANT_VIEW: 'ENT_PLAT_TENANT_VIEW',
  TENANT_EDIT: 'ENT_PLAT_TENANT_EDIT',
  TENANT_ADMIN: 'ENT_PLAT_TENANT_ADMIN',
  TENANT_DIST: 'ENT_PLAT_TENANT_DIST',
  DIST_LOG: 'ENT_PLAT_DIST_LOG',
  IF_VIEW: 'ENT_PLAT_IF_VIEW',
  IF_EDIT: 'ENT_PLAT_IF_EDIT',
  AUDIT: 'ENT_PLAT_AUDIT',
} as const;

export type PlatEntId = (typeof PLAT_ENT)[keyof typeof PLAT_ENT];

export const ALL_PLAT_ENTS: PlatEntId[] = Object.values(PLAT_ENT);

/** 新建非超管账号的默认权限：业务只读 */
export const DEFAULT_OPERATOR_ENTS: PlatEntId[] = [
  PLAT_ENT.TENANT_VIEW,
  PLAT_ENT.DIST_LOG,
  PLAT_ENT.IF_VIEW,
  PLAT_ENT.AUDIT,
];

export const PLAT_ENT_GROUPS: {
  title: string;
  items: { code: PlatEntId; label: string; dependsOn?: PlatEntId }[];
}[] = [
  {
    title: '运营租户',
    items: [
      { code: PLAT_ENT.TENANT_VIEW, label: '查看' },
      {
        code: PLAT_ENT.TENANT_EDIT,
        label: '编辑（新建 / 修改 / 启停）',
        dependsOn: PLAT_ENT.TENANT_VIEW,
      },
      {
        code: PLAT_ENT.TENANT_ADMIN,
        label: '主账号（重置密码 / 谷歌 / 状态）',
        dependsOn: PLAT_ENT.TENANT_VIEW,
      },
      {
        code: PLAT_ENT.TENANT_DIST,
        label: '接口下发',
        dependsOn: PLAT_ENT.TENANT_VIEW,
      },
      {
        code: PLAT_ENT.DIST_LOG,
        label: '下发记录',
        dependsOn: PLAT_ENT.TENANT_VIEW,
      },
    ],
  },
  {
    title: '接口定义',
    items: [
      { code: PLAT_ENT.IF_VIEW, label: '查看' },
      {
        code: PLAT_ENT.IF_EDIT,
        label: '编辑（新建 / Schema / 删除）',
        dependsOn: PLAT_ENT.IF_VIEW,
      },
    ],
  },
  {
    title: '系统',
    items: [{ code: PLAT_ENT.AUDIT, label: '操作日志' }],
  },
];

export function platRolesOf(user: {
  isAdmin: number;
  entIdList?: string[];
}): string[] {
  if (user.isAdmin === 1) {
    return ['super', 'admin', 'user'];
  }
  const roles = new Set(['user']);
  const ents = user.entIdList ?? [];
  if (ents.includes(PLAT_ENT.TENANT_VIEW)) roles.add('plat-tenant');
  if (ents.includes(PLAT_ENT.IF_VIEW)) roles.add('plat-if');
  if (ents.includes(PLAT_ENT.AUDIT)) roles.add('plat-audit');
  return [...roles];
}

export function summarizePlatEnts(
  user: { isAdmin: number; entIdList?: string[] },
): string {
  if (user.isAdmin === 1) return '全部权限';
  const ents = user.entIdList ?? [];
  if (ents.length === 0) return '无';
  const labels: string[] = [];
  for (const group of PLAT_ENT_GROUPS) {
    for (const item of group.items) {
      if (ents.includes(item.code)) labels.push(item.label.split('（')[0]!);
    }
  }
  return labels.join('、') || '无';
}

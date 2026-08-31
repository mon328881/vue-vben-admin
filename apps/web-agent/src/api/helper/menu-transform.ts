import type { RouteRecordStringComponent } from '@vben/types';

import type { MenuNode } from '#/api/types';

/** 业务页尚未迁移时的占位组件 */
const PLACEHOLDER_COMPONENT = '/_core/fallback/coming-soon';

/** 已知 menuUri → 视图路径 */
const VIEW_MAP: Record<string, string> = {
  '/main': '/dashboard/main/index',
  '/mchs': '/merchant/index',
  '/apps': '/apps/index',
  '/history': '/history/index',
  '/mchPrepaidHistory': '/prepaid/index',
  '/payOrder': '/order/pay/index',
  '/passagePayOrder': '/passage-order/index',
  '/division': '/division/index',
  '/divisionAgent': '/division/index',
  '/dayStat': '/stats/day-stat/index',
  '/current/userinfo': '/system/userinfo/index',
};

/** ant-design menuIcon → Iconify */
const ICON_MAP: Record<string, string> = {
  home: 'ant-design:home-outlined',
  shop: 'ant-design:shop-outlined',
  block: 'ant-design:appstore-outlined',
  transaction: 'ant-design:swap-outlined',
  'file-done': 'ant-design:file-done-outlined',
  form: 'ant-design:form-outlined',
  'ordered-list': 'ant-design:ordered-list-outlined',
  apartment: 'ant-design:apartment-outlined',
  setting: 'ant-design:setting-outlined',
  profile: 'ant-design:user-outlined',
  'account-book': 'ant-design:account-book-outlined',
  wallet: 'ant-design:wallet-outlined',
  'question-circle': 'ant-design:question-circle-outlined',
  notification: 'ant-design:notification-outlined',
  appstore: 'ant-design:appstore-outlined',
  interaction: 'ant-design:api-outlined',
  'red-envelope': 'ant-design:red-envelope-outlined',
  'align-left': 'ant-design:bar-chart-outlined',
  team: 'ant-design:team-outlined',
  'carry-out': 'ant-design:carry-out-outlined',
  contacts: 'ant-design:contacts-outlined',
  user: 'ant-design:user-outlined',
  'file-text': 'ant-design:file-text-outlined',
  robot: 'ant-design:robot-outlined',
  container: 'ant-design:container-outlined',
  'area-chart': 'ant-design:area-chart-outlined',
};

function onlyMl(nodes: MenuNode[] | undefined): MenuNode[] {
  return [...(nodes ?? [])]
    .filter((n) => n.entType === 'ML')
    .sort((a, b) => (a.entSort ?? 0) - (b.entSort ?? 0));
}

function normalizeUri(uri: string): string {
  if (!uri) return '';
  const withSlash = uri.startsWith('/') ? uri : `/${uri}`;
  return withSlash.replace(/\/+$/, '') || '/';
}

function mapIcon(raw?: string): string | undefined {
  if (!raw || raw === 'no-icon') return undefined;
  return ICON_MAP[raw] || `ant-design:${raw}-outlined`;
}

function resolveComponent(uri: string): string {
  return VIEW_MAP[uri] || PLACEHOLDER_COMPONENT;
}

/**
 * 将 mgr-api allMenuRouteTree（仅 ML）转为 Vben 后端路由结构。
 * 目录节点无 component；叶子用 menuUri，未迁移页面走 coming-soon。
 */
export function transformMenuTree(
  nodes: MenuNode[],
): RouteRecordStringComponent[] {
  return transformLevel(onlyMl(nodes), 0);
}

function transformLevel(
  nodes: MenuNode[],
  level: number,
): RouteRecordStringComponent[] {
  const result: RouteRecordStringComponent[] = [];

  for (const node of nodes) {
    const children = transformLevel(onlyMl(node.children), level + 1);
    const icon = mapIcon(node.menuIcon);

    if (children.length > 0) {
      result.push({
        name: node.entId,
        path: `/${node.entId}`,
        component: '',
        meta: {
          icon,
          order: node.entSort,
          title: node.entName,
        },
        children,
      });
      continue;
    }

    const uri = normalizeUri((node.menuUri || '').trim());
    if (!uri) continue;

    result.push({
      name: node.entId || uri.replaceAll('/', '_'),
      path: uri,
      component: resolveComponent(uri),
      meta: {
        icon,
        order: node.entSort,
        title: node.entName,
      },
    });
  }

  return result;
}

/** 确保有主页路由（后端菜单可能不含 /main） */
export function ensureHomeRoute(
  routes: RouteRecordStringComponent[],
): RouteRecordStringComponent[] {
  const hasMain = routes.some(
    (r) =>
      r.path === '/main' ||
      r.children?.some((c) => c.path === '/main' || c.path === 'main'),
  );
  if (hasMain) return routes;

  return [
    {
      name: 'Main',
      path: '/main',
      component: '/dashboard/main/index',
      meta: {
        affixTab: true,
        icon: 'ant-design:home-outlined',
        order: -1,
        title: '主页',
      },
    },
    ...routes,
  ];
}

import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      hideChildrenInMenu: true,
      icon: 'lucide:building',
      order: 10,
      title: '运营租户',
      authority: ['super', 'plat-tenant'],
    },
    name: 'TenantRoot',
    path: '/tenant',
    redirect: '/tenant/list',
    children: [
      {
        name: 'TenantList',
        path: '/tenant/list',
        component: () => import('#/views/tenant/list/index.vue'),
        meta: {
          affixTab: false,
          icon: 'lucide:building',
          title: '运营租户',
          authority: ['super', 'plat-tenant'],
        },
      },
    ],
  },
];

export default routes;

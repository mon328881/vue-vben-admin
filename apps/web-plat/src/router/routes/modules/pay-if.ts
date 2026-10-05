import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      hideChildrenInMenu: true,
      icon: 'lucide:waypoints',
      order: 20,
      title: '接口定义',
      authority: ['super', 'plat-if'],
    },
    name: 'PayIfRoot',
    path: '/pay-if',
    redirect: '/pay-if/list',
    children: [
      {
        name: 'PayIfList',
        path: '/pay-if/list',
        component: () => import('#/views/pay-if/list/index.vue'),
        meta: {
          affixTab: false,
          icon: 'lucide:waypoints',
          title: '接口定义',
          authority: ['super', 'plat-if'],
        },
      },
      {
        name: 'PayIfDistribute',
        path: '/pay-if/distribute',
        component: () => import('#/views/pay-if/distribute/index.vue'),
        meta: {
          hideInMenu: true,
          icon: 'lucide:share-2',
          title: '接口下发',
          authority: ['super', 'plat-tenant'],
        },
      },
      {
        name: 'PayIfDistributeLog',
        path: '/pay-if/distribute-log',
        component: () => import('#/views/pay-if/distribute-log/index.vue'),
        meta: {
          hideInMenu: true,
          icon: 'lucide:scroll-text',
          title: '下发记录',
          authority: ['super', 'plat-tenant'],
        },
      },
    ],
  },
];

export default routes;

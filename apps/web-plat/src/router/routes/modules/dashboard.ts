import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      hideChildrenInMenu: true,
      icon: 'lucide:home',
      order: -1,
      title: '首页',
    },
    name: 'Dashboard',
    path: '/dashboard',
    redirect: '/main',
    children: [
      {
        name: 'Main',
        path: '/main',
        component: () => import('#/views/dashboard/main/index.vue'),
        meta: {
          affixTab: true,
          icon: 'lucide:home',
          title: '首页',
        },
      },
    ],
  },
];

export default routes;

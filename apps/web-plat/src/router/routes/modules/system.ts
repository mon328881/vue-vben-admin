import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:settings-2',
      order: 90,
      title: '系统',
      authority: ['super', 'plat-audit'],
    },
    name: 'SystemRoot',
    path: '/system',
    children: [
      {
        name: 'PlatUsers',
        path: '/system/users',
        component: () => import('#/views/system/users/index.vue'),
        meta: {
          icon: 'lucide:users',
          title: '管理账号',
          authority: ['super'],
        },
      },
      {
        name: 'PlatAuditLog',
        path: '/system/audit-log',
        component: () => import('#/views/system/audit-log/index.vue'),
        meta: {
          icon: 'lucide:file-clock',
          title: '操作日志',
          authority: ['super', 'plat-audit'],
        },
      },
      {
        name: 'PlatConfig',
        path: '/system/config',
        component: () => import('#/views/system/config/index.vue'),
        meta: {
          icon: 'lucide:sliders-horizontal',
          title: '平台配置',
          authority: ['super'],
        },
      },
    ],
  },
];

export default routes;

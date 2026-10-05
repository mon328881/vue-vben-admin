import {
  appCopyrightPreferences,
  defineOverridesPreferences,
} from '@vben/preferences';

/**
 * @description 超管端项目配置
 * 当前阶段 accessMode=frontend：菜单来自本地路由模块，不依赖后端。
 */
export const overridesPreferences = defineOverridesPreferences({
  app: {
    accessMode: 'frontend',
    defaultHomePath: '/main',
    enableRefreshToken: false,
    name: import.meta.env.VITE_APP_TITLE,
  },
  copyright: {
    ...appCopyrightPreferences,
    companyName: 'AsiaPay',
    date: '2026',
  },
  widget: {
    logoutButtonPosition: 'user-dropdown',
    notification: false,
  },
});

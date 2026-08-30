import type { RouteRecordStringComponent } from '@vben/types';

import { fetchCurrentUserApi } from './user';
import {
  ensureHomeRoute,
  transformMenuTree,
} from '#/api/helper/menu-transform';

/**
 * 从 /current/user 的 allMenuRouteTree 生成 Vben 菜单路由
 */
export async function getAllMenusApi(): Promise<RouteRecordStringComponent[]> {
  const user = await fetchCurrentUserApi();
  return ensureHomeRoute(transformMenuTree(user.allMenuRouteTree ?? []));
}

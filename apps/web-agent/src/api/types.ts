/** AsiaPay mgr-api 当前用户 / 菜单节点（对齐 mgr-web） */

export interface MenuNode {
  entId: string;
  entName: string;
  sysType: string;
  entType: string;
  menuUri?: string;
  menuIcon?: string;
  componentName?: string;
  pid: string;
  entSort: number;
  quickJump: number;
  state: number;
  createdAt?: string;
  updatedAt?: string;
  children?: MenuNode[];
}

export interface CurrentUser {
  sysUserId: number;
  loginUsername: string;
  sysType: string;
  isAdmin: number;
  belongInfoId: string;
  state: number;
  googleAuth?: number;
  entIdList: string[];
  allMenuRouteTree: MenuNode[];
}

export interface VercodeResult {
  vercodeToken: string;
  imageBase64Data: string;
  expireTime: number;
}

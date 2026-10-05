export type TenantStatus = 0 | 1;

export interface PlatTenant {
  tenantId: string;
  tenantCode: string;
  tenantName: string;
  mgrDomain: string;
  contactName: string;
  contactMobile: string;
  /** 该租户运营端主账号（开户/救场，不是日常操作员） */
  mgrAdminUsername: string;
  mgrAdminState: TenantStatus;
  mgrAdminGoogleAuth: 0 | 1;
  state: TenantStatus;
  ifCount: number;
  /** 已成功下发到该运营端的接口 → 当时 Schema 版本 */
  distributedIfVersions: Record<string, string>;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IfParamField {
  name: string;
  desc: string;
  type: 'text' | 'textarea' | 'password' | 'number' | 'radio' | 'select' | 'file';
  verify?: 'required' | '';
  star?: '0' | '1';
  /** radio / select：逗号分隔取值 */
  values?: string;
  /** radio / select：逗号分隔标题 */
  titles?: string;
}

export type PayIfState = 0 | 1;

export interface PlatPayIfDefine {
  ifCode: string;
  ifName: string;
  ifParams: IfParamField[];
  bgColor: string;
  remark?: string;
  state: PayIfState;
  version: string;
  updatedAt: string;
  createdAt: string;
}

export type DistributeStatus = 'pending' | 'success' | 'partial' | 'failed';

export interface DistributeRecord {
  id: string;
  ifCode: string;
  ifName: string;
  version: string;
  tenantIds: string[];
  tenantNames: string[];
  status: DistributeStatus;
  operator: string;
  message?: string;
  createdAt: string;
}

export interface PlatUser {
  userId: string;
  loginUsername: string;
  realname: string;
  state: 0 | 1;
  isAdmin: 0 | 1;
  googleAuth: 0 | 1;
  /** Telegram 账号，展示为飞机号 */
  telegram?: string;
  /** Mock 登录口令，不进列表 */
  password?: string;
  /** 非超管勾选的权限码；超管忽略此字段 */
  entIdList: string[];
  createdAt: string;
}

export type PlatAuditModule =
  | 'tenant'
  | 'pay-if'
  | 'distribute'
  | 'plat-user'
  | 'config';

export interface PlatAuditLog {
  id: string;
  createdAt: string;
  operator: string;
  module: PlatAuditModule;
  action: string;
  target: string;
  result: 'success' | 'failed';
  remark?: string;
}

export interface PlatConfig {
  platformName: string;
  /** 停用运营端是否仍允许 Schema 下发 */
  allowInactiveTenant: boolean;
}

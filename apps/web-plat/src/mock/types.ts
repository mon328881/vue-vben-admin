export type TenantStatus = 0 | 1;

/**
 * 对应运营端 tenant.type / 主页 querySystemInfo：
 * 1 包月用户（只展示到期）· 2 流水扣费（余额+到期）· 其它 永久有效（都不展示）
 */
export type TenantPlanType = 'monthly' | 'perpetual' | 'rate';

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
  planType: TenantPlanType;
  /** type=1 包月用户：每月定额（元） */
  monthlyFee?: number;
  /** type=2 流水扣费：成功流水百分比，0.3 表示 0.30% */
  ratePercent?: number;
  /** 套餐生效日 YYYY-MM-DD */
  planEffectiveOn: string;
  /** type=1/2 到期日，对应运营端主页 expireDate；永久有效为空 */
  planExpireOn?: string;
  /** type=2 租户余额（元），对应运营端主页「当前余额」 */
  planBalance?: number;
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
  type:
    | 'file'
    | 'number'
    | 'password'
    | 'radio'
    | 'select'
    | 'text'
    | 'textarea';
  verify?: '' | 'required';
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

export type DistributeStatus = 'failed' | 'partial' | 'pending' | 'success';

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

export type TenantBillingKind =
  | 'adjust'
  | 'recharge'
  | 'renew'
  | 'sample-debit';

export interface TenantBillingRecord {
  id: string;
  tenantId: string;
  createdAt: string;
  kind: TenantBillingKind;
  /** 变动金额（元），正为增加、负为扣减 */
  amount: number;
  beforeBalance?: number;
  afterBalance?: number;
  expireOn?: string;
  operator: string;
  remark?: string;
}

export type PlatAuditModule =
  | 'config'
  | 'distribute'
  | 'pay-if'
  | 'plat-user'
  | 'tenant';

export interface PlatAuditLog {
  id: string;
  createdAt: string;
  operator: string;
  module: PlatAuditModule;
  action: string;
  target: string;
  result: 'failed' | 'success';
  remark?: string;
}

export interface PlatConfig {
  platformName: string;
  /** 停用运营端是否仍允许 Schema 下发 */
  allowInactiveTenant: boolean;
}

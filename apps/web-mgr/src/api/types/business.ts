export interface PageResult<T> {
  records: T[];
  total: number;
  current?: number;
  hasNext?: boolean;
}

export interface MchInfo {
  mchNo: string;
  mchName: string;
  loginUserName?: string;
  agentNo?: string;
  agentName?: string;
  mchGroup?: string;
  orderCountLimit?: number;
  state: number;
  secret?: string;
  remark?: string;
  canPush?: number;
  canNotify?: number;
  canRateNotify?: number;
  cashierState?: number;
  loginWhiteList?: string;
  prepaid?: number;
  balance?: number;
  freezeBalance?: number;
  diff?: number;
  successAmount?: number | null;
  successRate?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface MchProductInfo {
  productId: number;
  productName: string;
  state: number;
  mchRate?: number;
  agentRate?: number;
}

export interface MchPassageInfo {
  payPassageId: number;
  payPassageName: string;
  passageAgentNo?: string;
  passageAgentName?: string;
  productId?: number;
  productName?: string;
  state: number;
  productRate?: number;
  rate?: number;
}

export interface MchStatInfo {
  mchNum?: number;
  prepaid?: number;
  totalBalance?: number;
  freezeBalance?: number;
}

export interface MchPrepaidHistory {
  mchPrepaidHistoryId?: number | string;
  mchNo?: string;
  mchName?: string;
  beforeBalance?: number;
  amount?: number;
  afterBalance?: number;
  createdAt?: string;
  createdUid?: number | string;
  createdLoginName?: string;
  pic?: string;
  remark?: string;
  fundDirection?: number | string;
}

export interface AgentInfo {
  agentNo: string;
  agentName: string;
  loginUserName?: string;
  state: number;
  remark?: string;
  balance?: number;
  freezeBalance?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PayOrder {
  payOrderId: string;
  mchNo: string;
  mchName?: string;
  mchOrderNo: string;
  passageOrderNo?: string;
  agentNo?: string;
  productId?: number;
  productName?: string;
  icon?: string;
  passageId?: number;
  passageName?: string;
  passageGroupName?: string;
  amount: number;
  mchFeeRate?: number;
  mchFeeAmount?: number;
  passageRate?: number;
  passageFeeAmount?: number;
  mchIncome?: number;
  state: number;
  notifyState?: number;
  forceChangeState?: number;
  forceChangeBeforeState?: number;
  forceChangeLoginName?: string;
  createdAt?: string;
  updatedAt?: string;
  successTime?: string;
}

export interface PayRealTimeStat {
  totalCount?: number;
  successCount?: number;
  totalAmount?: number;
  successAmount?: number;
  totalIncome?: number;
  totalMchIncome?: number;
}

export interface DayCount {
  orderSuccessCount?: number;
  platTotalIncome?: number;
  totalAmount?: number;
  totalOrderCount?: number;
  totalSuccessAmount?: number;
}

export interface TwoDayCount {
  todayCount?: DayCount;
  yesterdayCount?: DayCount;
  mchNum?: number;
  agentNum?: number;
  todaySuccessRate?: number;
  yesterdaySuccessRate?: number;
}

export interface SysUser {
  sysUserId: number;
  loginUsername: string;
  isAdmin?: number;
  state?: number;
  sysType?: string;
  belongInfoId?: string;
  createdAt?: string;
}

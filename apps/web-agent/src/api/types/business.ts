export interface PageResult<T> {
  records: T[];
  total: number;
}

export interface AgentInfo {
  agentNo: string;
  agentName: string;
  loginUserName: string;
  balance: number;
  freezeBalance: number;
  state: number;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
  mchCount: number;
  passageCount: number;
}

export interface MchStat {
  statisticsAgentMchId?: number;
  statisticsDate?: string;
  agentNo?: string;
  mchNo?: string;
  totalAmount: number;
  totalSuccessAmount: number;
  totalAgentIncome: number;
  totalOrderCount: number;
  orderSuccessCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface MchAgentRow {
  mchNo: string;
  mchName: string;
  agentNo?: string;
  balance: number;
  freezeBalance?: number;
  state: number;
  stat: MchStat;
}

export interface MchProductRate {
  productId: number;
  productName?: string;
  icon?: string;
  mchRate?: number;
  agentRate?: number;
  state?: number;
}

export interface PassageRow {
  payPassageId: number;
  payPassageName: string;
  productId: number;
  productName: string;
  icon?: string;
  ifCode: string;
  wayCode: string;
  passageGroupName?: string;
  agentRate?: number;
  state: number;
  createdAt?: string;
}

export interface PassageInfoRow {
  payPassageId: number;
  payPassageName: string;
  productId: number;
  totalOrderCount: number;
  orderSuccessCount: number;
  successRate: number;
  todayAmount: number;
  agentIncome: number;
}

export interface AgentHistory {
  id: number;
  agentAccountHistoryId: number;
  agentNo: string;
  agentName: string;
  beforeBalance: number;
  amount: number;
  afterBalance: number;
  payOrderId?: string;
  payOrderAmount?: number | null;
  bizType: number;
  fundDirection: number;
  createdLoginName?: string;
  remark?: string;
  createdAt: string;
}

export interface PrepaidHistory {
  id: number;
  mchNo: string;
  mchName?: string;
  beforeBalance: number;
  amount: number;
  afterBalance: number;
  fundDirection: number;
  operator?: string;
  createdLoginName?: string;
  remark?: string;
  pic?: string;
  createdAt: string;
}

export interface PayOrder {
  payOrderId: string;
  mchNo: string;
  mchName: string;
  mchOrderNo: string;
  passageOrderNo?: string;
  agentNo?: string;
  productId: number;
  productName?: string;
  icon?: string;
  passageId?: number;
  passageName?: string;
  amount: number;
  mchFeeRate?: number;
  mchFeeAmount?: number;
  agentRate?: number;
  agentFeeAmount?: number;
  agentPassageRate?: number;
  agentPassageFee?: number;
  state: number;
  notifyState: number;
  forceChangeState: number;
  forceChangeBeforeState?: number;
  forceChangeLoginName?: string;
  notifyUrl?: string;
  clientIp?: string;
  remark?: string;
  createdAt: string;
  updatedAt?: string;
  expiredTime?: string;
  successTime?: string;
}

export interface DivisionRecord {
  id: number;
  recordId: string;
  userNo: string;
  userName: string;
  createdAt: string;
  expiredTime?: string;
  amount: number;
  divisionAmount: number;
  divisionAmountFee: number;
  state: number;
  remark?: string;
}

export interface AgentDayStat {
  statisticsAgentId: number;
  statisticsDate: string;
  createdAt: string;
  agentNo: string;
  agentName: string;
  totalAmount: number;
  totalSuccessAmount: number;
  totalAgentIncome: number;
  totalOrderCount: number;
  orderSuccessCount: number;
}

export interface ProductShort {
  productId: number;
  productName: string;
  icon?: string;
}

export interface DivisionConfig {
  agentFee: number;
  agentFeeRate: number;
  agentMinWithdraw: number;
  agentVisible?: number;
}

export interface DivisionInfo {
  agentNo: string;
  agentName: string;
  balance: number;
  freezeBalance: number;
  state: number;
}

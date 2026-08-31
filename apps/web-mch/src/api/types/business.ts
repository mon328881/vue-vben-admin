export interface PayOrder {
  payOrderId: string;
  mchNo: string;
  mchName: string;
  mchOrderNo: string;
  passageOrderNo?: string;
  ifCode?: string;
  wayCode?: string;
  productId: number;
  productName: string;
  icon?: string;
  passageName?: string;
  passageGroupName?: string;
  amount: number;
  mchFeeRate: number;
  mchFeeAmount: number;
  mchIncome: number;
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

export interface PayOrderQuery {
  pageNumber: number;
  pageSize: number;
  payOrderId?: string;
  mchOrderNo?: string;
  productId?: number;
  state?: number;
  notifyState?: number;
  forceChangeState?: number;
  createdStart?: string;
  createdEnd?: string;
  successTimeStart?: string;
  successTimeEnd?: string;
}

export interface ProductShort {
  productId: number;
  productName: string;
  icon?: string;
  mchRate?: number;
  state?: number;
}

export interface MchInfoDetail {
  mchNo: string;
  mchName: string;
  balance: number;
  prepaid: number;
  freezeBalance: number;
  state: number;
  secret: string;
  cashierState?: number;
  contactName?: string;
  contactTel?: string;
  createdAt?: string;
  loginUsername?: string;
}

export interface MchInfoResult {
  mchInfo: MchInfoDetail;
  products: Array<{
    productId: number;
    productName: string;
    mchRate: number;
    state: number;
    mchNo?: string;
  }>;
}

export interface DayCount {
  statisticsDate: string | null;
  totalSuccessAmount: number;
  totalMchCost: number;
  totalOrderCount: number;
  orderSuccessCount: number;
}

export interface TwoDayCountResult {
  todayCount: DayCount;
  yesterdayCount: DayCount;
  todaySuccessRate: number;
  yesterdaySuccessRate: number;
}

export interface MchProductStat {
  id: number;
  statisticsDate: string;
  mchNo: string;
  mchName: string;
  productId: number;
  productName: string;
  icon?: string;
  mchFeeRate: number;
  totalAmount: number;
  totalSuccessAmount: number;
  totalCost: number;
  totalOrderCount: number;
  orderSuccessCount: number;
}

export interface MchPrepaidHistory {
  id?: number;
  mchPrepaidHistoryId?: number;
  mchNo?: string;
  mchName?: string;
  beforeBalance?: number;
  amount?: number;
  afterBalance?: number;
  fundDirection?: number;
  operator?: string;
  createdLoginName?: string;
  remark?: string;
  pic?: string;
  createdAt?: string;
}

export interface MchStat {
  id: number;
  statisticsDate: string;
  mchNo: string;
  mchName: string;
  totalSuccessAmount: number;
  totalMchCost: number;
  totalOrderCount: number;
  orderSuccessCount: number;
  createdAt?: string;
}

export interface MchAccountHistory {
  id: number;
  mchNo: string;
  mchName: string;
  beforeBalance: number;
  amount: number;
  afterBalance: number;
  payOrderId?: string;
  mchOrderNo?: string;
  payOrderAmount?: number;
  bizType: number;
  fundDirection: number;
  remark?: string;
  createdAt: string;
}

export interface MchDivisionConfig {
  mchFee: number;
  mchFeeRate: number;
  mchMinWithdraw: number;
  mchVisible: number;
}

export interface MchDivisionRecord {
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

export interface MchAppItem {
  mchProductId?: number;
  productId: number;
  productName?: string;
  icon?: string;
  mchRate: number;
  state: number;
  mchNo?: string;
  createdAt?: string;
}

export interface PayTestResult {
  payOrderId: string;
  mchOrderNo: string;
  payData: string;
}

export interface PageResult<T> {
  records: T[];
  total: number;
  current?: number;
  size?: number;
}

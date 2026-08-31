import { requestClient } from '#/api/request';

import type { PageResult, PayOrder, PayRealTimeStat } from '#/api/types/business';

export interface PayOrderListParams {
  pageNumber?: number;
  pageSize?: number;
  payOrderId?: string;
  mchOrderNo?: string;
  passageOrderNo?: string;
  mchNo?: string;
  mchName?: string;
  agentNo?: string;
  passageId?: number | string | null;
  productId?: number | string | null;
  passageGroupName?: string;
  state?: number | string;
  notifyState?: number | string;
  forceChangeState?: number | string;
  minAmount?: number | string;
  maxAmount?: number | string;
  timeRange?: number | string;
  createdStart?: string;
  createdEnd?: string;
  successTimeStart?: string;
  successTimeEnd?: string;
}

function normalizeQuery(params: PayOrderListParams) {
  const query: Record<string, unknown> = { ...params };
  const timeRange = Number(query.timeRange);
  if (Number.isInteger(timeRange) && timeRange >= 1 && timeRange <= 5) {
    query.timeRange = timeRange;
    delete query.createdStart;
    delete query.createdEnd;
  } else {
    delete query.timeRange;
  }
  for (const key of Object.keys(query)) {
    const value = query[key];
    if (value === '' || value === undefined || value === null) {
      delete query[key];
    }
  }
  return query;
}

export async function fetchPayOrderListApi(params: PayOrderListParams) {
  return requestClient.get<PageResult<PayOrder>>('/payOrder', {
    params: normalizeQuery(params),
  });
}

export async function fetchPayOrderDetailApi(payOrderId: string) {
  return requestClient.get<PayOrder>(`/payOrder/${payOrderId}`);
}

export async function fetchPayRealTimeStatApi(params: PayOrderListParams) {
  return requestClient.post<PayRealTimeStat>(
    '/payRealTimeStatOrder',
    normalizeQuery(params),
  );
}

export async function queryForcePayOrderKeyApi(payOrderId: string) {
  return requestClient.post<{ key?: string } | number>(
    '/payOrder/queryForcePayOrderKey',
    { payOrderId },
  );
}

export async function forcePayOrderSuccessApi(
  payOrderId: string,
  code: number | string,
) {
  return requestClient.post<PayOrder>('/payOrder/forcePayOrderSuccess', {
    code,
    payOrderId,
  });
}

export async function changePayOrderAmountApi(
  payOrderId: string,
  amountCent: number,
) {
  // 生产：GET /payOrder/{id}/changePayOrder/{amountCent}，不传验证码
  return requestClient.get<PayOrder>(
    `/payOrder/${payOrderId}/changePayOrder/${amountCent}`,
  );
}

export async function forcePayOrderRedoApi(payOrderId: string) {
  // 生产：GET /payOrder/{id}/forcePayOrderRedo，不传验证码
  // 勿先调 queryForcePayOrderKey：该接口 assertCanForce 仅允许 1/3/6，
  // 而冲正要求订单已成功(state=2)，会误报「订单状态错误」
  return requestClient.get<PayOrder>(
    `/payOrder/${payOrderId}/forcePayOrderRedo`,
  );
}

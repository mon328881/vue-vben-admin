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
  // 契约：GET /payOrder/{id}/changePayOrder/{amountCent}——金额仅路径占位，
  // 只置 state=8，不改金额/不结算；返回 data=null
  return requestClient.get<null>(
    `/payOrder/${payOrderId}/changePayOrder/${amountCent}`,
  );
}

export async function forcePayOrderRedoApi(payOrderId: string) {
  // 契约：GET /payOrder/{id}/forcePayOrderRedo；要求 state=2 + 已绑谷歌
  return requestClient.get<PayOrder>(
    `/payOrder/${payOrderId}/forcePayOrderRedo`,
  );
}

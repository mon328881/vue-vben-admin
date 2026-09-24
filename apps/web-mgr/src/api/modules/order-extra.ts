import { requestClient } from '#/api/request';

import type { PageResult, PayOrder, PayRealTimeStat } from '#/api/types/business';

export async function fetchPayOrderForceListApi(params: Record<string, unknown>) {
  return requestClient.get<PageResult<PayOrder>>('/payOrderForceList', {
    params: {
      ...params,
      forceChangeState: 1,
      state: 2,
    },
  });
}

export async function fetchForceOrderStatApi(params: Record<string, unknown>) {
  return requestClient.post<PayRealTimeStat>(
    '/payRealTimeStatOrder/countRealForceOrder',
    {
      ...params,
      forceChangeState: 1,
      state: 2,
    },
  );
}

export async function fetchErrorOrderListApi(params: Record<string, unknown>) {
  return requestClient.get<PageResult<Record<string, unknown>>>('/errorOrder', {
    params,
  });
}

export async function fetchErrorOrderStatApi(params: Record<string, unknown>) {
  return requestClient.post<{ totalAmount?: number; totalCount?: number }>(
    '/errorRealTimeStatOrder',
    params,
  );
}

export async function fetchErrorOrderDetailApi(errorOrderId: string) {
  return requestClient.get<Record<string, unknown>>(
    `/errorOrder/${errorOrderId}`,
  );
}

export async function fetchMchNotifyListApi(params: Record<string, unknown>) {
  return requestClient.get<PageResult<Record<string, unknown>>>('/mchNotify', {
    params,
  });
}

export async function fetchMchNotifyDetailApi(notifyId: string) {
  return requestClient.get<Record<string, unknown>>(`/mchNotify/${notifyId}`);
}

/** 单条重发：demo 契约 POST /mchNotify/resend/{notifyId}（旧 body 路由 401） */
export async function resendMchNotifyApi(notifyId: number | string) {
  return requestClient.post(`/mchNotify/resend/${notifyId}`);
}

export async function resendAllMchNotifyApi(params: Record<string, unknown>) {
  return requestClient.post('/mchNotifyResend/resendAll', params);
}

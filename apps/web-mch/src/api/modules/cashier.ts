import { requestClient } from '#/api/request';

export interface CashierProduct {
  productId: number;
  productName: string;
}

export interface CashierPayResult {
  orderState?: number;
  payData?: string;
  mchOrderNo?: string;
  errMsg?: string;
}

/** 收银台下单整封（拦截器不剥 data，由页面按 code/orderState 分支） */
export interface CashierPayEnvelope {
  code?: number;
  msg?: string;
  data?: CashierPayResult | null;
}

export async function fetchCashierProductListApi(mchNo: string, secret: string) {
  return requestClient.post<CashierProduct[]>('/anon/cashier/getProductList', {
    mchNo,
    secret,
  });
}

export async function placeCashierOrderRawApi(body: {
  mchNo: string;
  secret: string;
  amount: number;
  productId: number;
}) {
  // 线上契约：返回整个信封 {code,data,msg}，非 0 不在传输层拦截
  return requestClient.post<CashierPayEnvelope>('/anon/cashier/pay', body, {
    responseReturn: 'body',
  });
}

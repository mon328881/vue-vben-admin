import { requestClient } from '#/api/request';

export interface CashierOrder {
  payOrderId: string;
  mchName: string;
  productName: string;
  icon: string;
  amount: number;
  state: number;
  mchOrderNo: string;
  cashierToken: string;
}

export interface CashierProduct {
  productId: number;
  productName: string;
  icon?: string;
}

export interface CashierPayResult {
  orderState?: number;
  payData?: string;
  mchOrderNo?: string;
  errMsg?: string;
}

export async function fetchCashierOrderApi(payOrderId: string) {
  return requestClient.get<CashierOrder>('/anon/cashier/order', {
    params: { payOrderId },
  });
}

export async function payCashierOrderApi(
  payOrderId: string,
  cashierToken: string,
) {
  return requestClient.post<{ payOrderId: string; state: number }>(
    '/anon/cashier/pay',
    { cashierToken, payOrderId },
  );
}

export async function fetchCashierProductListApi(mchNo: string, secret: string) {
  return requestClient.post<CashierProduct[]>('/anon/cashier/getProductList', {
    mchNo,
    secret,
  });
}

export async function placeCashierOrderApi(body: {
  mchNo: string;
  secret: string;
  amount: number;
  productId: number;
}) {
  return requestClient.post<CashierPayResult>('/anon/cashier/pay', body);
}

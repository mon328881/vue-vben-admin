import { requestClient } from '#/api/request';

import type {
  PageResult,
  PayOrder,
  PayOrderQuery,
  ProductShort,
} from '#/api/types/business';

export async function fetchPayOrderListApi(query: PayOrderQuery) {
  return requestClient.get<PageResult<PayOrder>>('/payOrder', { params: query });
}

export async function fetchPayOrderDetailApi(payOrderId: string) {
  return requestClient.get<PayOrder>(`/payOrder/${payOrderId}`);
}

export async function fetchProductListShortApi() {
  return requestClient.post<ProductShort[]>('/productListShort', {});
}

export async function payTestPayOrdersApi(body: {
  mchOrderNo: string;
  productId: number;
  amount: number;
}) {
  return requestClient.post<{
    payOrderId: string;
    mchOrderNo: string;
    payData: string;
  }>('/paytest/payOrders', body);
}

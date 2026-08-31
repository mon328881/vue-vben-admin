import { requestClient } from '#/api/request';
import type { PageResult, PayOrder, ProductShort } from '#/api/types/business';

export interface PayOrderQuery {
  pageNumber: number;
  pageSize: number;
  payOrderId?: string;
  mchOrderNo?: string;
  passageOrderNo?: string;
  mchNo?: string;
  mchName?: string;
  passageId?: string;
  payPassageName?: string;
  productId?: number;
  state?: number;
  notifyState?: number;
  forceChangeState?: number;
  createdStart?: string;
  createdEnd?: string;
  successTimeStart?: string;
  successTimeEnd?: string;
}

export async function fetchPayOrderListApi(params: PayOrderQuery) {
  return requestClient.get<PageResult<PayOrder>>('/payOrder', { params });
}

export async function fetchPayOrderDetailApi(payOrderId: string) {
  return requestClient.get<PayOrder>(
    `/payOrder/${encodeURIComponent(payOrderId)}`,
  );
}

export async function fetchPassagePayOrderListApi(params: PayOrderQuery) {
  return requestClient.get<PageResult<PayOrder>>('/passagePayOrder', {
    params,
  });
}

export async function fetchPassagePayOrderDetailApi(payOrderId: string) {
  return requestClient.get<PayOrder>(
    `/passagePayOrder/${encodeURIComponent(payOrderId)}`,
  );
}

export async function fetchProductListShortApi() {
  return requestClient.post<ProductShort[]>('/productListShort', {});
}

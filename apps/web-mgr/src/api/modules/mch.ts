import { requestClient } from '#/api/request';

import type {
  MchInfo,
  MchPassageInfo,
  MchProductInfo,
  MchStatInfo,
  PageResult,
} from '#/api/types/business';

export interface MchListParams {
  pageNumber?: number;
  pageSize?: number;
  mchName?: string;
  mchNo?: string;
  agentNo?: string;
  mchGroup?: string;
  state?: string | number;
  sortField?: string;
  sortOrder?: string;
}

export interface MchInfoCreatePayload {
  mchName: string;
  loginUserName: string;
  agentNo: string;
  mchGroup: string;
  orderCountLimit: number;
  state: number;
  secret: string;
  remark: string;
}

export interface MchInfoUpdatePayload {
  agentNo: string;
  mchGroup: string;
  remark: string;
  mchName?: string;
  orderCountLimit?: number;
  state?: number;
  secret?: string;
  canPush?: number;
  canNotify?: number;
  canRateNotify?: number;
  cashierState?: number;
}

export async function fetchMchListApi(params: MchListParams) {
  return requestClient.get<PageResult<MchInfo>>('/mchInfo', { params });
}

export async function fetchMchStatInfoApi(params: MchListParams) {
  return requestClient.post<MchStatInfo>('/mchStatInfo/statMchInfo', params);
}

export async function fetchMchInfoApi(mchNo: string) {
  return requestClient.get<MchInfo>(`/mchInfo/${mchNo}`);
}

export async function createMchInfoApi(payload: MchInfoCreatePayload) {
  return requestClient.post<MchInfo>('/mchInfo', payload);
}

export async function updateMchInfoApi(
  mchNo: string,
  payload: MchInfoUpdatePayload,
) {
  return requestClient.put<MchInfo>(`/mchInfo/${mchNo}`, payload);
}

export async function resetMchLoginAuthApi(mchNo: string) {
  return requestClient.put(`/mchInfo/${mchNo}/resetLoginAuth`);
}

export async function deleteMchInfoApi(mchNo: string) {
  return requestClient.delete(`/mchInfo/${mchNo}`);
}

export async function updateMchLoginWhiteListApi(
  mchNo: string,
  loginWhiteList: string,
) {
  return requestClient.put(`/mchInfoLoginWhiteList/${mchNo}`, {
    loginWhiteList,
  });
}

export async function fetchMchCashierApi(mchNo: string) {
  return requestClient.get<string>(`/mchCashier/${mchNo}`);
}

export interface MchConnectInfo {
  mchUrl?: string;
  loginName?: string;
  mchNo?: string;
  secret?: string;
  payApi?: string;
  queryApi?: string;
  balanceApi?: string;
  docUrl?: string;
  serverIp?: string;
}

export async function fetchMchInfoCopyApi(mchNo: string) {
  return requestClient.get<MchConnectInfo>(`/mchInfoCopy/${mchNo}`);
}

/** —— 商户产品配置 —— */
export async function fetchMchProductInfoApi(params: Record<string, unknown>) {
  return requestClient.get<PageResult<MchProductInfo>>('/mchProductInfo', {
    params,
  });
}

export async function updateMchProductInfoApi(payload: {
  productId: number;
  state: number;
  mchRate: number;
  agentRate: number;
  mchNo: string;
}) {
  return requestClient.put('/mchProductInfo/', payload);
}

export async function mchProductBlindAllApi(mchNo: string) {
  return requestClient.post(`/mchProductInfo/blindAll/${mchNo}`);
}

export async function mchProductUnBlindAllApi(mchNo: string) {
  return requestClient.post(`/mchProductInfo/unBlindAll/${mchNo}`);
}

export async function setMchProductBatchRateApi(
  mchNo: string,
  payload: Record<string, unknown>,
) {
  return requestClient.post(`/mchProductInfo/setBatchRate/${mchNo}`, payload);
}

export async function setMchProductAllRateApi(
  mchNo: string,
  payload: Record<string, unknown>,
) {
  return requestClient.post(`/mchProductInfo/setAllRate/${mchNo}`, payload);
}

export async function execMchProductRateCommandApi(
  mchNo: string,
  command: string,
) {
  return requestClient.post<{ message?: string; success?: boolean }>(
    `/mchProductInfo/execRateCommand/${mchNo}`,
    { command },
  );
}

/** —— 商户通道绑定 —— */
export async function fetchMchPassageInfoApi(params: Record<string, unknown>) {
  return requestClient.get<PageResult<MchPassageInfo>>('/mchPassageInfo', {
    params,
  });
}

export async function updateMchPassageInfoApi(payload: {
  payPassageId: number;
  state: number;
  mchNo: string;
}) {
  return requestClient.put('/mchPassageInfo/', payload);
}

export async function mchPassageBlindAllApi(mchNo: string) {
  return requestClient.post(`/mchPassageInfo/blindAll/${mchNo}`);
}

export async function mchPassageUnBlindAllApi(mchNo: string) {
  return requestClient.post(`/mchPassageInfo/unBlindAll/${mchNo}`);
}

export async function setMchPassageAllApi(
  mchNo: string,
  payload: { selectedIds: Array<number | string>; changeAllState: number },
) {
  return requestClient.post(`/mchPassageInfo/setAll/${mchNo}`, payload);
}

/** —— 批量设置 —— */
export async function multipleSetStateApi(payload: {
  state: number;
  selectedIds: string[];
}) {
  return requestClient.post('/mchInfoMultipleSet/multipleSetState', payload);
}

export async function multipleSetCanPushApi(payload: {
  canPush: number;
  selectedIds: string[];
}) {
  return requestClient.post('/mchInfoMultipleSet/multipleSetCanPush', payload);
}

export async function multipleSetCanNotifyApi(payload: {
  canNotify: number;
  selectedIds: string[];
}) {
  return requestClient.post(
    '/mchInfoMultipleSet/multipleSetCanNotify',
    payload,
  );
}

export async function multipleSetCanRateNotifyApi(payload: {
  canRateNotify: number;
  selectedIds: string[];
}) {
  return requestClient.post(
    '/mchInfoMultipleSet/multipleSetCanRateNotify',
    payload,
  );
}

/** —— 预付 / 余额 / 结算 —— */
export interface MchAutoSettleInfo {
  mchAutoSettle: number;
  mchAutoSettleTime?: string;
}

export async function fetchAutoSettleInfoApi() {
  return requestClient.get<MchAutoSettleInfo>('/mchPrepaid/getAutoSettleInfo');
}

export async function setMchAutoSettleApi(payload: {
  autoSettleEnable: number;
  time: string;
  googleCode: string;
}) {
  return requestClient.post<MchAutoSettleInfo>(
    '/mchPrepaid/setMchAutoSettle',
    payload,
  );
}

export async function changeMchBalanceApi(
  mchNo: string,
  payload: { changeAmount: number; changeRemark: string },
) {
  return requestClient.put(`/mchBalance/${mchNo}`, payload);
}

/** 调整商户冻结金额：正数从余额冻结，负数解冻回余额 */
export async function changeMchFreezeApi(
  mchNo: string,
  payload: { changeAmount: number; changeRemark: string },
) {
  return requestClient.put(`/mchBalance/${mchNo}/freeze`, payload);
}

export async function changeMchPrepaidApi(
  mchNo: string,
  payload: {
    changePrepaidAmount: number;
    changePrepaidRemark: string;
    pic?: string;
  },
) {
  return requestClient.put(`/mchPrepaid/changePrepaid/${mchNo}`, payload);
}

export async function settleMchApi(mchNo: string) {
  return requestClient.post(`/mchPrepaid/settle/${mchNo}`);
}

export async function multiplePrepaidResetApi(selectedIds: string[]) {
  return requestClient.post('/mchPrepaid/multiplePrepaidReset', {
    selectedIds,
  });
}

export async function multipleSettleApi(selectedIds: string[]) {
  return requestClient.post('/mchPrepaid/multipleSettle', { selectedIds });
}

export async function allPrepaidResetApi(googleCode: string) {
  return requestClient.post('/mchPrepaid/allPrepaidReset', { googleCode });
}

export async function allSettleApi(googleCode: string) {
  return requestClient.post('/mchPrepaid/allSettle', { googleCode });
}

/** —— 下单测试 —— */
export async function doMchPayTestApi(payload: {
  testOrderNo: string;
  passageId: number;
  amount: number;
  mchNo: string;
}) {
  return requestClient.post<{ payData?: string }>(
    '/mchPayTest/doPay',
    payload,
  );
}

export interface PassageShort {
  payPassageId: number;
  payPassageName?: string;
}

export interface ProductShort {
  productId: number;
  productName?: string;
}

export interface PassageGroupShort {
  passageGroupName: string;
}

export async function fetchPassageListShortApi() {
  return requestClient.post<PassageShort[]>('/passageListShort', {});
}

export async function fetchProductListShortApi() {
  return requestClient.post<ProductShort[]>('/productListShort', {});
}

export async function fetchPassageGroupListShortApi() {
  return requestClient.post<PassageGroupShort[]>(
    '/passageGroupListShort',
    {},
  );
}

export interface AgentShort {
  agentNo: string;
  agentName?: string;
}

export interface MchGroupShort {
  mchGroupName: string;
  state?: number;
}

export async function fetchAgentInfoListShortApi() {
  return requestClient.post<AgentShort[]>('/agentInfoListShort', {});
}

export async function fetchMchGroupListShortApi() {
  return requestClient.post<MchGroupShort[]>('/mchGroupListShort', {});
}

/** —— 凭证图片 —— */
export async function uploadPicApi(file: File) {
  const form = new FormData();
  form.append('file', file);
  return requestClient.post<string>('/file/uploadPic', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function fetchPicBase64Api(pic: string) {
  return requestClient.post<string>('/file/getPicBase64', undefined, {
    params: { pic },
  });
}

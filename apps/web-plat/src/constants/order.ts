export const ORDER_STATE_OPTIONS = [
  { label: '订单生成', value: 0 },
  { label: '支付中', value: 1 },
  { label: '支付成功', value: 2 },
  { label: '支付失败', value: 3 },
  { label: '测试冲正', value: 5 },
  { label: '订单关闭', value: 6 },
  { label: '出码失败', value: 7 },
  { label: '调额入账', value: 8 },
];

export const NOTIFY_STATE_OPTIONS = [
  { label: '未发送', value: 0 },
  { label: '通知中', value: 1 },
  { label: '通知成功', value: 2 },
  { label: '通知失败', value: 3 },
];

export const FORCE_CHANGE_OPTIONS = [
  { label: '否', value: 0 },
  { label: '是', value: 1 },
];

const ORDER_STATE_LABEL: Record<number, string> = {
  0: '订单生成',
  1: '支付中',
  2: '支付成功',
  3: '支付失败',
  4: '已撤销',
  5: '测试冲正',
  6: '订单关闭',
  7: '出码失败',
  8: '调额入账',
};

const NOTIFY_STATE_LABEL: Record<number, string> = {
  0: '未发送',
  1: '通知中',
  2: '通知成功',
  3: '通知失败',
};

const ORDER_STATE_COLOR: Record<number, string> = {
  0: 'default',
  1: 'processing',
  2: 'success',
  3: 'error',
  4: 'error',
  5: 'warning',
  6: 'default',
  7: 'error',
  8: 'warning',
};

const NOTIFY_STATE_COLOR: Record<number, string> = {
  0: 'default',
  1: 'processing',
  2: 'success',
  3: 'error',
};

export function orderStateLabel(state?: number | null) {
  return ORDER_STATE_LABEL[state ?? -1] ?? `状态${state ?? '—'}`;
}

export function notifyStateLabel(state?: number | null) {
  return NOTIFY_STATE_LABEL[state ?? -1] ?? `通知${state ?? '—'}`;
}

export function orderStateColor(state?: number | null) {
  return ORDER_STATE_COLOR[state ?? -1] ?? 'default';
}

export function notifyStateColor(state?: number | null) {
  return NOTIFY_STATE_COLOR[state ?? -1] ?? 'default';
}

export const PAY_ORDER_STATE_MAP: Record<
  number,
  { color: string; name: string }
> = {
  0: { color: 'default', name: '订单生成' },
  1: { color: 'processing', name: '支付中' },
  2: { color: 'success', name: '支付成功' },
  3: { color: 'error', name: '支付失败' },
  4: { color: 'error', name: '已撤销' },
  5: { color: 'warning', name: '测试冲正' },
  6: { color: 'default', name: '订单关闭' },
  7: { color: 'error', name: '出码失败' },
  8: { color: 'warning', name: '调额入账' },
};

export const NOTIFY_STATE_MAP: Record<
  number,
  { color: string; name: string }
> = {
  0: { color: 'default', name: '未发送' },
  1: { color: 'processing', name: '通知中' },
  2: { color: 'success', name: '通知成功' },
  3: { color: 'error', name: '通知失败' },
};

export const PAY_STATE_OPTIONS = Object.entries(PAY_ORDER_STATE_MAP).map(
  ([value, item]) => ({
    label: item.name,
    value: Number(value),
  }),
);

export const NOTIFY_STATE_OPTIONS = Object.entries(NOTIFY_STATE_MAP).map(
  ([value, item]) => ({
    label: item.name,
    value: Number(value),
  }),
);

export const FORCE_CHANGE_OPTIONS = [
  { label: '是', value: 1 },
  { label: '否', value: 0 },
];

export function payOrderStateLabel(state?: number | null) {
  if (state == null) return '-';
  return PAY_ORDER_STATE_MAP[state]?.name ?? `状态${state}`;
}

export function payOrderStateColor(state?: number | null) {
  if (state == null) return 'default';
  return PAY_ORDER_STATE_MAP[state]?.color ?? 'default';
}

export function notifyStateLabel(state?: number | null) {
  if (state == null) return '-';
  return NOTIFY_STATE_MAP[state]?.name ?? `通知${state}`;
}

export function notifyStateColor(state?: number | null) {
  if (state == null) return 'default';
  return NOTIFY_STATE_MAP[state]?.color ?? 'default';
}

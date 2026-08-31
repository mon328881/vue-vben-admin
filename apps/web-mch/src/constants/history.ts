export const FUND_DIRECTION_OPTIONS = [
  { label: '加款', value: 1 },
  { label: '减款', value: 2 },
];

export const BIZ_TYPE_OPTIONS = [
  { label: '支付', value: 1 },
  { label: '提现', value: 2 },
  { label: '调账', value: 3 },
  { label: '提现驳回', value: 4 },
  { label: '测试冲正', value: 6 },
  { label: '手续费', value: 7 },
];

export function bizTypeLabel(value?: number | null) {
  if (value == null) return '-';
  return BIZ_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? `类型${value}`;
}

export const BIZ_TYPE_OPTIONS = [
  { label: '分润', value: 1 },
  { label: '提现', value: 2 },
  { label: '调账', value: 3 },
  { label: '提现驳回', value: 4 },
  { label: '测试冲正', value: 6 },
  { label: '手续费', value: 7 },
];

export const FUND_DIRECTION_OPTIONS = [
  { label: '加款', value: 1 },
  { label: '减款', value: 2 },
];

const BIZ_LABEL: Record<number, string> = {
  1: '分润',
  2: '提现',
  3: '调账',
  4: '提现驳回',
  6: '测试冲正',
  7: '手续费',
};

export function bizTypeLabel(value?: number | null) {
  return BIZ_LABEL[value ?? -1] ?? '—';
}

export const DIVISION_STATE_OPTIONS = [
  { label: '待结算', value: 1 },
  { label: '结算成功', value: 2 },
  { label: '结算失败', value: 3 },
];

export function divisionStateLabel(state?: number | null) {
  if (state === 1) return '待结算';
  if (state === 2) return '结算成功';
  if (state === 3) return '结算失败';
  return '超时关闭';
}

export function divisionStateColor(state?: number | null) {
  if (state === 1) return 'processing';
  if (state === 2) return 'success';
  if (state === 3) return 'error';
  return 'warning';
}

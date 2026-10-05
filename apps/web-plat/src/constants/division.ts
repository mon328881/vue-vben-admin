export const DIVISION_STATE_OPTIONS = [
  { label: '待结算', value: 1 },
  { label: '结算成功', value: 2 },
  { label: '结算失败', value: 3 },
];

const STATE_LABEL: Record<number, string> = {
  1: '待结算',
  2: '结算成功',
  3: '结算失败',
};

const STATE_COLOR: Record<number, string> = {
  1: 'processing',
  2: 'success',
  3: 'error',
};

export function divisionStateLabel(state?: number | null) {
  return STATE_LABEL[state ?? -1] ?? '超时关闭';
}

export function divisionStateColor(state?: number | null) {
  return STATE_COLOR[state ?? -1] ?? 'warning';
}

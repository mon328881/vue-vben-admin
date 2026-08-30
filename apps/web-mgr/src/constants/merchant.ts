/** 演示/锁定商户号，部分字段不可改 */
export const LOCKED_MCH_NO = 'M1691231056';

export const FUND_DIRECTION_OPTIONS = [
  { value: '1', label: '加款' },
  { value: '2', label: '减款' },
];

export const PASSAGE_BIZ_TYPE_OPTIONS = [
  { value: '4', label: '订单' },
  { value: '5', label: '调账' },
  { value: '6', label: '自动日切' },
];

export const AGENT_BIZ_TYPE_OPTIONS = [
  { value: '1', label: '分润' },
  { value: '2', label: '提现' },
  { value: '3', label: '调账' },
  { value: '4', label: '提现驳回' },
  { value: '6', label: '测试冲正' },
  { value: '7', label: '手续费' },
];

export const MCH_BIZ_TYPE_OPTIONS = [
  { value: '1', label: '支付' },
  { value: '2', label: '提现' },
  { value: '3', label: '调账' },
  { value: '4', label: '提现驳回' },
  { value: '6', label: '测试冲正' },
  { value: '7', label: '手续费' },
];

export const MCH_GROUP_SETTLE_MODES = [
  { value: 0, label: '关闭', description: '该分组不执行自动结算。' },
  {
    value: 1,
    label: '独立时间',
    description: '按本分组单独设置的每日时间执行结算。',
  },
  {
    value: 2,
    label: '跟随全局',
    description: '使用商户自动结算总开关和全局结算时间。',
  },
];

export const PASSAGE_GROUP_SETTLE_MODES = [
  { value: 0, label: '关闭', description: '该供应商不执行自动结算。' },
  {
    value: 1,
    label: '独立时间',
    description: '按本供应商单独设置的每日时间执行结算。',
  },
  {
    value: 2,
    label: '跟随全局',
    description: '使用“通道自动日切”总开关和执行时间。',
  },
] as const;

export const DIVISION_STATE_OPTIONS = [
  { value: '1', label: '待结算' },
  { value: '2', label: '结算成功' },
  { value: '3', label: '结算失败' },
  { value: '4', label: '超时关闭' },
];

export function divisionStateLabel(state?: number | null) {
  const map: Record<number, string> = {
    1: '待结算',
    2: '结算成功',
    3: '结算失败',
    4: '超时关闭',
  };
  if (state == null) return '-';
  return map[state] ?? `状态${state}`;
}

export function divisionStateColor(state?: number | null) {
  const n = Number(state);
  if (n === 1) return 'processing';
  if (n === 2) return 'success';
  if (n === 3) return 'error';
  if (n === 4) return 'default';
  return 'default';
}

export function settleModeLabel(mode?: number | null) {
  const hit = MCH_GROUP_SETTLE_MODES.find((m) => m.value === Number(mode));
  return hit?.label ?? '--';
}

export function settleModeTagColor(mode?: number | null) {
  const value = Number(mode);
  if (value === 1) return 'warning';
  if (value === 2) return 'processing';
  return 'default';
}


export function passageGroupSettleModeLabel(mode?: number | null) {
  const n = Number(mode ?? 2);
  const normalized = n === 0 || n === 1 ? n : 2;
  return (
    PASSAGE_GROUP_SETTLE_MODES.find((m) => m.value === normalized)?.label ??
    '-'
  );
}

export function passageGroupSettleModeTagColor(mode?: number | null) {
  const n = Number(mode ?? 2);
  const normalized = n === 0 || n === 1 ? n : 2;
  if (normalized === 1) return 'warning';
  if (normalized === 2) return 'processing';
  return 'default';
}

export function bizTypeLabel(
  value: number | string | null | undefined,
  options: { label: string; value: string }[],
) {
  if (value == null || value === '') return '-';
  return options.find((o) => o.value === String(value))?.label ?? String(value);
}

export function fundDirectionLabel(value?: number | string | null) {
  if (value == null || value === '') return '-';
  return (
    FUND_DIRECTION_OPTIONS.find((o) => o.value === String(value))?.label ??
    String(value)
  );
}

export function isGoogleCode(value: string) {
  return /^\d{6}$/.test(value);
}

export const GOOGLE_CODE_ERROR = '请输入 6 位数字谷歌验证码';

export function todayDateTimeRange(): [string, string] {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return [`${day} 00:00:00`, `${day} 23:59:59`];
}

export function randomSecret() {
  const chars =
    '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let secret = '';
  for (let i = 0; i < 128; i += 1) {
    secret += chars[Math.floor(Math.random() * chars.length)]!;
  }
  return secret;
}

export function isValidWhiteList(value: string) {
  const text = value.trim();
  if (!text) return false;
  if (text === '*') return true;
  return text.split('|').every((item) => {
    const ip = item.trim();
    return ip === '*' || /^\d{1,3}(\.\d{1,3}){3}$/.test(ip);
  });
}

/** 金额：后端存分，展示元 */
export function formatYuan(value?: number | null): string {
  if (value == null) return '0.00';
  const num = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (!Number.isFinite(num)) return '0.00';
  return (num / 100).toLocaleString('zh-CN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}

function toNum(value: unknown, fallback = 0): number {
  if (value == null) return fallback;
  const num =
    typeof value === 'string' ? Number.parseFloat(value) : Number(value);
  return Number.isFinite(num) ? num : fallback;
}

/** 成功率数值（0–100），对齐旧端 rateValue */
export function rateValue(
  success?: number | string | null,
  total?: number | string | null,
  digits = 2,
  fallback = 0,
): number {
  const hit = toNum(success);
  const all = toNum(total);
  if (all === 0 || !Number.isFinite(all) || !Number.isFinite(hit)) {
    return fallback;
  }
  const percent = (hit / all) * 100;
  const clamped = Math.min(Math.max(percent, 0), 100);
  const scale = 10 ** digits;
  return Math.round(clamped * scale) / scale;
}

export function formatSuccessRate(
  successCount?: number | null,
  totalCount?: number | null,
): string {
  return `${rateValue(successCount, totalCount).toFixed(2)}%`;
}

/** 费率/成率字段为 0~1 小数时（对齐旧端 ratePct） */
export function formatRateDecimal(value?: number | null): string {
  if (value == null || Number.isNaN(Number(value))) return '0.00%';
  return `${(Number(value) * 100).toFixed(2)}%`;
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '-';
  return String(value).replace('T', ' ').slice(0, 19);
}

/** 余额正负色 class */
export function amountSignedClass(value?: number | string | null): string {
  const num = toNum(value);
  return num > 0
    ? 'amount-positive'
    : num < 0
      ? 'amount-negative'
      : 'amount-zero';
}

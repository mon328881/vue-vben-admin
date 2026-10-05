import { formatYuan } from '@asiapay/shared/format';

export {
  amountCostClass,
  amountSignedClass,
  fenToYuanNumber,
  formatYuan,
  formatYuanAmount,
  formatYuanWithSymbol,
  signedYuan,
} from '@asiapay/shared/format';

function toNum(value: unknown, fallback = 0): number {
  if (value === null || value === undefined) return fallback;
  const num =
    typeof value === 'string' ? Number.parseFloat(value) : Number(value);
  return Number.isFinite(num) ? num : fallback;
}

/** 成功率数值（0–100），对齐旧端 rateValue */
export function rateValue(
  success?: null | number | string,
  total?: null | number | string,
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
  successCount?: null | number,
  totalCount?: null | number,
): string {
  return `${rateValue(successCount, totalCount).toFixed(2)}%`;
}

/** 费率/成率字段为 0~1 小数时（对齐旧端 ratePct） */
export function formatRateDecimal(value?: null | number): string {
  if (value === null || value === undefined || Number.isNaN(Number(value)))
    return '0.00%';
  return `${(Number(value) * 100).toFixed(2)}%`;
}

/** 费率小数（0~1）展示为百分比，对齐旧端 formatFeeRate */
export function formatFeeRate(value?: null | number | string): string {
  const num =
    typeof value === 'string' ? Number.parseFloat(value) : Number(value ?? 0);
  if (!Number.isFinite(num)) return '--';
  const text = (num * 100).toFixed(4).replace(/\.?0+$/, '');
  return `${text || '0'}%`;
}

export function formatDateTime(value?: null | string): string {
  if (!value) return '-';
  return String(value).replace('T', ' ').slice(0, 19);
}

export function formatOptionalText(value?: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

/** 预付流水汇率展示 */
export function formatExchangeRate(value?: null | number | string): string {
  if (value === null || value === undefined || value === '') return '—';
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value);
  return num.toLocaleString('zh-CN', {
    maximumFractionDigits: 6,
    minimumFractionDigits: 0,
  });
}

/** 预付流水数量（后端存分则按元展示） */
export function formatPrepaidQuantity(value?: null | number | string): string {
  if (value === null || value === undefined || value === '') return '—';
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value);
  return formatYuan(num);
}

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
  if (value == null) return fallback;
  const num =
    typeof value === 'string' ? Number.parseFloat(value) : Number(value);
  return Number.isFinite(num) ? num : fallback;
}

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

export function formatRateDecimal(value?: number | null): string {
  if (value == null || Number.isNaN(Number(value))) return '0.00%';
  return `${(Number(value) * 100).toFixed(2)}%`;
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '-';
  return String(value).replace('T', ' ').slice(0, 19);
}

export function formatOptionalText(value?: unknown): string {
  if (value == null || value === '') return '—';
  return String(value);
}

/** 预付流水汇率展示 */
export function formatExchangeRate(value?: number | string | null): string {
  if (value == null || value === '') return '—';
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value);
  return num.toLocaleString('zh-CN', {
    maximumFractionDigits: 6,
    minimumFractionDigits: 0,
  });
}

/** 预付流水数量（后端存分则按元展示） */
export function formatPrepaidQuantity(value?: number | string | null): string {
  if (value == null || value === '') return '—';
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value);
  return formatYuan(num);
}

export function yuanToCent(value: string | number): number {
  const n = typeof value === 'number' ? value : Number(String(value).trim());
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

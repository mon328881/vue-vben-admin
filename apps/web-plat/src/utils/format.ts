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

export function formatRateDecimal(value?: null | number): string {
  if (value === null || value === undefined || Number.isNaN(Number(value)))
    return '0.00%';
  return `${(Number(value) * 100).toFixed(2)}%`;
}

export function formatDateTime(value?: null | string): string {
  if (!value) return '-';
  return String(value).replace('T', ' ').slice(0, 19);
}

export function yuanToCent(value: number | string): number {
  const n = typeof value === 'number' ? value : Number(String(value).trim());
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

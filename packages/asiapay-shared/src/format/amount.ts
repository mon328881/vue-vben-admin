function toNum(value: unknown, fallback = 0): number {
  if (value == null) return fallback;
  const num =
    typeof value === 'string' ? Number.parseFloat(value) : Number(value);
  return Number.isFinite(num) ? num : fallback;
}

/** 分→元数字部分，不含 ¥（供 signedYuan、CountTo 等组合） */
export function formatYuanAmount(value?: number | null): string {
  if (value == null) return '0.00';
  const num = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (!Number.isFinite(num)) return '0.00';
  return (num / 100).toLocaleString('zh-CN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}

/** 金额展示：后端一律存分，展示元，一律带 ¥ */
export function formatYuan(value?: number | null): string {
  return `¥${formatYuanAmount(value)}`;
}

/** @deprecated 与 formatYuan 相同，保留兼容 */
export function formatYuanWithSymbol(value?: number | null): string {
  return formatYuan(value);
}

/** 分 → 元（数值，供 CountTo 等） */
export function fenToYuanNumber(fen?: number | null): number {
  return toNum(fen) / 100;
}

/** 变动/收入：+¥1.00 / -¥1.00 / ¥0.00 */
export function signedYuan(value?: number | null): string {
  if (value == null || value === 0) return '¥0.00';
  const text = formatYuanAmount(Math.abs(value));
  return value > 0 ? `+¥${text}` : `-¥${text}`;
}

/** 变动/收入类：正绿负红，0 为绿 */
export function amountSignedClass(value?: number | string | null): string {
  const num = toNum(value);
  if (num > 0) return 'amount-positive';
  if (num < 0) return 'amount-negative';
  return 'amount-zero';
}

/** 成本/手续费类：warning */
export function amountCostClass(): string {
  return 'amount-warning';
}

export function formatAmountByKind(
  value: number | null | undefined,
  kind: 'signed' | 'cost' | 'plain',
): string {
  if (kind === 'signed') return signedYuan(value);
  return formatYuan(value);
}

export function classNameForAmountKind(
  value: number | null | undefined,
  kind: 'signed' | 'cost' | 'plain',
): string {
  if (kind === 'signed') return amountSignedClass(value);
  if (kind === 'cost') return amountCostClass();
  return '';
}

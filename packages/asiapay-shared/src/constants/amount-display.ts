/**
 * 金额字段展示语义（后端字段均为分）
 *
 * - signed：变更金额、平台收入、代理分润等，+¥ / -¥，正绿负红，0 绿
 * - cost：手续费、通道成本等，无符号，warning 色
 * - plain：成交金额、订单金额等，加粗默认色
 */
export type AmountDisplayKind = 'signed' | 'cost' | 'plain';

/** 统计/流水表格常见字段 → 展示语义 */
export const AMOUNT_FIELD_KIND = {
  amount: 'signed',
  platTotalIncome: 'signed',
  totalAgentIncome: 'signed',
  totalMchCost: 'cost',
  totalCost: 'cost',
  totalPassageCost: 'cost',
  totalSuccessAmount: 'plain',
  totalAmount: 'plain',
  payOrderAmount: 'plain',
  beforeBalance: 'plain',
  afterBalance: 'plain',
  balance: 'signed',
} as const satisfies Record<string, AmountDisplayKind>;

export type AmountFieldKey = keyof typeof AMOUNT_FIELD_KIND;

export function amountKindForField(
  field: string,
): AmountDisplayKind | undefined {
  return AMOUNT_FIELD_KIND[field as AmountFieldKey];
}

export function stripCopyName(value: string) {
  return String(value ?? '').replace(/\s+/g, '');
}

export function defaultCopyName(sourceName: string, at = new Date()) {
  const hh = String(at.getHours()).padStart(2, '0');
  const mm = String(at.getMinutes()).padStart(2, '0');
  return `${sourceName}-一键复制-${hh}:${mm}`;
}

export function validateCopyName(newName: string, sourceName: string) {
  const name = stripCopyName(newName);
  if (!name) return { message: '请输入通道名称', valid: false };
  if (name === stripCopyName(sourceName)) {
    return { message: '新通道名称不能与原通道相同', valid: false };
  }
  return { valid: true as const };
}

export function clonePassageForCreate(
  row: Record<string, unknown>,
  newName: string,
) {
  return {
    payPassageName: stripCopyName(newName),
    productId: row.productId,
    ifCode: row.ifCode ?? '',
    payType: row.payType ?? 1,
    payRules: row.payRules ?? '',
    rate: row.rate ?? 0,
    passageGroup: row.passageGroup ?? row.passageGroupName ?? '',
    agentNo: row.agentNo ?? '',
    agentRate: row.agentRate ?? 0,
    weights: row.weights ?? 1,
    state: 1,
    balance: 0,
    timeLimit: row.timeLimit ?? 0,
    timeRules: row.timeRules ?? '',
    openLimit: row.openLimit ?? 0,
    payInterfaceConfig: row.payInterfaceConfig ?? '',
  };
}

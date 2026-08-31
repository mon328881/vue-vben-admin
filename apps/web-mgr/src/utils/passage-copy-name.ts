export function stripCopyName(value: string) {
  return String(value ?? '').replace(/\s+/g, '');
}

export function defaultCopyName(sourceName: string, at = new Date()) {
  const hh = String(at.getHours()).padStart(2, '0');
  const mm = String(at.getMinutes()).padStart(2, '0');
  return `${sourceName}-一键复制-${hh}:${mm}`;
}

export function uniqueCopyNames(sourceNames: string[], at = new Date()) {
  const used = new Set<string>();
  return sourceNames.map((name) => {
    const base = defaultCopyName(String(name ?? ''), at);
    let next = base;
    let serial = 2;
    while (used.has(next)) {
      next = `${base}-${serial}`;
      serial += 1;
    }
    used.add(next);
    return next;
  });
}

export function validateCopyName(newName: string, sourceName: string) {
  const name = stripCopyName(newName);
  if (!name) return { valid: false, message: '请输入通道名称' };
  if (name === stripCopyName(sourceName)) {
    return { valid: false, message: '新通道名称不能与原通道相同' };
  }
  return { valid: true as const };
}

export function validateCopyBatch(
  items: Array<{ newName: string; sourceName: string; label?: string }>,
) {
  const used = new Set<string>();
  for (const item of items) {
    const prefix = item.label ? `${item.label}：` : '';
    const check = validateCopyName(item.newName, item.sourceName);
    if (!check.valid) return { valid: false, message: `${prefix}${check.message}` };
    const name = stripCopyName(item.newName);
    if (used.has(name)) {
      return {
        valid: false,
        message: `${prefix}新通道名称「${name}」在本批次中重复`,
      };
    }
    used.add(name);
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

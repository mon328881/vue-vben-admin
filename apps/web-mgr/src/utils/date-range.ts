/** 默认近 7 天的起止时间（对齐旧端统计页默认周） */
export function defaultWeekRange(): [string, string] {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);
  return [formatDayStart(start), formatDayEnd(end)];
}

export function defaultTodayRange(): [string, string] {
  const now = new Date();
  return [formatDayStart(now), formatDayEnd(now)];
}

export function formatDayStart(d: Date) {
  return `${ymd(d)} 00:00:00`;
}

export function formatDayEnd(d: Date) {
  return `${ymd(d)} 23:59:59`;
}

function ymd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Ant Design RangePicker value → API createdStart/End */
export function rangeToQuery(
  range: [string, string] | null | undefined,
): { createdStart?: string; createdEnd?: string } {
  if (!range?.[0] || !range?.[1]) return {};
  return { createdEnd: range[1], createdStart: range[0] };
}

/**
 * 将 RangePicker 的值规范成后端可解析的 `yyyy-MM-dd HH:mm:ss`。
 * Ant Design Vue 有时会把 value-format 的字符串回写成 Dayjs，直接 String() 会变成非法日期。
 */
export function toDateTimeParam(value: unknown): string | undefined {
  if (value == null || value === '') return undefined;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(trimmed)) return trimmed;
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return `${trimmed} 00:00:00`;
    return undefined;
  }
  if (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { format?: (p: string) => string }).format === 'function'
  ) {
    return (value as { format: (p: string) => string }).format(
      'YYYY-MM-DD HH:mm:ss',
    );
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${ymd(value)} ${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}:${String(value.getSeconds()).padStart(2, '0')}`;
  }
  return undefined;
}

/** 去掉空串，避免把空筛选条件传给后端 */
export function cleanListParams(
  input: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === '' || value === null || value === undefined) continue;
    out[key] = value;
  }
  return out;
}

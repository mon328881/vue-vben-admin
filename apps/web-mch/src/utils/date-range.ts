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

export function rangeToQuery(
  range: [string, string] | null | undefined,
): { createdStart?: string; createdEnd?: string } {
  if (!range?.[0] || !range?.[1]) return {};
  return { createdEnd: range[1], createdStart: range[0] };
}

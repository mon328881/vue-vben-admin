export function bizTypeLabel(
  value: number | string | null | undefined,
  options: { label: string; value: string }[],
) {
  if (value == null || value === '') return '-';
  return options.find((o) => o.value === String(value))?.label ?? String(value);
}

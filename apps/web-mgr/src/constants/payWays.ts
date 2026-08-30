/** 对齐 mgr-web/src/constants/payWays.ts — 文案勿擅自改动 */
export const PRODUCT_STATE_OPTIONS = [
  { value: '0', label: '禁用' },
  { value: '1', label: '启用' },
];

export const PRODUCT_HAVE_AGENT_OPTIONS = [
  { value: '0', label: '无代理' },
  { value: '1', label: '有代理' },
];

export const PRODUCT_POLL_MODES = [
  {
    value: 0,
    label: '权重模式',
    description: '按各可用通道设置的权重占比大小，随机分配订单。',
  },
  {
    value: 1,
    label: '费率优先',
    description:
      '在可用通道中，按费率从低到高依次尝试，费率相同时随机排序。',
  },
  {
    value: 2,
    label: '成率优先',
    description:
      '近60分钟满30笔时按实时成功率从高到低；样本不足时参考日统计，仍不足的通道作为候补并按默认权重排序。',
  },
  {
    value: 3,
    label: '混合模式',
    description:
      '将可用通道按相近权重分组，同组内按费率从低到高顺序依次尝试。',
  },
];

const UNKNOWN_MODE = {
  value: -1,
  label: '未知模式',
  description: '当前轮询模式无法识别，请重新编辑产品配置。',
};

export const PRODUCT_ICON_FILES = Array.from(
  { length: 25 },
  (_, index) => `icon${index + 1}.webp`,
);

export const PRODUCT_DETAIL_MAX = 800;

export const PRODUCT_ID_PATTERN = /^[1-9]\d{0,7}$/;

export const PRODUCT_RATE_RE = /^-?\d+(?:\.\d{1,2})?$/;

export const BATCH_RATE_ACTIONS = [
  {
    value: 'setMchRate',
    label: '设置商户费率',
    inputLabel: '商户费率',
    description: '按产品设置商户费率。',
  },
  {
    value: 'setAgentRate',
    label: '设置代理费率',
    inputLabel: '代理费率',
    description: '按产品设置代理费率。',
  },
  {
    value: 'adjustMchRate',
    label: '调增商户费率',
    inputLabel: '费率调增值',
    description: '在现有商户费率基础上统一加减，正数上调，负数下调。',
  },
  {
    value: 'adjustAgentRate',
    label: '调增代理费率',
    inputLabel: '费率调增值',
    description: '在现有代理费率基础上统一加减，正数上调，负数下调。',
  },
] as const;

export type BatchRateAction = (typeof BATCH_RATE_ACTIONS)[number]['value'];

export function productPollMode(mode?: number | string | null) {
  const value = Number(mode ?? 0);
  return PRODUCT_POLL_MODES.find((item) => item.value === value) ?? UNKNOWN_MODE;
}

export function toProductRate(value: unknown) {
  return Number(
    (Number.parseFloat(String(value ?? '').trim()) / 100).toFixed(4),
  );
}

export function validateProductRate(value: unknown, label: string) {
  const text = String(value ?? '').trim();
  if (!text) return `${label}不能为空`;
  if (!PRODUCT_RATE_RE.test(text)) return `${label}格式错误，最多两位小数`;
  const number = Number.parseFloat(text);
  if (number < -100 || number > 100) return `${label}范围应在 -100~100 之间`;
  return '';
}

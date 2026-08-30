<script lang="ts" setup>
import { computed } from 'vue';

import { Tooltip } from 'ant-design-vue';

import type { MchInfo } from '#/api/types/business';

const props = defineProps<{ row: MchInfo }>();

const FLAGS = [
  { key: 'canPush', short: '推', label: '启用推送', field: 'canPush' as const },
  {
    key: 'canNotify',
    short: '通',
    label: '启用通知',
    field: 'canNotify' as const,
  },
  {
    key: 'canRateNotify',
    short: '率',
    label: '启用费率变动提醒',
    field: 'canRateNotify' as const,
  },
  {
    key: 'cashierState',
    short: '台',
    label: '是否启用收银台',
    field: 'cashierState' as const,
  },
];

const items = computed(() =>
  FLAGS.map((flag) => ({
    key: flag.key,
    short: flag.short,
    label: flag.label,
    active: Number(props.row[flag.field] ?? 0) === 1,
  })),
);

const tipText = computed(() =>
  items.value
    .map((item) => `${item.label}：${item.active ? '已启用' : '已禁用'}`)
    .join('\n'),
);
</script>

<template>
  <Tooltip>
    <template #title>
      <div class="whitespace-pre-line text-xs">{{ tipText }}</div>
    </template>
    <div class="mch-feature-flags">
      <span
        v-for="item in items"
        :key="item.key"
        class="mch-feature-flags__chip"
        :class="
          item.active
            ? 'mch-feature-flags__chip--on'
            : 'mch-feature-flags__chip--off'
        "
      >
        {{ item.short }}
      </span>
    </div>
  </Tooltip>
</template>

<style scoped>
.mch-feature-flags {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  line-height: 1;
  cursor: default;
}

.mch-feature-flags__chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-width: 14px;
  padding: 0 1px;
  font-size: 11px;
  line-height: 1.2;
  border: 1px solid hsl(var(--border));
  border-radius: 2px;
  user-select: none;
}

.mch-feature-flags__chip--on {
  color: #389e0d;
  background: color-mix(in srgb, #52c41a 12%, transparent);
  border-color: color-mix(in srgb, #52c41a 40%, hsl(var(--border)));
}

.mch-feature-flags__chip--off {
  color: hsl(var(--muted-foreground));
  background: transparent;
}
</style>

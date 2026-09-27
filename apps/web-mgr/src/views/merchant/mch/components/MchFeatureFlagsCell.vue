<script lang="ts" setup>
import type { MchInfo } from '#/api/types/business';

import { computed } from 'vue';

import { Tooltip } from 'ant-design-vue';

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
    <!-- 2×2 网格：避免单行四格挤换行/难读 -->
    <div class="mch-feature-flags" aria-label="功能开关">
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
  display: grid;
  grid-template-columns: repeat(2, 22px);
  gap: 4px;
  width: fit-content;
  line-height: 1;
  cursor: default;
}

.mch-feature-flags__chip {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  user-select: none;
  border: 1px solid hsl(var(--border));
  border-radius: 4px;
}

.mch-feature-flags__chip--on {
  color: hsl(142deg 71% 28%);
  background: hsl(142deg 60% 45% / 12%);
  border-color: hsl(142deg 50% 40% / 35%);
}

.mch-feature-flags__chip--off {
  color: hsl(var(--muted-foreground));
  background: hsl(var(--muted) / 45%);
  border-color: hsl(var(--border));
}
</style>

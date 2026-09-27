<script lang="ts" setup>
import type { PassageGroupInfo } from '#/api/modules/passage-group';

import { computed } from 'vue';

import { Tooltip } from 'ant-design-vue';

const props = defineProps<{ row: PassageGroupInfo }>();

const FLAGS = [
  { key: 'canPush', short: '推', label: '启用推送', field: 'canPush' as const },
  {
    key: 'canNotify',
    short: '通',
    label: '启用通知',
    field: 'canNotify' as const,
  },
  {
    key: 'canRemind',
    short: '催',
    label: '启用自动催单',
    field: 'canRemind' as const,
  },
  {
    key: 'canWarn',
    short: '警',
    label: '启用异常警报',
    field: 'canWarn' as const,
  },
];

function isEnabled(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    return value === '1' || value.toLowerCase() === 'true';
  }
  return false;
}

const items = computed(() =>
  FLAGS.map((flag) => ({
    key: flag.key,
    short: flag.short,
    label: flag.label,
    active: isEnabled(props.row[flag.field]),
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
    <!-- 2×2 网格：与商户列表功能开关一致 -->
    <div class="pg-feature-flags" aria-label="功能开关">
      <span
        v-for="item in items"
        :key="item.key"
        class="pg-feature-flags__chip"
        :class="
          item.active
            ? 'pg-feature-flags__chip--on'
            : 'pg-feature-flags__chip--off'
        "
      >
        {{ item.short }}
      </span>
    </div>
  </Tooltip>
</template>

<style scoped>
.pg-feature-flags {
  display: grid;
  grid-template-columns: repeat(2, 22px);
  gap: 4px;
  width: fit-content;
  line-height: 1;
  cursor: default;
}

.pg-feature-flags__chip {
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

.pg-feature-flags__chip--on {
  color: hsl(142deg 71% 28%);
  background: hsl(142deg 60% 45% / 12%);
  border-color: hsl(142deg 50% 40% / 35%);
}

.pg-feature-flags__chip--off {
  color: hsl(var(--muted-foreground));
  background: hsl(var(--muted) / 45%);
  border-color: hsl(var(--border));
}
</style>

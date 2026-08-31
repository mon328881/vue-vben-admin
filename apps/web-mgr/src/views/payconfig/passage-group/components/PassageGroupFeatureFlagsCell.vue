<script lang="ts" setup>
import { computed } from 'vue';

import { Tooltip } from 'ant-design-vue';

import type { PassageGroupInfo } from '#/api/modules/passage-group';

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
    <div class="pg-feature-flags">
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
  display: inline-flex;
  align-items: center;
  gap: 2px;
  line-height: 1;
  cursor: default;
}

.pg-feature-flags__chip {
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

.pg-feature-flags__chip--on {
  color: #389e0d;
  background: color-mix(in srgb, #52c41a 12%, transparent);
  border-color: color-mix(in srgb, #52c41a 40%, hsl(var(--border)));
}

.pg-feature-flags__chip--off {
  color: hsl(var(--muted-foreground));
  background: transparent;
}
</style>

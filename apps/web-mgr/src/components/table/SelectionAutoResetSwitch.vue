<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import { useUserStore } from '@vben/stores';

import { Switch, Tooltip } from 'ant-design-vue';

const props = withDefaults(
  defineProps<{
    cacheKey: string;
    closeText?: string;
    defaultValue?: boolean;
    label?: string;
    modelValue?: boolean;
    openText?: string;
    tooltip?: string;
  }>(),
  {
    closeText: '关闭',
    defaultValue: true,
    label: '多选自动重置',
    openText: '打开',
    tooltip:
      '开启后，执行查询操作将清空当前已选选项。关闭后，查询不清空已选项便于连续批量操作。',
  },
);

const emit = defineEmits<{
  change: [value: boolean];
  'update:modelValue': [value: boolean];
}>();

const userStore = useUserStore();
const inner = ref(props.modelValue ?? props.defaultValue);

function storageKey() {
  const username = String(userStore.userInfo?.username ?? '').trim();
  return username
    ? `asiapay-selectionAutoReset-${props.cacheKey}-${username}`
    : null;
}

function readCache(): boolean | null {
  const key = storageKey();
  if (!key) return null;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    return raw === '1';
  } catch {
    return null;
  }
}

function writeCache(value: boolean) {
  const key = storageKey();
  if (!key) return;
  try {
    localStorage.setItem(key, value ? '1' : '0');
  } catch {
    /* ignore quota / private mode */
  }
}

function apply(value: boolean, emitUpdate = true) {
  inner.value = value;
  writeCache(value);
  if (emitUpdate) emit('update:modelValue', value);
}

function restore() {
  const next = readCache() ?? props.modelValue ?? props.defaultValue;
  inner.value = next;
  emit('update:modelValue', next);
}

function onChange(value: boolean | number | string) {
  const next = value === true;
  apply(next);
  emit('change', next);
}

watch(
  () => props.modelValue,
  (value) => {
    if (typeof value === 'boolean' && value !== inner.value) {
      inner.value = value;
      writeCache(value);
    }
  },
);

watch(
  () => userStore.userInfo?.username,
  () => restore(),
  { immediate: true },
);

const labelText = computed(() => props.label);
const tooltipText = computed(() => props.tooltip);
</script>

<template>
  <div class="selection-auto-reset-switch">
    <Tooltip :title="tooltipText" placement="top">
      <span class="selection-auto-reset-switch__label">{{ labelText }}</span>
    </Tooltip>
    <Switch
      :checked="inner"
      :checked-children="openText"
      :un-checked-children="closeText"
      size="default"
      @change="onChange"
    />
  </div>
</template>

<style scoped>
.selection-auto-reset-switch {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  min-width: 0;
  margin-left: auto;
}

.selection-auto-reset-switch__label {
  font-size: 12px;
  color: hsl(var(--muted-foreground));
  white-space: nowrap;
  cursor: help;
}
</style>

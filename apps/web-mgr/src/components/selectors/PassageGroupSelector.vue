<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';

import { message, Select } from 'ant-design-vue';

import { fetchPassageGroupListShortApi } from '#/api';

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    modelValue?: null | string;
    placeholder?: string;
    style?: Record<string, string> | string;
  }>(),
  {
    modelValue: undefined,
    placeholder: '通道供应商',
    disabled: false,
    style: undefined,
  },
);

const emit = defineEmits<{
  change: [value: string | undefined];
  'update:modelValue': [value: string | undefined];
}>();

const loading = ref(false);
const options = ref<{ label: string; value: string }[]>([]);
const inner = ref<string | undefined>(normalize(props.modelValue));

watch(
  () => props.modelValue,
  (value) => {
    inner.value = normalize(value);
  },
);

function normalize(value?: null | string) {
  return value === null || value === undefined || value === ''
    ? undefined
    : String(value);
}

async function load() {
  loading.value = true;
  try {
    const list = (await fetchPassageGroupListShortApi()) ?? [];
    options.value = list.map((item) => ({
      label: item.passageGroupName,
      value: item.passageGroupName,
    }));
  } catch {
    message.error('加载通道供应商列表失败');
    options.value = [];
  } finally {
    loading.value = false;
  }
}

function onChange(value: unknown) {
  const next =
    value === null || value === undefined || value === ''
      ? undefined
      : String(value);
  inner.value = next;
  emit('update:modelValue', next);
  emit('change', next);
}

const selectStyle = computed(() => props.style ?? { width: '200px' });

onMounted(() => {
  void load();
});
</script>

<template>
  <Select
    :value="inner"
    allow-clear
    show-search
    option-filter-prop="label"
    :disabled="disabled"
    :loading="loading"
    :placeholder="placeholder"
    :options="options"
    :style="selectStyle"
    @update:value="onChange"
  />
</template>

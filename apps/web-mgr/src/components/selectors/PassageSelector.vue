<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';

import { Select } from 'ant-design-vue';

import { fetchPassageListShortApi } from '#/api';

const props = withDefaults(
  defineProps<{
    modelValue?: number | string | null;
    placeholder?: string;
    disabled?: boolean;
    style?: string | Record<string, string>;
  }>(),
  {
    placeholder: '对应通道',
    disabled: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: number | string | undefined];
}>();

const loading = ref(false);
const options = ref<{ label: string; value: number }[]>([]);
const inner = ref<number | undefined>(normalize(props.modelValue));

watch(
  () => props.modelValue,
  (value) => {
    inner.value = normalize(value);
  },
);

function normalize(value?: number | string | null) {
  if (value == null || value === '') return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

async function load() {
  loading.value = true;
  try {
    const list = (await fetchPassageListShortApi()) ?? [];
    options.value = list.map((item) => ({
      label: `${item.payPassageName ?? ''} [ID: ${item.payPassageId}]`,
      value: Number(item.payPassageId),
    }));
  } finally {
    loading.value = false;
  }
}

function onChange(value: unknown) {
  const next = normalize(value as number | string | null | undefined);
  inner.value = next;
  emit('update:modelValue', next);
}

const selectStyle = computed(() => props.style ?? { width: '240px' });

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

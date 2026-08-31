<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';

import { Select } from 'ant-design-vue';

import { fetchPassageGroupListShortApi } from '#/api';

const props = withDefaults(
  defineProps<{
    modelValue?: string | null;
    placeholder?: string;
    disabled?: boolean;
    style?: string | Record<string, string>;
  }>(),
  {
    placeholder: '通道供应商',
    disabled: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined];
  change: [value: string | undefined];
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

function normalize(value?: string | null) {
  return value == null || value === '' ? undefined : String(value);
}

async function load() {
  loading.value = true;
  try {
    const list = (await fetchPassageGroupListShortApi()) ?? [];
    options.value = list.map((item) => ({
      label: item.passageGroupName,
      value: item.passageGroupName,
    }));
  } finally {
    loading.value = false;
  }
}

function onChange(value: unknown) {
  const next =
    value == null || value === '' ? undefined : String(value);
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

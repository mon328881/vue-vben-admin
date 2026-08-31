<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';

import { Select } from 'ant-design-vue';

import { fetchMchGroupListShortApi } from '#/api';

const props = withDefaults(
  defineProps<{
    modelValue?: string | null;
    placeholder?: string;
    disabled?: boolean;
    includeDisabled?: boolean;
    style?: string | Record<string, string>;
  }>(),
  {
    placeholder: '商户分组',
    disabled: false,
    includeDisabled: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined];
}>();

const loading = ref(false);
const list = ref<{ mchGroupName: string; state?: number }[]>([]);
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

const options = computed(() => {
  const source = props.includeDisabled
    ? list.value
    : list.value.filter((item) => Number(item.state) === 1);
  return source.map((item) => ({
    value: item.mchGroupName,
    label:
      Number(item.state) === 0
        ? `${item.mchGroupName}（已停用）`
        : item.mchGroupName,
  }));
});

async function load() {
  loading.value = true;
  try {
    list.value = (await fetchMchGroupListShortApi()) ?? [];
  } finally {
    loading.value = false;
  }
}

function onChange(value: unknown) {
  const next =
    value == null || value === '' ? undefined : String(value);
  inner.value = next;
  emit('update:modelValue', next);
}

const selectStyle = computed(() => props.style ?? { width: '180px' });

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

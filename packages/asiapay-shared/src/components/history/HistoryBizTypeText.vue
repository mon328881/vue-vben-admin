<script lang="ts" setup>
import { computed } from 'vue';

import { bizTypeLabel } from '../../constants/biz-type';

const props = defineProps<{
  bizType?: null | number | string;
  options: { label: string; value: string }[];
}>();

const label = computed(() => bizTypeLabel(props.bizType, props.options));
</script>

<template>
  <span>{{ label }}</span>
</template>

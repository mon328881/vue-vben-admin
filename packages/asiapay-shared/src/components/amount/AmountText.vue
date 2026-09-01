<script lang="ts" setup>
import { computed } from 'vue';

import type { AmountDisplayKind } from '../../constants/amount-display';
import {
  amountCostClass,
  amountSignedClass,
  formatYuan,
  signedYuan,
} from '../../format/amount';

const props = defineProps<{
  value?: null | number;
  kind: AmountDisplayKind;
}>();

const text = computed(() => {
  if (props.kind === 'signed') return signedYuan(props.value);
  return formatYuan(props.value);
});

const className = computed(() => {
  if (props.kind === 'signed') return amountSignedClass(props.value);
  if (props.kind === 'cost') return amountCostClass();
  return '';
});
</script>

<template>
  <b :class="className">{{ text }}</b>
</template>

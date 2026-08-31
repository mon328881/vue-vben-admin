<script lang="ts" setup>
import { computed } from 'vue';

import type { PrepaidHistoryStat } from '#/api/modules/history';
import ListStatCards, {
  type ListStatCardItem,
} from '#/components/list/ListStatCards.vue';
import {
  formatExchangeRate,
  formatPrepaidQuantity,
  signedYuan,
} from '#/utils/format';

const props = defineProps<{
  stat: PrepaidHistoryStat;
}>();

const items = computed<ListStatCardItem[]>(() => {
  const s = props.stat ?? {};
  const uNet = s.totalUNet;
  let uNetDisplay: string | undefined;
  if (uNet == null) uNetDisplay = '—';
  else if (uNet === 0) uNetDisplay = '0.00';
  else uNetDisplay = signedYuan(uNet);

  const avg = s.avgRate;
  const avgDisplay = avg == null ? '—' : formatExchangeRate(avg);

  return [
    {
      title: '变更金额总计',
      value: Number(s.totalAmount ?? 0) / 100,
      decimals: 2,
      prefix: '¥',
      icon: 'lucide:wallet',
    },
    {
      title: 'U变更总数',
      display: formatPrepaidQuantity(s.totalUChange),
      icon: 'lucide:coins',
    },
    {
      title: 'U净总数',
      display: uNetDisplay,
      icon: 'lucide:scale',
    },
    {
      title: '平均费率',
      display: avgDisplay,
      icon: 'lucide:percent',
    },
  ];
});
</script>

<template>
  <ListStatCards :items="items" />
</template>

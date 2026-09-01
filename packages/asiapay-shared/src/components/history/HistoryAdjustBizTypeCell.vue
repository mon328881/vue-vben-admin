<script lang="ts" setup>
import { computed } from 'vue';

import { Tag } from 'ant-design-vue';

import HistoryBizTypeText from './HistoryBizTypeText.vue';

const props = withDefaults(
  defineProps<{
    /** 调账业务类型值：商户/代理为 3，通道为 5 */
    adjustBizType?: number;
    bizType?: null | number | string;
    createdLoginName?: null | string;
    createdUid?: null | number | string;
    options: { label: string; value: string }[];
  }>(),
  {
    adjustBizType: 3,
  },
);

const isAdjust = computed(
  () => Number(props.bizType) === Number(props.adjustBizType),
);

const loginName = computed(() => String(props.createdLoginName ?? '').trim());

/** uid=0 蓝（飞机），否则橙（系统） */
const tagColor = computed(() =>
  Number(props.createdUid) === 0 ? 'blue' : 'orange',
);
</script>

<template>
  <span v-if="isAdjust" class="history-adjust-biz">
    <span>调账</span>
    <Tag v-if="loginName" :color="tagColor" class="m-0">{{ loginName }}</Tag>
  </span>
  <HistoryBizTypeText v-else :biz-type="bizType" :options="options" />
</template>

<style scoped>
.history-adjust-biz {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
</style>

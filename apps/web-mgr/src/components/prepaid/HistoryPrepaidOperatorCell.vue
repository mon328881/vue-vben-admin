<script lang="ts" setup>
import { computed } from 'vue';

import { Tag } from 'ant-design-vue';

const props = defineProps<{
  createdLoginName?: null | string;
  createdUid?: null | number | string;
}>();

const isPlane = computed(() => Number(props.createdUid) === 0);
const loginName = computed(() => String(props.createdLoginName ?? ''));
</script>

<template>
  <span class="history-prepaid-operator">
    <span class="history-prepaid-operator__prefix">
      {{ isPlane ? '飞机:' : '系统:' }}
    </span>
    <Tag :color="isPlane ? 'blue' : 'orange'" class="m-0">
      {{ loginName || '—' }}
    </Tag>
  </span>
</template>

<style scoped>
.history-prepaid-operator {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.history-prepaid-operator__prefix {
  margin-right: 2px;
}
</style>

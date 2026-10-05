<script lang="ts" setup>
import { computed } from 'vue';

import { Tag } from 'ant-design-vue';

import { copyText } from '#/utils/copy';

defineOptions({ name: 'CellCopyStack' });

const props = defineProps<{
  payOrderId?: null | string;
  mchOrderNo?: null | string;
}>();

const payOrderIdText = computed(() =>
  props.payOrderId == null ? '' : String(props.payOrderId),
);
const mchOrderNoText = computed(() =>
  props.mchOrderNo == null ? '' : String(props.mchOrderNo),
);

async function copyPayOrderId() {
  if (payOrderIdText.value) await copyText(payOrderIdText.value, '支付单号');
}

async function copyMchOrderNo() {
  if (mchOrderNoText.value) await copyText(mchOrderNoText.value, '商户单号');
}
</script>

<template>
  <div class="cell-copy-stack">
    <div
      v-if="payOrderId !== undefined"
      class="cell-copy-stack__row"
      @click="copyPayOrderId"
    >
      <Tag color="processing" class="cell-copy-stack__tag">支付单号</Tag>
      <span class="cell-copy-stack__value" :title="payOrderIdText">
        {{ payOrderIdText || '—' }}
      </span>
    </div>
    <div
      v-if="mchOrderNo !== undefined"
      class="cell-copy-stack__row"
      @click="copyMchOrderNo"
    >
      <Tag color="warning" class="cell-copy-stack__tag">商户单号</Tag>
      <span class="cell-copy-stack__value" :title="mchOrderNoText">
        {{ mchOrderNoText || '—' }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.cell-copy-stack {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  width: 100%;
}

.cell-copy-stack__row {
  align-items: center;
  cursor: pointer;
  display: flex;
  flex-wrap: nowrap;
  gap: 4px;
  min-width: 0;
}

.cell-copy-stack__tag {
  flex-shrink: 0;
  margin-inline-end: 0;
}

.cell-copy-stack__value {
  flex: 1 1 auto;
  font-size: 12px;
  font-weight: 600;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

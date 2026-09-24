<script lang="ts" setup>
import { ref } from 'vue';

import { Modal, message } from 'ant-design-vue';

import { changePayOrderAmountApi } from '#/api';
import type { PayOrder } from '#/api/types/business';
import { payOrderStateLabel } from '#/constants/order';
import { formatYuan } from '#/utils/format';

const emit = defineEmits<{ success: [] }>();

const visible = ref(false);
const loading = ref(false);
const row = ref<PayOrder | null>(null);

function show(target: PayOrder) {
  row.value = target;
  visible.value = true;
}

async function submit() {
  if (!row.value?.payOrderId) return;
  loading.value = true;
  try {
    // 契约：路径金额仅做 long 解析，不参与逻辑；仅置 state=8（调额态），不改金额/不结算
    await changePayOrderAmountApi(row.value.payOrderId, 0);
    message.success('已置为调额状态');
    visible.value = false;
    row.value = null;
    emit('success');
  } finally {
    loading.value = false;
  }
}

defineExpose({ show });
</script>

<template>
  <Modal
    v-model:open="visible"
    title="订单调额"
    :confirm-loading="loading"
    ok-text="确定"
    cancel-text="取消"
    width="520px"
    destroy-on-close
    @ok="submit"
  >
    <div class="mb-3 space-y-1 text-sm text-gray-500">
      <p>1、此操作仅将订单置为「调额」状态（state=8），不修改订单金额。</p>
      <p>2、不会重新计算费用，也不会给商户发送回调。</p>
      <p class="text-red-500">3、请先核对订单信息后谨慎操作。</p>
    </div>
    <p class="mb-1">
      支付订单号：<b>{{ row?.payOrderId || '--' }}</b>
    </p>
    <p class="mb-1">
      当前状态：<b>{{ payOrderStateLabel(row?.state) }}</b>
    </p>
    <p>
      订单金额：<b>{{ formatYuan(row?.amount) }}</b>
    </p>
  </Modal>
</template>

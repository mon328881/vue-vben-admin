<script lang="ts" setup>
import { ref } from 'vue';

import { Form, InputNumber, Modal, message } from 'ant-design-vue';

import { changePayOrderAmountApi } from '#/api';
import type { PayOrder } from '#/api/types/business';
import { formatYuan } from '#/utils/format';

const emit = defineEmits<{ success: [] }>();

const visible = ref(false);
const loading = ref(false);
const amount = ref<number | undefined>(undefined);
const row = ref<PayOrder | null>(null);

function show(target: PayOrder) {
  row.value = target;
  amount.value = undefined;
  visible.value = true;
}

async function submit() {
  if (!row.value || amount.value == null) return;
  loading.value = true;
  try {
    await changePayOrderAmountApi(
      row.value.payOrderId,
      Math.round(amount.value * 100),
    );
    message.success('订单调额入账成功');
    visible.value = false;
    row.value = null;
    amount.value = undefined;
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
    title="订单调额入账"
    :confirm-loading="loading"
    ok-text="确定"
    cancel-text="取消"
    width="640px"
    @ok="submit"
  >
    <div class="mb-3 space-y-1 text-sm text-gray-500">
      <p>1、此操作为当用户支付金额与订单金额不一致时使用</p>
      <p>2、调整后的金额将自动以[调账]的方式入账对应商户、通道</p>
      <p class="text-red-500">
        3、此操作不会给商户发送回调！！！请注意通知商户
      </p>
      <p>4、如订单金额100元，用户支付了40元，下面输入框填40即可</p>
      <p>5、此操作将按[新金额]重新计算对应费用</p>
      <p>6、请先核对信息后谨慎操作</p>
    </div>
    <p class="mb-4">
      原订单金额：<b>{{ formatYuan(row?.amount) }}</b>
    </p>
    <Form layout="vertical">
      <Form.Item label="需要入账的金额">
        <InputNumber
          v-model:value="amount"
          :precision="2"
          :min="-999999999"
          :max="999999999"
          placeholder="请输入"
          style="width: 100%"
          addon-before="￥"
        />
      </Form.Item>
    </Form>
  </Modal>
</template>

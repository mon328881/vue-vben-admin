<script lang="ts" setup>
import { ref } from 'vue';

import { Form, Input, Modal, message } from 'ant-design-vue';

import {
  forcePayOrderSuccessApi,
  queryForcePayOrderKeyApi,
} from '#/api';

const emit = defineEmits<{ success: [] }>();

const visible = ref(false);
const loading = ref(false);
const payOrderId = ref('');
const code = ref('');

function confirm(targetId: string) {
  Modal.confirm({
    title: '确认强制补单？',
    content: '确认对该订单执行强制补单？',
    okText: '确认',
    cancelText: '取消',
    onOk: () => {
      void start(targetId);
    },
  });
}

async function start(targetId: string) {
  try {
    const data = await queryForcePayOrderKeyApi(targetId);
    if (data === 1) {
      await forcePayOrderSuccessApi(targetId, 1);
      message.success('强制补单成功');
      emit('success');
      return;
    }
    payOrderId.value = targetId;
    code.value =
      data && typeof data === 'object' && data.key ? String(data.key) : '';
    visible.value = true;
  } catch {
    payOrderId.value = targetId;
    code.value = '';
    visible.value = true;
  }
}

async function submit() {
  if (!code.value.trim()) {
    message.error('请输入验证码');
    return;
  }
  loading.value = true;
  try {
    await forcePayOrderSuccessApi(payOrderId.value, code.value.trim());
    message.success('强制补单成功');
    visible.value = false;
    payOrderId.value = '';
    code.value = '';
    emit('success');
  } finally {
    loading.value = false;
  }
}

defineExpose({ confirm });
</script>

<template>
  <Modal
    v-model:open="visible"
    title="强制补单"
    :confirm-loading="loading"
    ok-text="确定"
    cancel-text="取消"
    width="680px"
    @ok="submit"
  >
    <Form layout="vertical">
      <Form.Item label="验证码">
        <Input v-model:value="code" readonly />
      </Form.Item>
    </Form>
  </Modal>
</template>

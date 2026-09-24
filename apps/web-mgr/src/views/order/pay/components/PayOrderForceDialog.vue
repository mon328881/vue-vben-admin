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
    // 契约：data===1 表示用户级补单钥匙有效（10min），可跳过 TOTP；否则需输入谷歌验证码
    const data = await queryForcePayOrderKeyApi(targetId);
    if (data === 1) {
      await forcePayOrderSuccessApi(targetId, 1);
      message.success('强制补单成功');
      emit('success');
      return;
    }
  } catch {
    // 查钥匙失败时仍打开 TOTP 对话框，由 force 接口返回具体错误
  }
  payOrderId.value = targetId;
  code.value = '';
  visible.value = true;
}

async function submit() {
  const totp = code.value.trim();
  if (!/^\d{6}$/.test(totp)) {
    message.error('请输入 6 位谷歌验证码');
    return;
  }
  loading.value = true;
  try {
    await forcePayOrderSuccessApi(payOrderId.value, totp);
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
    width="480px"
    destroy-on-close
    @ok="submit"
  >
    <Form layout="vertical">
      <Form.Item label="谷歌验证码" required>
        <Input
          :value="code"
          :maxlength="6"
          inputmode="numeric"
          autocomplete="one-time-code"
          placeholder="请输入 6 位谷歌验证码"
          @update:value="
            (v) => (code = String(v ?? '').replace(/\D/g, '').slice(0, 6))
          "
        />
      </Form.Item>
    </Form>
  </Modal>
</template>

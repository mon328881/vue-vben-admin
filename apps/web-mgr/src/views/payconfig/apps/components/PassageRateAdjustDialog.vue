<script lang="ts" setup>
import { reactive, ref } from 'vue';

import { Form, InputNumber, Modal, message } from 'ant-design-vue';

import { updateMchAppApi, type PayPassage } from '#/api';

const emit = defineEmits<{ success: [] }>();

const visible = ref(false);
const saving = ref(false);
const row = ref<PayPassage | null>(null);
const form = reactive({ rate: undefined as number | undefined });

function show(target: PayPassage) {
  row.value = target;
  form.rate =
    target.rate != null
      ? Number((Number(target.rate) * 100).toFixed(2))
      : undefined;
  saving.value = false;
  visible.value = true;
}

async function submit() {
  if (!row.value?.payPassageId) return;
  if (form.rate === null || form.rate === undefined) {
    message.error('请输入通道费率（可为负，最多两位小数）');
    return;
  }
  const text = String(form.rate);
  if (!/^-?\d+(\.\d{1,2})?$/.test(text)) {
    message.error('费率格式错误（可为负，最多两位小数）');
    return;
  }
  saving.value = true;
  try {
    await updateMchAppApi(row.value.payPassageId, {
      payPassageId: row.value.payPassageId,
      rate: Number(form.rate || 0) / 100,
    });
    message.success('通道费率修改成功');
    visible.value = false;
    emit('success');
  } finally {
    saving.value = false;
  }
}

defineExpose({ show });
</script>

<template>
  <Modal
    v-model:open="visible"
    :title="
      row ? `设置通道[费率] - ${row.payPassageName}` : '设置通道[费率]'
    "
    width="600px"
    :confirm-loading="saving"
    ok-text="确定"
    cancel-text="取消"
    destroy-on-close
    @ok="submit"
  >
    <Form layout="vertical">
      <Form.Item label="通道号">{{ row?.payPassageId }}</Form.Item>
      <Form.Item label="通道名称">{{ row?.payPassageName }}</Form.Item>
      <Form.Item label="通道费率" required>
        <InputNumber
          v-model:value="form.rate"
          :min="-200"
          :max="200"
          :precision="2"
          :step="0.01"
          addon-after="%"
          style="width: 300px"
          placeholder="请输入通道费率"
        />
      </Form.Item>
    </Form>
  </Modal>
</template>

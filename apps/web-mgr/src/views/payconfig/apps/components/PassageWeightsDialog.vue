<script lang="ts" setup>
import { reactive, ref } from 'vue';

import { Form, InputNumber, Modal, message } from 'ant-design-vue';

import { updateMchAppApi, type PayPassage } from '#/api';

const emit = defineEmits<{ success: [] }>();

const visible = ref(false);
const saving = ref(false);
const row = ref<PayPassage | null>(null);
const form = reactive({ weightsNum: 1 });

function show(target: PayPassage) {
  row.value = target;
  form.weightsNum = Number(target.weights ?? 1) || 1;
  saving.value = false;
  visible.value = true;
}

async function submit() {
  if (!row.value?.payPassageId) return;
  const weights = Number(form.weightsNum);
  if (!Number.isInteger(weights) || weights < 1 || weights > 10000) {
    message.error('请输入 1-10000 的整数');
    return;
  }
  saving.value = true;
  try {
    await updateMchAppApi(row.value.payPassageId, { weights });
    message.success('修改成功');
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
    title="调整通道权重"
    width="500px"
    :confirm-loading="saving"
    ok-text="确定"
    cancel-text="取消"
    destroy-on-close
    @ok="submit"
  >
    <Form layout="vertical">
      <Form.Item label="通道号">{{ row?.payPassageId }}</Form.Item>
      <Form.Item label="通道名称">{{ row?.payPassageName }}</Form.Item>
      <Form.Item label="轮询权重">
        <InputNumber
          v-model:value="form.weightsNum"
          :min="1"
          :max="10000"
          :precision="0"
          :step="1"
          style="width: 300px"
          placeholder="1-10000 的整数"
        />
      </Form.Item>
    </Form>
  </Modal>
</template>

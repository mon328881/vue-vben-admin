<script lang="ts" setup>
import type { PayPassage } from '#/api';

import { reactive, ref } from 'vue';

import { Form, InputNumber, message, Modal } from 'ant-design-vue';

import { updateMchAppApi } from '#/api';

const emit = defineEmits<{ success: [] }>();

const visible = ref(false);
const saving = ref(false);
const row = ref<null | PayPassage>(null);
const form = reactive({ weightsNum: undefined as number | undefined });

function show(target: PayPassage) {
  row.value = target;
  // 对齐 demo：weights 非 null 才 Number()，null → 空输入框
  form.weightsNum =
    target.weights === null || target.weights === undefined
      ? undefined
      : Number(target.weights);
  saving.value = false;
  visible.value = true;
}

async function submit() {
  const value = form.weightsNum;
  if (value === null || value === undefined || !Number.isFinite(value)) {
    message.error('请输入轮询权重');
    return;
  }
  // 对齐 demo：Math.trunc 截断小数后判 1-10000（3.9 → 3 放行）
  const weights = Math.trunc(Number(value));
  if (weights < 1 || weights > 10_000) {
    message.error('请输入 1-10000 的整数');
    return;
  }
  const payPassageId = row.value?.payPassageId;
  if (payPassageId === null || payPassageId === undefined || !row.value) return;
  saving.value = true;
  try {
    await updateMchAppApi(payPassageId, { payPassageId, weights });
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

<script lang="ts" setup>
import type { PayPassage } from '#/api';

import { reactive, ref } from 'vue';

import { Form, InputNumber, message, Modal, Textarea } from 'ant-design-vue';

import { changeMchAppBalanceApi } from '#/api';

const emit = defineEmits<{ success: [] }>();

const visible = ref(false);
const saving = ref(false);
const row = ref<null | PayPassage>(null);
const form = reactive({
  changeAmount: undefined as number | undefined,
  changeRemark: '',
});

function show(target: PayPassage) {
  row.value = target;
  form.changeAmount = undefined;
  form.changeRemark = '';
  saving.value = false;
  visible.value = true;
}

async function submit() {
  if (!row.value?.payPassageId) {
    visible.value = false;
    return;
  }
  if (form.changeAmount === null || form.changeAmount === undefined) {
    message.error('请输入调整余额金额');
    return;
  }
  if (!form.changeRemark.trim()) {
    message.error('请输入调整备注');
    return;
  }
  if (form.changeRemark.trim().length > 128) {
    message.error('备注最多 128 个字符');
    return;
  }
  saving.value = true;
  try {
    await changeMchAppBalanceApi(row.value.payPassageId, {
      changeAmount: form.changeAmount,
      changeRemark: form.changeRemark.trim(),
    });
    message.success('余额调整成功');
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
    :title="row ? `调整通道[余额] - ${row.payPassageName}` : '调整通道[余额]'"
    width="600px"
    :confirm-loading="saving"
    ok-text="确定"
    cancel-text="取消"
    destroy-on-close
    @ok="submit"
  >
    <Form layout="vertical">
      <Form.Item label="通道号">
        <span class="font-semibold">{{ row?.payPassageId ?? '-' }}</span>
      </Form.Item>
      <Form.Item label="通道名称">
        <span class="font-semibold">{{ row?.payPassageName ?? '-' }}</span>
      </Form.Item>
      <Form.Item label="调整余额金额" required>
        <InputNumber
          v-model:value="form.changeAmount"
          :precision="2"
          :step="0.01"
          :min="-999999999"
          :max="999999999"
          style="width: 300px"
          placeholder="如需扣余额，则输入负数"
        />
      </Form.Item>
      <Form.Item label="备注" required>
        <Textarea
          v-model:value="form.changeRemark"
          :rows="3"
          :maxlength="128"
          show-count
          placeholder="请输入本次调整的原因说明（最多 128 字）"
        />
      </Form.Item>
    </Form>
  </Modal>
</template>

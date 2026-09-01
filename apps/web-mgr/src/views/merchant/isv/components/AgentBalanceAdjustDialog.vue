<script lang="ts" setup>
import { reactive, ref } from 'vue';

import { Form, InputNumber, Modal, Textarea, message } from 'ant-design-vue';

import { changeIsvBalanceApi } from '#/api';
import type { AgentInfo } from '#/api/types/business';

const emit = defineEmits<{ success: [] }>();

const visible = ref(false);
const saving = ref(false);
const row = ref<AgentInfo | null>(null);
const form = reactive({
  changeAmount: undefined as number | undefined,
  changeRemark: '',
});

function show(target: AgentInfo) {
  row.value = target;
  form.changeAmount = undefined;
  form.changeRemark = '';
  saving.value = false;
  visible.value = true;
}

async function submit() {
  if (!row.value?.agentNo) {
    visible.value = false;
    return;
  }
  if (form.changeAmount === null || form.changeAmount === undefined) {
    message.error('请输入调整余额金额');
    return;
  }
  if (!form.changeRemark || form.changeRemark.trim() === '') {
    message.error('请输入调整备注');
    return;
  }
  saving.value = true;
  try {
    await changeIsvBalanceApi(row.value.agentNo, {
      changeAmount: form.changeAmount,
      changeRemark: form.changeRemark.trim(),
    });
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
    title="调整代理商余额"
    :confirm-loading="saving"
    ok-text="确定"
    cancel-text="取消"
    width="600px"
    @ok="submit"
  >
    <Form layout="vertical">
      <Form.Item label="代理商户号">
        <span class="text-strong">{{ row?.agentNo ?? '-' }}</span>
      </Form.Item>
      <Form.Item label="代理商名称">
        <span class="text-strong">{{ row?.agentName ?? '-' }}</span>
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
          placeholder="请输入本次调整的原因说明"
        />
      </Form.Item>
    </Form>
  </Modal>
</template>

<style scoped>
.text-strong {
  font-weight: 600;
}
</style>

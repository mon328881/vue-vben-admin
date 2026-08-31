<script lang="ts" setup>
import { reactive, ref } from 'vue';

import { Form, InputNumber, Modal, Textarea, message } from 'ant-design-vue';

import { changeMchBalanceApi } from '#/api';
import type { MchInfo } from '#/api/types/business';

const emit = defineEmits<{ success: [] }>();

const visible = ref(false);
const saving = ref(false);
const row = ref<MchInfo | null>(null);
const form = reactive({
  changeAmount: undefined as number | undefined,
  changeRemark: '',
});

function show(target: MchInfo) {
  row.value = target;
  form.changeAmount = undefined;
  form.changeRemark = '';
  visible.value = true;
}

async function submit() {
  if (!row.value) return;
  if (form.changeAmount === null || form.changeAmount === undefined) {
    message.error('请输入调整余额金额');
    return;
  }
  if (!form.changeRemark.trim()) {
    message.error('请输入调整备注');
    return;
  }
  saving.value = true;
  try {
    await changeMchBalanceApi(row.value.mchNo, {
      changeAmount: form.changeAmount,
      changeRemark: form.changeRemark,
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
    :title="row ? `调整商户[余额] - ${row.mchName}` : '调整商户[余额]'"
    :confirm-loading="saving"
    ok-text="确定"
    cancel-text="取消"
    width="600px"
    destroy-on-close
    @ok="submit"
  >
    <Form layout="vertical">
      <Form.Item label="商户号">{{ row?.mchNo }}</Form.Item>
      <Form.Item label="商户名称">{{ row?.mchName }}</Form.Item>
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

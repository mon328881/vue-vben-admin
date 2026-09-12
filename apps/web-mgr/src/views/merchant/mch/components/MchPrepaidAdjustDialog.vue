<script lang="ts" setup>
import { reactive, ref } from 'vue';

import { Form, InputNumber, Modal, Textarea, message } from 'ant-design-vue';

import { changeMchPrepaidApi } from '#/api';
import type { MchInfo } from '#/api/types/business';

const emit = defineEmits<{ success: [] }>();

const visible = ref(false);
const saving = ref(false);
const row = ref<MchInfo | null>(null);
const form = reactive({
  changePrepaidAmount: undefined as number | undefined,
  changePrepaidRemark: '',
});

function show(target: MchInfo) {
  row.value = target;
  form.changePrepaidAmount = undefined;
  form.changePrepaidRemark = '';
  visible.value = true;
}

async function submit() {
  if (!row.value) return;
  if (
    form.changePrepaidAmount === null ||
    form.changePrepaidAmount === undefined
  ) {
    message.error('请输入调整预付金额');
    return;
  }
  // 线上契约：仅 null/空串拒绝，全空格备注原样提交
  if (form.changePrepaidRemark == null || form.changePrepaidRemark === '') {
    message.error('请输入调整备注');
    return;
  }
  saving.value = true;
  try {
    await changeMchPrepaidApi(row.value.mchNo, {
      changePrepaidAmount: form.changePrepaidAmount,
      changePrepaidRemark: form.changePrepaidRemark,
    });
    message.success('预付调整成功');
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
    :title="row ? `调整商户[预付] - ${row.mchName}` : '调整商户[预付]'"
    :confirm-loading="saving"
    centered
    ok-text="确定"
    cancel-text="取消"
    width="500px"
    destroy-on-close
    @ok="submit"
  >
    <Form layout="vertical">
      <Form.Item label="商户号">{{ row?.mchNo }}</Form.Item>
      <Form.Item label="商户名称">{{ row?.mchName }}</Form.Item>
      <Form.Item label="调整预付金额" required>
        <InputNumber
          v-model:value="form.changePrepaidAmount"
          :precision="2"
          :step="0.01"
          :min="-999999999"
          :max="999999999"
          style="width: 300px"
          placeholder="如需扣预付，则输入负数"
        />
      </Form.Item>
      <Form.Item label="备注" required>
        <Textarea
          v-model:value="form.changePrepaidRemark"
          :rows="3"
          placeholder="请输入本次调整的原因说明"
        />
      </Form.Item>
    </Form>
  </Modal>
</template>

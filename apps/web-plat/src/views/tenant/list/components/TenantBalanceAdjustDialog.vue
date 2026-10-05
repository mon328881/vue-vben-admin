<script lang="ts" setup>
import type { PlatTenant } from '#/api';

import { reactive, ref } from 'vue';

import { Form, InputNumber, message, Modal, Textarea } from 'ant-design-vue';

import { adjustTenantBalanceApi, formatTenantBalance } from '#/api';

const emit = defineEmits<{ success: [] }>();

const visible = ref(false);
const saving = ref(false);
const row = ref<null | PlatTenant>(null);
const form = reactive({
  changeAmount: undefined as number | undefined,
  changeRemark: '',
});

function show(target: PlatTenant) {
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
  if (form.changeRemark === '') {
    message.error('请输入调整备注');
    return;
  }
  saving.value = true;
  try {
    await adjustTenantBalanceApi({
      tenantId: row.value.tenantId,
      kind: 'adjust',
      amount: form.changeAmount,
      remark: form.changeRemark,
    });
    message.success('余额调整成功');
    visible.value = false;
    emit('success');
  } catch (error) {
    message.error(error instanceof Error ? error.message : '操作失败');
  } finally {
    saving.value = false;
  }
}

defineExpose({ show });
</script>

<template>
  <Modal
    v-model:open="visible"
    :title="row ? `调整运营端[余额] - ${row.tenantName}` : '调整运营端[余额]'"
    :confirm-loading="saving"
    centered
    ok-text="确定"
    cancel-text="取消"
    width="600px"
    destroy-on-close
    @ok="submit"
  >
    <Form layout="vertical">
      <Form.Item label="租户编码">{{ row?.tenantCode }}</Form.Item>
      <Form.Item label="运营端名称">{{ row?.tenantName }}</Form.Item>
      <Form.Item label="当前余额">
        {{ row ? formatTenantBalance(row) : '—' }}
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

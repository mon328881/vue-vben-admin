<script lang="ts" setup>
import { reactive, ref } from 'vue';

import { Form, InputNumber, Modal, Textarea, message } from 'ant-design-vue';

import { changePassageGroupPrepaidApi } from '#/api';
import type { PassageGroupInfo } from '#/api/modules/passage-group';

const emit = defineEmits<{ success: [] }>();

const visible = ref(false);
const saving = ref(false);
const row = ref<PassageGroupInfo | null>(null);
const form = reactive({
  changeAmount: undefined as number | undefined,
  changeRemark: '',
});

function show(target: PassageGroupInfo) {
  row.value = target;
  form.changeAmount = undefined;
  form.changeRemark = '';
  visible.value = true;
}

async function submit() {
  if (!row.value) return;
  if (form.changeAmount === null || form.changeAmount === undefined) {
    message.error('请输入调整预付金额');
    return;
  }
  if (!form.changeRemark.trim()) {
    message.error('请输入调整备注');
    return;
  }
  saving.value = true;
  try {
    await changePassageGroupPrepaidApi(row.value.passageGroupName, {
      changeAmount: form.changeAmount,
      changeRemark: form.changeRemark,
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
    title="调整供应商预付"
    :confirm-loading="saving"
    ok-text="确定"
    cancel-text="取消"
    width="520px"
    destroy-on-close
    @ok="submit"
  >
    <Form layout="vertical">
      <Form.Item label="供应商名称">
        <span class="font-semibold text-blue-600">
          {{ row?.passageGroupName }}
        </span>
      </Form.Item>
      <Form.Item label="调整预付金额" required>
        <InputNumber
          v-model:value="form.changeAmount"
          :precision="2"
          :step="0.01"
          :min="-999999999"
          :max="999999999"
          style="width: 300px"
          placeholder="如需扣预付，则输入负数，例如 -10.50"
        />
      </Form.Item>
      <Form.Item label="备注" required>
        <Textarea
          v-model:value="form.changeRemark"
          :rows="3"
          placeholder="请输入本次调整原因说明"
        />
      </Form.Item>
    </Form>
  </Modal>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue';

import {
  Form,
  InputNumber,
  Modal,
  Radio,
  message,
} from 'ant-design-vue';

import { updatePassageGroupApi, type PassageGroupInfo } from '#/api';

const emit = defineEmits<{ success: [] }>();

const visible = ref(false);
const saving = ref(false);
const row = ref<PassageGroupInfo | null>(null);
const form = reactive({
  quotaLimitState: 0,
  quotaNum: 0,
  prepaidWarnAmount: 0,
  prepaidLowState: 0,
  canThirdNotify: 0,
});

function show(target: PassageGroupInfo) {
  row.value = target;
  form.quotaLimitState = target.quotaLimitState ?? 0;
  const quotaCent = Number(target.quota ?? target.creditAmount ?? 0);
  form.quotaNum = Number((quotaCent / 100).toFixed(2));
  form.prepaidWarnAmount = target.prepaidWarnAmount ?? 0;
  form.prepaidLowState = target.prepaidLowState ?? 0;
  form.canThirdNotify = target.canThirdNotify ?? 0;
  visible.value = true;
}

async function submit() {
  if (!row.value) return;
  saving.value = true;
  try {
    await updatePassageGroupApi(row.value.passageGroupName, {
      passageGroupName: row.value.passageGroupName,
      quotaLimitState: form.quotaLimitState,
      quota: form.quotaNum * 100,
      prepaidLowState: form.prepaidLowState,
      canThirdNotify: form.canThirdNotify,
      prepaidWarnAmount: form.prepaidWarnAmount,
    });
    message.success('修改成功');
    visible.value = false;
    emit('success');
  } catch (error) {
    message.error(error instanceof Error ? error.message : '修改失败');
  } finally {
    saving.value = false;
  }
}

defineExpose({ show });
</script>

<template>
  <Modal
    v-model:open="visible"
    title="设置供应商授信"
    :confirm-loading="saving"
    ok-text="确定"
    cancel-text="取消"
    width="680px"
    destroy-on-close
    @ok="submit"
  >
    <Form layout="vertical">
      <Form.Item label="供应商名称">
        <span class="font-semibold text-primary">
          {{ row?.passageGroupName }}
        </span>
      </Form.Item>
      <Form.Item label="授信启用状态">
        <Radio.Group v-model:value="form.quotaLimitState">
          <Radio :value="1">启用</Radio>
          <Radio :value="0">禁用</Radio>
        </Radio.Group>
      </Form.Item>
      <Form.Item label="授信额度">
        <InputNumber
          v-model:value="form.quotaNum"
          :precision="2"
          :step="0.01"
          :min="-999999999"
          :max="999999999"
          style="width: 300px"
          :disabled="form.quotaLimitState !== 1"
        />
      </Form.Item>
      <p class="hint-text">
        [当前余额]大于[当前预付+授信额度]时将自动发送预。（剩余预付接近授信的
        20% 开始预警）
      </p>
      <Form.Item v-if="form.quotaLimitState === 1" label="授信不足禁拉单">
        <Radio.Group v-model:value="form.prepaidLowState">
          <Radio :value="1">启用</Radio>
          <Radio :value="0">禁用</Radio>
        </Radio.Group>
      </Form.Item>
      <Form.Item v-if="form.quotaLimitState === 1" label="授信不足禁回调">
        <Radio.Group v-model:value="form.canThirdNotify">
          <Radio :value="1">启用</Radio>
          <Radio :value="0">禁用</Radio>
        </Radio.Group>
      </Form.Item>
    </Form>
  </Modal>
</template>

<style scoped>
.hint-text {
  margin: 0 0 16px;
  color: hsl(var(--muted-foreground));
  font-size: 12px;
  line-height: 1.6;
}
</style>

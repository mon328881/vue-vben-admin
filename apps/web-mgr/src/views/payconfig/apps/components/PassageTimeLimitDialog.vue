<script lang="ts" setup>
import { reactive, ref } from 'vue';

import {
  Alert,
  Button,
  Form,
  Modal,
  Radio,
  Space,
  TimePicker,
  message,
} from 'ant-design-vue';

import { updateMchAppApi, type PayPassage } from '#/api';

const emit = defineEmits<{ success: [] }>();

const visible = ref(false);
const saving = ref(false);
const row = ref<PayPassage | null>(null);
const form = reactive({ timeLimit: 0, start: '', end: '' });

function show(target: PayPassage) {
  row.value = target;
  form.timeLimit = target.timeLimit === 1 ? 1 : 0;
  const rules = String(target.timeRules ?? '');
  const [start, end] = rules.includes('|') ? rules.split('|') : ['', ''];
  form.start = start?.trim() ?? '';
  form.end = end?.trim() ?? '';
  saving.value = false;
  visible.value = true;
}

async function submit() {
  if (!row.value?.payPassageId) return;
  saving.value = true;
  try {
    await updateMchAppApi(row.value.payPassageId, {
      timeLimit: form.timeLimit,
      timeRules: form.timeLimit === 1 ? `${form.start}|${form.end}` : '',
    });
    message.success('修改成功');
    visible.value = false;
    emit('success');
  } finally {
    saving.value = false;
  }
}

function clearLimit() {
  Modal.confirm({
    title: '确认清除定时并关闭定时开关？',
    okText: '确定',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      if (!row.value?.payPassageId) return;
      await updateMchAppApi(row.value.payPassageId, {
        timeLimit: 0,
        timeRules: '',
      });
      message.success('修改成功');
      visible.value = false;
      emit('success');
    },
  });
}

defineExpose({ show });
</script>

<template>
  <Modal
    v-model:open="visible"
    title="通道定时开启设置"
    width="520px"
    destroy-on-close
    :footer="null"
  >
    <Alert
      type="info"
      show-icon
      class="mb-3"
      message="设置可用时间段，例如 08:00–23:00；23:00–07:00 表示跨天时段。"
    />
    <Form layout="vertical">
      <Form.Item label="通道定时开关">
        <Radio.Group v-model:value="form.timeLimit">
          <Radio :value="1">启用</Radio>
          <Radio :value="0">禁用</Radio>
        </Radio.Group>
      </Form.Item>
      <Form.Item label="开启时间">
        <TimePicker
          v-model:value="form.start"
          format="HH:mm"
          value-format="HH:mm"
          placeholder="例如 08:00"
          allow-clear
          :disabled="form.timeLimit !== 1"
          style="width: 100%"
        />
      </Form.Item>
      <Form.Item label="关闭时间">
        <TimePicker
          v-model:value="form.end"
          format="HH:mm"
          value-format="HH:mm"
          placeholder="例如 23:00"
          allow-clear
          :disabled="form.timeLimit !== 1"
          style="width: 100%"
        />
      </Form.Item>
    </Form>
    <div class="flex justify-between">
      <Button danger ghost @click="clearLimit">清除定时</Button>
      <Space>
        <Button @click="visible = false">取消</Button>
        <Button type="primary" :loading="saving" @click="submit">确定</Button>
      </Space>
    </div>
  </Modal>
</template>

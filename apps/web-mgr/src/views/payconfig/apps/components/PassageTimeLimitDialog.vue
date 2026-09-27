<script lang="ts" setup>
import type { PayPassage } from '#/api';

import { reactive, ref } from 'vue';

import {
  Alert,
  Button,
  Form,
  message,
  Modal,
  Radio,
  Space,
  TimePicker,
} from 'ant-design-vue';

import { updateMchAppApi } from '#/api';

const emit = defineEmits<{ success: [] }>();

const visible = ref(false);
const saving = ref(false);
const row = ref<null | PayPassage>(null);
/** 后端 timeRules 原样落库；未编辑时回写原始串，避免 trim 改写历史值 */
const rawTimeRules = ref('');
const initialDisplay = reactive({ timeLimit: 0, start: '', end: '' });
const form = reactive({ timeLimit: 0, start: '', end: '' });

function show(target: PayPassage) {
  row.value = target;
  form.timeLimit = target.timeLimit === 1 ? 1 : 0;
  rawTimeRules.value = String(target.timeRules ?? '');
  const [start, end] = rawTimeRules.value.includes('|')
    ? rawTimeRules.value.split('|')
    : ['', ''];
  // TimePicker 需要干净 HH:mm；展示用 trim，提交未改动时仍用 rawTimeRules
  form.start = start?.trim() ?? '';
  form.end = end?.trim() ?? '';
  initialDisplay.timeLimit = form.timeLimit;
  initialDisplay.start = form.start;
  initialDisplay.end = form.end;
  saving.value = false;
  visible.value = true;
}

function isEdited() {
  return (
    form.timeLimit !== initialDisplay.timeLimit ||
    form.start !== initialDisplay.start ||
    form.end !== initialDisplay.end
  );
}

async function submit() {
  if (!row.value?.payPassageId) return;
  if (form.timeLimit === 1) {
    if (!form.start || !form.end) {
      message.error('请选择开启、关闭时间');
      return;
    }
    if (form.start === form.end) {
      message.error('开启、关闭时间不能相同');
      return;
    }
  }
  let timeRules = '';
  if (form.timeLimit === 1) {
    timeRules = isEdited() ? `${form.start}|${form.end}` : rawTimeRules.value;
  }
  saving.value = true;
  try {
    await updateMchAppApi(row.value.payPassageId, {
      timeLimit: form.timeLimit,
      timeRules,
    });
    message.success('修改成功');
    visible.value = false;
    emit('success');
  } finally {
    saving.value = false;
  }
}

async function clearLimit() {
  const payPassageId = row.value?.payPassageId;
  if (!payPassageId) return;
  visible.value = false;
  try {
    await updateMchAppApi(payPassageId, {
      timeLimit: 0,
      timeRules: '',
    });
    message.success('修改成功');
    emit('success');
  } catch {
    // demo catch{} 静默
  }
}

defineExpose({ show });
</script>

<template>
  <Modal
    v-model:open="visible"
    title="通道定时开启设置"
    width="520px"
    destroy-on-close
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
    <template #footer>
      <div class="flex items-center justify-between w-full">
        <Popconfirm
          title="确认后将清除定时设置并关闭定时开关"
          ok-text="确定"
          cancel-text="取消"
          @confirm="clearLimit"
        >
          <Button danger ghost>清除定时</Button>
        </Popconfirm>
        <Space>
          <Button @click="visible = false">取消</Button>
          <Button type="primary" :loading="saving" @click="submit">确定</Button>
        </Space>
      </div>
    </template>
  </Modal>
</template>

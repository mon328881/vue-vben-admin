<script lang="ts" setup>
import { reactive, ref } from 'vue';

import {
  Alert,
  Form,
  Input,
  Modal,
  Radio,
  TimePicker,
  message,
} from 'ant-design-vue';

import { setPassageAutoCleanApi, type PassageStatInfo } from '#/api';
import { GOOGLE_CODE_ERROR, isGoogleCode } from '#/constants/merchant';

const props = withDefaults(
  defineProps<{
    message?: string;
  }>(),
  {
    message:
      '开启后每天定时自动清空所有通道余额（北京时间）。绑定了供应商的通道将自动结算一次。',
  },
);

const emit = defineEmits<{ success: [PassageStatInfo] }>();

const visible = ref(false);
const saving = ref(false);
const google = ref('');
const form = reactive({ enable: 0, time: '00:00' });

function show(stat: PassageStatInfo) {
  google.value = '';
  form.enable = stat.payPassageAutoClean === 1 ? 1 : 0;
  form.time =
    stat.payPassageAutoCleanTime &&
    stat.payPassageAutoCleanTime !== '--:--'
      ? stat.payPassageAutoCleanTime
      : '00:00';
  visible.value = true;
}

async function submit() {
  if (!isGoogleCode(google.value)) {
    message.error(GOOGLE_CODE_ERROR);
    return;
  }
  if (form.enable === 1 && !form.time) {
    message.error('请选择执行时间');
    return;
  }
  saving.value = true;
  try {
    const info = await setPassageAutoCleanApi({
      googleCode: google.value.trim(),
      autoCleanEnable: form.enable,
      time: form.enable === 1 ? form.time : '',
    });
    message.success('设置成功');
    visible.value = false;
    if (info) emit('success', info);
  } finally {
    saving.value = false;
  }
}

defineExpose({ show });
</script>

<template>
  <Modal
    v-model:open="visible"
    title="设置通道自动日切清零"
    width="640px"
    :confirm-loading="saving"
    ok-text="确定"
    cancel-text="取消"
    destroy-on-close
    @ok="submit"
  >
    <Form layout="vertical">
      <Form.Item label="说明">
        <Alert type="warning" show-icon :message="props.message" />
      </Form.Item>
      <Form.Item label="自动日切开关">
        <Radio.Group v-model:value="form.enable">
          <Radio :value="1">启用</Radio>
          <Radio :value="0">禁用</Radio>
        </Radio.Group>
      </Form.Item>
      <Form.Item label="执行时间">
        <TimePicker
          v-model:value="form.time"
          format="HH:mm"
          value-format="HH:mm"
          placeholder="时间"
          :disabled="form.enable !== 1"
          style="width: 100%"
        />
      </Form.Item>
      <Form.Item label="谷歌验证码" required>
        <Input
          v-model:value="google"
          :maxlength="6"
          inputmode="numeric"
          autocomplete="one-time-code"
          placeholder="请输入 6 位数字验证码"
          @update:value="
            (v) => (google = String(v ?? '').replace(/\D/g, '').slice(0, 6))
          "
        />
      </Form.Item>
    </Form>
  </Modal>
</template>

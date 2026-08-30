<script lang="ts" setup>
import { ref } from 'vue';

import {
  Alert,
  Form,
  Input,
  Modal,
  Radio,
  TimePicker,
  message,
} from 'ant-design-vue';

import {
  fetchAutoSettleInfoApi,
  setMchAutoSettleApi,
  type MchAutoSettleInfo,
} from '#/api';
import { GOOGLE_CODE_ERROR, isGoogleCode } from '#/constants/merchant';

const emit = defineEmits<{ success: [MchAutoSettleInfo] }>();

const visible = ref(false);
const saving = ref(false);
const enable = ref(0);
const time = ref<string>('');
const google = ref('');

async function show() {
  google.value = '';
  const info = await fetchAutoSettleInfoApi();
  enable.value = info?.mchAutoSettle ?? 0;
  time.value = info?.mchAutoSettleTime || '';
  visible.value = true;
}

async function submit() {
  if (enable.value === 1 && !time.value) {
    message.error('请选择时间');
    return;
  }
  if (!isGoogleCode(google.value)) {
    message.error(GOOGLE_CODE_ERROR);
    return;
  }
  saving.value = true;
  try {
    const info = await setMchAutoSettleApi({
      autoSettleEnable: enable.value,
      time: enable.value === 1 ? time.value : '',
      googleCode: google.value,
    });
    visible.value = false;
    google.value = '';
    emit('success', info ?? { mchAutoSettle: enable.value, mchAutoSettleTime: time.value });
  } finally {
    saving.value = false;
  }
}

defineExpose({ show });
</script>

<template>
  <Modal
    v-model:open="visible"
    title="设置商户自动日切结算"
    width="480px"
    :confirm-loading="saving"
    ok-text="确定"
    cancel-text="取消"
    destroy-on-close
    @ok="submit"
  >
    <Form layout="vertical">
      <Form.Item label="自动日切说明">
        <Alert
          type="warning"
          show-icon
          message="开启后每天在指定时间自动对全部商户进行结算，请谨慎操作。"
        />
      </Form.Item>
      <Form.Item label="开关">
        <Radio.Group v-model:value="enable">
          <Radio :value="1">启用</Radio>
          <Radio :value="0">禁用</Radio>
        </Radio.Group>
      </Form.Item>
      <Form.Item label="时间设置">
        <TimePicker
          v-model:value="time"
          format="HH:mm"
          value-format="HH:mm"
          placeholder="请选择结算时间"
          :disabled="enable !== 1"
          style="width: 100%"
        />
      </Form.Item>
      <Form.Item label="谷歌验证码" required>
        <Input
          v-model:value="google"
          :maxlength="6"
          placeholder="请输入谷歌验证码"
        />
      </Form.Item>
    </Form>
  </Modal>
</template>

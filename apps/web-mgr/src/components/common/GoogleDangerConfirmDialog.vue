<script lang="ts" setup>
import { ref, watch } from 'vue';

import { Alert, Form, Input, Modal, message } from 'ant-design-vue';

import { GOOGLE_CODE_ERROR, isGoogleCode } from '#/constants/merchant';

const props = defineProps<{
  open: boolean;
  header: string;
  warning: string;
  saving?: boolean;
}>();

const emit = defineEmits<{
  'update:open': [boolean];
  confirm: [string];
}>();

const google = ref('');

watch(
  () => props.open,
  (open) => {
    if (!open) google.value = '';
  },
);

function submit() {
  if (!isGoogleCode(google.value)) {
    message.error(GOOGLE_CODE_ERROR);
    return;
  }
  emit('confirm', google.value);
}
</script>

<template>
  <Modal
    :open="open"
    :title="header"
    :confirm-loading="!!saving"
    ok-text="确定"
    ok-type="danger"
    cancel-text="取消"
    destroy-on-close
    @update:open="emit('update:open', $event)"
    @ok="submit"
  >
    <Form layout="vertical">
      <Form.Item label="说明">
        <Alert type="warning" show-icon :message="warning" />
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

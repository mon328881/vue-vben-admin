<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { Input, Spin } from 'ant-design-vue';

import { getVercodeApi } from '#/api';
import {
  registerLoginCaptchaReload,
  setLoginCaptchaToken,
} from '#/api/helper/captcha-session';

defineOptions({ name: 'CaptchaInput' });

const modelValue = defineModel<string>({ default: '' });

const props = defineProps<{
  maxlength?: number;
  placeholder?: string;
}>();

const loading = ref(false);
const imageBase64 = ref('');
const remain = ref(0);
const codeLength = computed(() => props.maxlength ?? 6);
let timer: null | ReturnType<typeof setInterval> = null;

function stopTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function startTimer(seconds: number) {
  stopTimer();
  remain.value = seconds;
  timer = setInterval(() => {
    remain.value -= 1;
    if (remain.value <= 0) {
      stopTimer();
    }
  }, 1000);
}

async function loadVercode() {
  if (loading.value) return;
  loading.value = true;
  try {
    const data = await getVercodeApi();
    imageBase64.value = data.imageBase64Data;
    setLoginCaptchaToken(data.vercodeToken);
    startTimer(Number(data.expireTime || 60));
    modelValue.value = '';
  } catch {
    imageBase64.value = '';
    setLoginCaptchaToken('');
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  registerLoginCaptchaReload(loadVercode);
  void loadVercode();
});

onUnmounted(() => {
  stopTimer();
  registerLoginCaptchaReload(async () => {});
});

defineExpose({ reload: loadVercode });
</script>

<template>
  <div class="flex w-full items-center gap-2">
    <Input
      v-model:value="modelValue"
      class="flex-1"
      :maxlength="codeLength"
      :placeholder="placeholder || `请输入${codeLength}位验证码`"
      allow-clear
    />
    <Spin :spinning="loading">
      <button
        class="border-border bg-accent relative h-9 w-[110px] shrink-0 overflow-hidden rounded border"
        type="button"
        title="点击刷新验证码"
        @click="loadVercode"
      >
        <img
          v-if="imageBase64"
          :src="imageBase64"
          alt="captcha"
          class="h-full w-full object-cover"
        />
        <span
          v-else
          class="text-muted-foreground flex h-full items-center justify-center text-xs"
        >
          <IconifyIcon icon="ant-design:reload-outlined" />
        </span>
        <span
          v-if="remain > 0"
          class="bg-background/70 absolute right-0.5 bottom-0.5 rounded px-1 text-[10px] leading-none"
        >
          {{ remain }}s
        </span>
      </button>
    </Spin>
  </div>
</template>

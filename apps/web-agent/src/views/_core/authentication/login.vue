<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

import { computed, markRaw } from 'vue';

import { AuthenticationLogin, z } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { message } from 'ant-design-vue';

import {
  loginCaptchaSession,
  reloadLoginCaptcha,
} from '#/api/helper/captcha-session';
import { useAuthStore } from '#/store';

import CaptchaInput from './captcha-input.vue';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.usernameTip'),
      },
      defaultValue: 'demoagent',
      fieldName: 'username',
      label: $t('authentication.username'),
      rules: z.string().min(1, { message: $t('authentication.usernameTip') }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('authentication.password'),
      },
      defaultValue: '123456',
      fieldName: 'password',
      label: $t('authentication.password'),
      rules: z.string().min(1, { message: $t('authentication.passwordTip') }),
    },
    {
      component: markRaw(CaptchaInput),
      componentProps: {
        maxlength: 4,
        placeholder: '请输入4位验证码',
      },
      fieldName: 'vercode',
      label: '验证码',
      rules: z
        .string()
        .min(1, { message: '请输入验证码' })
        .regex(/^\d{4}$/, { message: '验证码必须为4位数字' }),
    },
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: '谷歌验证码（可选）',
      },
      fieldName: 'google',
      label: '谷歌验证码',
      rules: z.string().optional(),
    },
  ];
});

async function handleLogin(values: Record<string, any>) {
  if (!loginCaptchaSession.token) {
    message.error('验证码无效，请点击验证码刷新');
    await reloadLoginCaptcha();
    return;
  }
  try {
    await authStore.authLogin({
      ...values,
      vercodeToken: loginCaptchaSession.token,
    });
  } catch {
    await reloadLoginCaptcha();
  }
}
</script>

<template>
  <AuthenticationLogin
    :form-schema="formSchema"
    :loading="authStore.loginLoading"
    :show-code-login="false"
    :show-forget-password="false"
    :show-qrcode-login="false"
    :show-register="false"
    :show-third-party-login="false"
    title="亚洲支付 · 代理端"
    sub-title="请使用代理账号登录"
    @submit="handleLogin"
  />
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Radio,
  Tabs,
  message,
} from 'ant-design-vue';

import {
  fetchGoogleKeyApi,
  modifyPwdApi,
  updateProfileApi,
} from '#/api';
import { fetchCurrentUserApi } from '#/api/core/user';
import { useAuthStore } from '#/store';

defineOptions({ name: 'UserInfoPage' });

const userStore = useUserStore();
const authStore = useAuthStore();
const saving = ref(false);
const profileSaving = ref(false);
const activeTab = ref('basic');

const googleAuth = ref(0);
const initialGoogleAuth = ref(0);
const googleKey = ref<{ key?: string; qrCode?: string }>({});
const googleCode = ref('');

const pwdForm = reactive({
  originalPwd: '',
  newPwd: '',
  confirmPwd: '',
});

const googleAuthChanged = computed(
  () => googleAuth.value !== initialGoogleAuth.value,
);

async function loadProfile() {
  const user = await fetchCurrentUserApi(true);
  initialGoogleAuth.value = user.googleAuth ?? 0;
  googleAuth.value = user.googleAuth ?? 0;
}

async function onGoogleAuthChange(val: number) {
  googleCode.value = '';
  if (val === 1 && initialGoogleAuth.value === 0) {
    try {
      googleKey.value = (await fetchGoogleKeyApi()) ?? {};
    } catch (error) {
      message.error(error instanceof Error ? error.message : '获取谷歌密钥失败');
      googleAuth.value = initialGoogleAuth.value;
    }
  } else {
    googleKey.value = {};
  }
}

watch(googleAuth, (val, oldVal) => {
  if (val !== oldVal) void onGoogleAuthChange(val);
});

async function saveProfile() {
  if (!googleAuthChanged.value) return;
  profileSaving.value = true;
  try {
    await updateProfileApi({
      googleAuth: googleAuth.value,
      googleCode: googleAuth.value === 1 ? googleCode.value.trim() : undefined,
      googleKey: googleAuth.value === 1 ? googleKey.value.key : undefined,
      loginUsername: userStore.userInfo?.username,
      sysUserId: Number(userStore.userInfo?.userId),
    });
    message.success('修改成功');
    await authStore.fetchUserInfo();
    await loadProfile();
    googleCode.value = '';
    googleKey.value = {};
  } catch (error) {
    message.error(error instanceof Error ? error.message : '更新失败');
  } finally {
    profileSaving.value = false;
  }
}

function confirmProfile() {
  Modal.confirm({
    title: '确认更新信息',
    content: '确认更新信息吗？',
    okText: '确认',
    cancelText: '取消',
    onOk: () => saveProfile(),
  });
}

function resetPwd() {
  pwdForm.originalPwd = '';
  pwdForm.newPwd = '';
  pwdForm.confirmPwd = '';
}

async function savePwd() {
  if (!pwdForm.originalPwd) {
    message.error('请输入原密码');
    return;
  }
  if (!pwdForm.newPwd) {
    message.error('请输入新密码');
    return;
  }
  if (pwdForm.newPwd.length < 6 || pwdForm.newPwd.length > 12) {
    message.error('新密码长度为 6-12 位');
    return;
  }
  if (pwdForm.newPwd !== pwdForm.confirmPwd) {
    message.error('新密码与确认密码不一致');
    return;
  }
  const recordId = Number(userStore.userInfo?.userId);
  if (!recordId) {
    message.error('无法获取用户 ID，请重新登录');
    return;
  }
  saving.value = true;
  try {
    await modifyPwdApi({
      recordId,
      originalPwd: pwdForm.originalPwd,
      confirmPwd: pwdForm.confirmPwd,
    });
    message.success('修改成功');
    await authStore.logout();
  } finally {
    saving.value = false;
  }
}

function confirmSave() {
  Modal.confirm({
    title: '确认更新密码',
    content: '确认更新密码吗？更新成功后需使用新密码重新登录。',
    okText: '确认',
    cancelText: '取消',
    onOk: () => savePwd(),
  });
}

onMounted(() => {
  void loadProfile();
});
</script>

<template>
  <Page auto-content-height title="个人中心">
    <Card class="max-w-2xl">
      <Tabs
        v-model:active-key="activeTab"
        @change="
          () => {
            resetPwd();
          }
        "
      >
        <Tabs.TabPane key="basic" tab="基本信息">
          <Form
            class="mt-2 max-w-xl"
            :label-col="{ span: 6 }"
            :wrapper-col="{ span: 16 }"
          >
            <Form.Item label="用户登录名">
              <Input :value="userStore.userInfo?.username" disabled />
            </Form.Item>
            <Form.Item label="开启谷歌验证">
              <Radio.Group v-model:value="googleAuth">
                <Radio :value="1">启用</Radio>
                <Radio :value="0">禁用</Radio>
              </Radio.Group>
            </Form.Item>
            <template v-if="googleAuth === 1 && initialGoogleAuth === 0">
              <Form.Item label="谷歌二维码">
                <div class="qr-box">
                  <p class="tip">请使用 Google 验证器扫描</p>
                  <div class="secret-box">{{ googleKey.key || '—' }}</div>
                  <p class="tip small">otpauth 链接：</p>
                  <div class="secret-box small">{{ googleKey.qrCode || '—' }}</div>
                </div>
              </Form.Item>
              <Form.Item label="Google验证码">
                <Input
                  v-model:value="googleCode"
                  :maxlength="6"
                  placeholder="扫码后请在下方输入 6 位动态验证码"
                />
              </Form.Item>
            </template>
            <Form.Item :wrapper-col="{ offset: 6, span: 16 }">
              <Button
                type="primary"
                :disabled="!googleAuthChanged"
                :loading="profileSaving"
                @click="confirmProfile"
              >
                确认更新
              </Button>
            </Form.Item>
          </Form>
        </Tabs.TabPane>

        <Tabs.TabPane key="pwd" tab="密码设置">
          <Form
            class="mt-2 max-w-xl"
            :label-col="{ span: 6 }"
            :wrapper-col="{ span: 16 }"
            @finish="confirmSave"
          >
            <Form.Item label="用户登录名">
              <Input :value="userStore.userInfo?.username" disabled />
            </Form.Item>
            <Form.Item label="原密码">
              <Input.Password
                v-model:value="pwdForm.originalPwd"
                allow-clear
                autocomplete="current-password"
                placeholder="请输入原密码"
              />
            </Form.Item>
            <Form.Item label="新密码">
              <Input.Password
                v-model:value="pwdForm.newPwd"
                allow-clear
                autocomplete="new-password"
                placeholder="请输入新密码（6-12 位）"
              />
            </Form.Item>
            <Form.Item label="确认新密码">
              <Input.Password
                v-model:value="pwdForm.confirmPwd"
                allow-clear
                autocomplete="new-password"
                placeholder="请再次输入新密码"
              />
            </Form.Item>
            <Form.Item :wrapper-col="{ offset: 6, span: 16 }">
              <Button html-type="submit" type="primary" :loading="saving">
                更新密码
              </Button>
            </Form.Item>
          </Form>
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
</template>

<style scoped>
.secret-box {
  background: hsl(var(--muted));
  border-radius: 6px;
  font-family: monospace;
  font-size: 14px;
  padding: 8px 12px;
  word-break: break-all;
}

.secret-box.small {
  font-size: 11px;
}

.qr-box {
  width: 100%;
}

.tip {
  color: hsl(var(--muted-foreground));
  font-size: 13px;
  margin: 0 0 6px;
}

.tip.small {
  font-size: 12px;
  margin-top: 10px;
}
</style>

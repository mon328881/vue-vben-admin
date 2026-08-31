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
  Space,
  Tabs,
  Tag,
  message,
} from 'ant-design-vue';

import { useQRCode } from '@vueuse/integrations/useQRCode';

import { bindGoogleApi, fetchGoogleKeyApi, modifyPasswordApi } from '#/api';
import { fetchCurrentUserApi } from '#/api/core/user';
import type { CurrentUser } from '#/api/types';
import { useAuthStore } from '#/store';

defineOptions({ name: 'AgentUserInfoPage' });

const userStore = useUserStore();
const authStore = useAuthStore();
const activeTab = ref('basic');
const currentUser = ref<CurrentUser | null>(null);

const pwdSaving = ref(false);
const pwdForm = reactive({
  originalPwd: '',
  newPwd: '',
});

const googleModalOpen = ref(false);
const googleKeyData = ref<{ key?: string; qrCode?: string }>({});
const googleOtpauth = ref('');
const googleCode = ref('');
const googleBinding = ref(false);
const googleKeyLoading = ref(false);

const googleEnabled = computed(() => (currentUser.value?.googleAuth ?? 0) === 1);
const googleQrSrc = useQRCode(googleOtpauth, {
  errorCorrectionLevel: 'H',
  margin: 1,
  width: 168,
});

async function loadProfile() {
  try {
    currentUser.value = await fetchCurrentUserApi(true);
  } catch (error) {
    console.error(error);
  }
}

function resetPwd() {
  pwdForm.originalPwd = '';
  pwdForm.newPwd = '';
}

async function savePwd() {
  if (!pwdForm.originalPwd || !pwdForm.newPwd) {
    message.warning('请输入完整');
    return;
  }
  if (pwdForm.newPwd.length < 6 || pwdForm.newPwd.length > 12) {
    message.error('新密码长度为 6-12 位');
    return;
  }
  const recordId = Number(userStore.userInfo?.userId);
  if (!recordId) {
    message.error('无法获取用户 ID，请重新登录');
    return;
  }
  pwdSaving.value = true;
  try {
    await modifyPasswordApi(recordId, pwdForm.originalPwd, pwdForm.newPwd);
    message.success('密码修改成功');
    resetPwd();
  } catch (error) {
    message.error(error instanceof Error ? error.message : '修改失败');
  } finally {
    pwdSaving.value = false;
  }
}

async function openGoogleModal() {
  if (googleEnabled.value) {
    message.info('已绑定谷歌验证器');
    return;
  }
  googleCode.value = '';
  googleKeyData.value = {};
  googleOtpauth.value = '';
  googleModalOpen.value = true;
  googleKeyLoading.value = true;
  try {
    const data = (await fetchGoogleKeyApi()) ?? {};
    googleKeyData.value = data;
    googleOtpauth.value = data.qrCode || '';
  } catch (error) {
    message.error(error instanceof Error ? error.message : '获取谷歌密钥失败');
    googleModalOpen.value = false;
  } finally {
    googleKeyLoading.value = false;
  }
}

watch(googleModalOpen, (open) => {
  if (!open) {
    googleKeyData.value = {};
    googleOtpauth.value = '';
    googleCode.value = '';
  }
});

async function submitGoogleBind() {
  const code = googleCode.value.trim();
  if (!/^\d{6}$/.test(code)) {
    message.warning('请输入 6 位谷歌验证码');
    return;
  }
  googleBinding.value = true;
  try {
    await bindGoogleApi({
      googleCode: code,
      googleKey: googleKeyData.value.key || '',
    });
    message.success('绑定成功');
    googleModalOpen.value = false;
    await authStore.fetchUserInfo();
    await loadProfile();
  } catch (error) {
    message.error(error instanceof Error ? error.message : '绑定失败');
  } finally {
    googleBinding.value = false;
  }
}

onMounted(() => {
  void loadProfile();
});
</script>

<template>
  <Page auto-content-height title="个人中心">
    <Card class="userinfo-card">
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
            class="userinfo-form mt-2"
            :label-col="{ span: 6 }"
            :wrapper-col="{ span: 16 }"
          >
            <Form.Item label="代理号">
              <Input :value="currentUser?.belongInfoId || ''" disabled />
            </Form.Item>
            <Form.Item label="登录账号">
              <Input
                :value="
                  currentUser?.loginUsername ||
                  userStore.userInfo?.username ||
                  ''
                "
                disabled
              />
            </Form.Item>
            <Form.Item label="用户类型">
              <Input :value="currentUser?.sysType || ''" disabled />
            </Form.Item>
            <Form.Item label="账户状态">
              <Tag :color="currentUser?.state === 1 ? 'success' : 'error'">
                {{ currentUser?.state === 1 ? '启用' : '禁用' }}
              </Tag>
            </Form.Item>
            <Form.Item label="谷歌验证器">
              <Space>
                <Tag :color="googleEnabled ? 'success' : 'default'">
                  {{ googleEnabled ? '已绑定' : '未绑定' }}
                </Tag>
                <Button
                  v-if="!googleEnabled"
                  type="primary"
                  @click="openGoogleModal"
                >
                  开启谷歌验证
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Tabs.TabPane>

        <Tabs.TabPane key="pwd" tab="修改密码">
          <Form
            class="userinfo-form mt-2"
            :label-col="{ span: 6 }"
            :wrapper-col="{ span: 16 }"
            @finish="savePwd"
          >
            <Form.Item label="原密码" required>
              <Input.Password
                v-model:value="pwdForm.originalPwd"
                allow-clear
                autocomplete="current-password"
                placeholder="请输入原密码"
              />
            </Form.Item>
            <Form.Item label="新密码" required>
              <Input.Password
                v-model:value="pwdForm.newPwd"
                allow-clear
                autocomplete="new-password"
                placeholder="请输入新密码（6-12 位）"
              />
            </Form.Item>
            <Form.Item :wrapper-col="{ offset: 6, span: 16 }">
              <Button html-type="submit" type="primary" :loading="pwdSaving">
                确认修改
              </Button>
            </Form.Item>
          </Form>
        </Tabs.TabPane>
      </Tabs>
    </Card>

    <Modal
      v-model:open="googleModalOpen"
      title="开启谷歌验证"
      ok-text="确认绑定"
      cancel-text="关闭"
      :confirm-loading="googleBinding"
      destroy-on-close
      @ok="submitGoogleBind"
    >
      <div v-if="googleKeyLoading" class="google-loading">加载密钥中…</div>
      <div v-else class="google-bind">
        <p class="google-tip">
          使用 Google Authenticator 扫描下方二维码，或手动输入密钥后填写动态码：
        </p>
        <div class="qr-wrap">
          <img
            v-if="googleQrSrc"
            :src="googleQrSrc"
            alt="谷歌验证二维码"
            class="qr-img"
          />
          <span v-else class="google-muted">二维码生成中…</span>
        </div>
        <p v-if="googleKeyData.key" class="key-line">
          密钥：<code>{{ googleKeyData.key }}</code>
        </p>
        <Input
          :value="googleCode"
          :maxlength="6"
          inputmode="numeric"
          autocomplete="one-time-code"
          placeholder="请输入 6 位谷歌验证码"
          @update:value="
            (v) => (googleCode = String(v ?? '').replace(/\D/g, '').slice(0, 6))
          "
        />
      </div>
    </Modal>
  </Page>
</template>

<style scoped>
.userinfo-card {
  max-width: 640px;
}

.userinfo-form {
  max-width: 520px;
  padding: 8px 8px 16px;
}

.google-bind {
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.google-tip {
  color: hsl(var(--muted-foreground));
  font-size: 13px;
  line-height: 1.5;
  margin: 0;
  text-align: center;
}

.google-muted {
  color: hsl(var(--muted-foreground));
  font-size: 13px;
}

.google-loading {
  color: hsl(var(--muted-foreground));
  padding: 24px 0;
  text-align: center;
}

.qr-wrap {
  align-items: center;
  display: flex;
  justify-content: center;
  min-height: 168px;
}

.qr-img {
  border-radius: 6px;
  height: 168px;
  width: 168px;
}

.key-line {
  font-size: 13px;
  margin: 0;
  text-align: center;
  word-break: break-all;
}

.key-line code {
  background: hsl(var(--muted));
  border-radius: 4px;
  font-size: 13px;
  padding: 2px 6px;
}
</style>

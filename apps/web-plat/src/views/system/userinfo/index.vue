<script lang="ts" setup>
import type { CurrentUser } from '#/api/types';

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

import {
  bindGoogleApi,
  changeOwnPasswordApi,
  fetchGoogleKeyApi,
} from '#/api';
import { fetchCurrentUserApi } from '#/api/core/user';
import { summarizePlatEnts } from '#/constants/entitlements';
import { mockPlatUsers } from '#/mock/data';
import { useAuthStore } from '#/store';

defineOptions({ name: 'UserInfoPage' });

const userStore = useUserStore();
const authStore = useAuthStore();
const activeTab = ref('basic');
const currentUser = ref<CurrentUser | null>(null);

const pwdSaving = ref(false);
const pwdForm = reactive({
  originalPwd: '',
  newPwd: '',
  confirmPwd: '',
});

const googleModalOpen = ref(false);
const googleKeyData = ref<{ key?: string; qrCode?: string }>({});
const googleOtpauth = ref('');
const googleCode = ref('');
const googleBinding = ref(false);
const googleKeyLoading = ref(false);

const googleEnabled = computed(
  () => (currentUser.value?.googleAuth ?? 0) === 1,
);

const account = computed(() =>
  mockPlatUsers.find(
    (item) => item.loginUsername === currentUser.value?.loginUsername,
  ),
);

const roleLabel = computed(() => {
  if (currentUser.value?.isAdmin === 1) return '超级管理员';
  return summarizePlatEnts(
    account.value ?? {
      isAdmin: currentUser.value?.isAdmin ?? 0,
      entIdList: currentUser.value?.entIdList,
    },
  );
});

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
  pwdSaving.value = true;
  try {
    await changeOwnPasswordApi({
      originalPwd: pwdForm.originalPwd,
      newPwd: pwdForm.newPwd,
    });
    message.success('修改成功');
    await authStore.logout();
  } catch (error) {
    message.error(error instanceof Error ? error.message : '修改失败');
  } finally {
    pwdSaving.value = false;
  }
}

function confirmSavePwd() {
  Modal.confirm({
    title: '确认更新密码',
    content: '确认更新密码吗？更新成功后需使用新密码重新登录。',
    okText: '确认',
    cancelText: '取消',
    onOk: () => savePwd(),
  });
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
  if (!googleKeyData.value.key) {
    message.error('绑定信息已失效，请关闭后重试');
    return;
  }
  googleBinding.value = true;
  try {
    await bindGoogleApi({
      googleCode: code,
      googleKey: googleKeyData.value.key,
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
            <Form.Item label="飞机号">
              <Input :value="account?.telegram || '—'" disabled />
            </Form.Item>
            <Form.Item label="角色">
              <Input :value="roleLabel" disabled />
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

        <Tabs.TabPane key="pwd" tab="密码设置">
          <Form
            class="userinfo-form mt-2"
            :label-col="{ span: 6 }"
            :wrapper-col="{ span: 16 }"
            @finish="confirmSavePwd"
          >
            <Form.Item label="用户登录名">
              <Input
                :value="
                  currentUser?.loginUsername || userStore.userInfo?.username
                "
                disabled
              />
            </Form.Item>
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
            <Form.Item label="确认新密码" required>
              <Input.Password
                v-model:value="pwdForm.confirmPwd"
                allow-clear
                autocomplete="new-password"
                placeholder="请再次输入新密码"
              />
            </Form.Item>
            <Form.Item :wrapper-col="{ offset: 6, span: 16 }">
              <Button html-type="submit" type="primary" :loading="pwdSaving">
                保存
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
          <span v-else class="google-muted">无法展示二维码，请稍后重试</span>
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
            (v) =>
              (googleCode = String(v ?? '')
                .replace(/\D/g, '')
                .slice(0, 6))
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
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}

.google-tip {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: hsl(var(--muted-foreground));
  text-align: center;
}

.google-muted {
  font-size: 13px;
  color: hsl(var(--muted-foreground));
}

.google-loading {
  padding: 24px 0;
  color: hsl(var(--muted-foreground));
  text-align: center;
}

.qr-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 168px;
}

.qr-img {
  width: 168px;
  height: 168px;
  border-radius: 6px;
}

.key-line {
  margin: 0;
  font-size: 13px;
  text-align: center;
  word-break: break-all;
}

.key-line code {
  padding: 2px 6px;
  font-size: 13px;
  background: hsl(var(--muted));
  border-radius: 4px;
}
</style>

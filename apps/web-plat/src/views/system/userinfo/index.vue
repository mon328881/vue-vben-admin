<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import { Button, Card, Form, Input, Modal, Tag, message } from 'ant-design-vue';

import { changeOwnPasswordApi } from '#/api';
import { fetchCurrentUserApi } from '#/api/core/user';
import type { CurrentUser } from '#/api/types';
import { summarizePlatEnts } from '#/constants/entitlements';
import { mockPlatUsers } from '#/mock/data';
import { useAuthStore } from '#/store';

defineOptions({ name: 'PlatUserInfoPage' });

const userStore = useUserStore();
const authStore = useAuthStore();
const currentUser = ref<CurrentUser | null>(null);
const pwdSaving = ref(false);
const pwdForm = reactive({
  originalPwd: '',
  newPwd: '',
  confirmPwd: '',
});

const account = computed(() =>
  mockPlatUsers.find(
    (item) => item.loginUsername === currentUser.value?.loginUsername,
  ),
);

const permLabel = computed(() =>
  summarizePlatEnts(
    account.value ?? {
      isAdmin: currentUser.value?.isAdmin ?? 0,
      entIdList: currentUser.value?.entIdList,
    },
  ),
);

async function load() {
  currentUser.value = await fetchCurrentUserApi(true);
}

async function savePwd() {
  if (!pwdForm.originalPwd) {
    message.error('请输入原密码');
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
    message.success('密码已更新，请重新登录');
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
    content: '更新成功后需使用新密码重新登录。',
    okText: '确认',
    cancelText: '取消',
    onOk: () => savePwd(),
  });
}

onMounted(load);
</script>

<template>
  <Page auto-content-height title="个人中心">
    <div class="ap-page-stack">
      <Card :bordered="false" class="ap-page-form">
        <div class="ap-section-head">
          <div>
            <h3 class="ap-section-title">账号信息</h3>
            <p class="ap-section-desc">登录名不可改。飞机号与权限由超管在管理账号中维护。</p>
          </div>
        </div>
        <Form layout="vertical" class="profile-form">
          <Form.Item label="登录名">
            <Input :value="currentUser?.loginUsername" disabled />
          </Form.Item>
          <Form.Item label="姓名">
            <Input :value="account?.realname || userStore.userInfo?.realName" disabled />
          </Form.Item>
          <Form.Item label="飞机号">
            <Input :value="account?.telegram || '—'" disabled />
          </Form.Item>
          <Form.Item label="超管">
            <Tag :color="currentUser?.isAdmin === 1 ? 'red' : 'default'">
              {{ currentUser?.isAdmin === 1 ? '是' : '否' }}
            </Tag>
          </Form.Item>
          <Form.Item label="权限">
            <p class="ap-section-desc" style="margin: 0">{{ permLabel }}</p>
          </Form.Item>
          <Form.Item label="谷歌验证">
            <Tag
              :color="currentUser?.googleAuth === 1 ? 'processing' : 'default'"
            >
              {{ currentUser?.googleAuth === 1 ? '已绑定' : '未绑定' }}
            </Tag>
          </Form.Item>
        </Form>
      </Card>

      <Card :bordered="false" class="ap-page-form">
        <div class="ap-section-head">
          <div>
            <h3 class="ap-section-title">修改密码</h3>
            <p class="ap-section-desc">新密码 6–12 位。修改成功后需要重新登录。</p>
          </div>
        </div>
        <Form layout="vertical" class="profile-form" @finish="confirmSavePwd">
          <Form.Item label="原密码" required>
            <Input.Password
              v-model:value="pwdForm.originalPwd"
              autocomplete="current-password"
              placeholder="请输入原密码"
            />
          </Form.Item>
          <Form.Item label="新密码" required>
            <Input.Password
              v-model:value="pwdForm.newPwd"
              autocomplete="new-password"
              placeholder="6-12 位"
            />
          </Form.Item>
          <Form.Item label="确认新密码" required>
            <Input.Password
              v-model:value="pwdForm.confirmPwd"
              autocomplete="new-password"
              placeholder="再次输入新密码"
            />
          </Form.Item>
          <Form.Item>
            <div class="ap-page-form-actions">
              <Button type="primary" html-type="submit" :loading="pwdSaving">
                保存新密码
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  </Page>
</template>

<style scoped>
.profile-form {
  max-width: 480px;
}
</style>

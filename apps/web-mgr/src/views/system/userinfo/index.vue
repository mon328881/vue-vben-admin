<script lang="ts" setup>
import { reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';
import { Button, Card, Form, Input, Modal, Tabs, message } from 'ant-design-vue';

import { modifyPwdApi } from '#/api';
import { encodeCredential } from '#/api/helper/credential';
import { useAuthStore } from '#/store';

defineOptions({ name: 'UserInfoPage' });

const userStore = useUserStore();
const authStore = useAuthStore();
const saving = ref(false);
const activeTab = ref('pwd');

const form = reactive({
  originalPwd: '',
  newPwd: '',
  confirmPwd: '',
});

function resetPwd() {
  form.originalPwd = '';
  form.newPwd = '';
  form.confirmPwd = '';
}

async function savePwd() {
  if (!form.originalPwd) {
    message.error('请输入原密码');
    return;
  }
  if (!form.newPwd) {
    message.error('请输入新密码');
    return;
  }
  if (form.newPwd.length < 6 || form.newPwd.length > 12) {
    message.error('新密码长度为 6-12 位');
    return;
  }
  if (form.newPwd !== form.confirmPwd) {
    message.error('新密码与确认密码不一致');
    return;
  }
  const recordId = userStore.userInfo?.userId;
  if (!recordId) {
    message.error('无法获取用户 ID，请重新登录');
    return;
  }
  saving.value = true;
  try {
    await modifyPwdApi({
      recordId,
      originalPwd: encodeCredential(form.originalPwd),
      confirmPwd: encodeCredential(form.confirmPwd),
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
</script>

<template>
  <Page auto-content-height title="个人中心">
    <Card class="max-w-xl">
      <Tabs v-model:active-key="activeTab" @change="resetPwd">
        <Tabs.TabPane key="pwd" tab="密码设置">
          <Form
            class="mt-2"
            :label-col="{ span: 6 }"
            :wrapper-col="{ span: 16 }"
            @finish="confirmSave"
          >
            <Form.Item label="用户登录名">
              <Input :value="userStore.userInfo?.username" disabled />
            </Form.Item>
            <Form.Item label="原密码" required>
              <Input.Password
                v-model:value="form.originalPwd"
                allow-clear
                autocomplete="current-password"
                placeholder="请输入原密码"
              />
            </Form.Item>
            <Form.Item label="新密码" required>
              <Input.Password
                v-model:value="form.newPwd"
                allow-clear
                autocomplete="new-password"
                placeholder="请输入新密码（6-12 位）"
              />
            </Form.Item>
            <Form.Item label="确认新密码" required>
              <Input.Password
                v-model:value="form.confirmPwd"
                allow-clear
                autocomplete="new-password"
                placeholder="请再次输入新密码"
              />
            </Form.Item>
            <Form.Item :wrapper-col="{ offset: 6, span: 16 }">
              <Button html-type="submit" type="primary" :loading="saving">
                保存
              </Button>
            </Form.Item>
          </Form>
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
</template>

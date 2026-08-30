<script lang="ts" setup>
import { reactive, ref } from 'vue';

import {
  Button,
  Divider,
  Drawer,
  Form,
  Input,
  Modal,
  Radio,
  Space,
  Tag,
  message,
} from 'ant-design-vue';

import {
  createSysUserApi,
  fetchSysUserApi,
  updateSysUserApi,
} from '#/api';

const emit = defineEmits<{ success: [toFirstPage: boolean] }>();

const visible = ref(false);
const creating = ref(true);
const detailLoading = ref(false);
const saving = ref(false);
const editingId = ref<number | null>(null);
const form = reactive({ loginUsername: '', isAdmin: 0 });

function loginNameOk(value: string) {
  return /^[a-z][a-z0-9]{5,17}$/i.test(value);
}

function resetForm() {
  form.loginUsername = '';
  form.isAdmin = 0;
  editingId.value = null;
}

async function showCreate() {
  creating.value = true;
  resetForm();
  visible.value = true;
}

async function showEdit(sysUserId: number) {
  creating.value = false;
  editingId.value = sysUserId;
  detailLoading.value = true;
  visible.value = true;
  try {
    const data = await fetchSysUserApi(sysUserId);
    form.loginUsername = data.loginUsername ?? '';
    form.isAdmin = Number(data.isAdmin ?? 0);
  } finally {
    detailLoading.value = false;
  }
}

async function save() {
  if (creating.value) {
    const name = form.loginUsername.trim();
    if (!loginNameOk(name)) {
      message.error('请输入字母开头，长度为6-18位的登录名');
      return;
    }
  }
  saving.value = true;
  try {
    if (creating.value) {
      await createSysUserApi({
        loginUsername: form.loginUsername.trim(),
        isAdmin: form.isAdmin,
      });
      message.success('新增成功');
    } else if (editingId.value != null) {
      await updateSysUserApi(editingId.value, { isAdmin: form.isAdmin });
      message.success('修改成功');
    }
    visible.value = false;
    emit('success', creating.value);
    resetForm();
  } finally {
    saving.value = false;
  }
}

function resetPassword() {
  if (editingId.value == null) return;
  Modal.confirm({
    title: '确认重置密码并解绑谷歌验证',
    content: '重置后将恢复默认密码并解绑谷歌验证，是否继续？',
    okText: '确认重置',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      await updateSysUserApi(editingId.value as number, {
        resetPass: true,
        defaultPass: true,
      });
      message.success('重置密码成功');
    },
  });
}

defineExpose({ showCreate, showEdit });
</script>

<template>
  <Drawer
    v-model:open="visible"
    :title="creating ? '新增操作员' : '修改操作员'"
    :width="'40%'"
    :destroy-on-close="true"
    :mask-closable="false"
    @close="resetForm"
  >
    <div class="ap-drawer-body">
      <Form :model="form" layout="vertical">
        <Divider orientation="left">
          <Tag color="processing">基础信息</Tag>
        </Divider>
        <Form.Item label="用户登录名">
          <Input
            v-model:value="form.loginUsername"
            placeholder="字母开头，6-18 位字母或数字"
            :disabled="!creating"
          />
        </Form.Item>
        <Form.Item label="是否为超级管理员">
          <Radio.Group v-model:value="form.isAdmin">
            <Radio :value="1">是</Radio>
            <Radio :value="0">否</Radio>
          </Radio.Group>
        </Form.Item>
        <template v-if="!creating">
          <Divider orientation="left">
            <Tag color="error">账户安全</Tag>
          </Divider>
          <Form.Item label="重置密码">
            <Button danger @click="resetPassword">
              重置密码并解绑谷歌验证
            </Button>
          </Form.Item>
        </template>
      </Form>
    </div>
    <template #footer>
      <Space>
        <Button type="primary" :loading="saving" @click="save">保存</Button>
        <Button @click="visible = false">取消</Button>
      </Space>
    </template>
  </Drawer>
</template>

<script lang="ts" setup>
import type { PlatTenant } from '#/api';

import { reactive, ref } from 'vue';

import {
  Button,
  Drawer,
  Form,
  Input,
  Radio,
  Space,
  message,
} from 'ant-design-vue';

const emit = defineEmits<{
  success: [
    payload: {
      tenantId?: string;
      tenantCode: string;
      tenantName: string;
      mgrDomain?: string;
      contactName?: string;
      contactMobile?: string;
      mgrAdminUsername?: string;
      initialPassword?: string;
      state?: 0 | 1;
      remark?: string;
    },
  ];
}>();

const visible = ref(false);
const creating = ref(true);
const form = reactive({
  tenantId: '',
  tenantCode: '',
  tenantName: '',
  mgrDomain: '',
  contactName: '',
  contactMobile: '',
  mgrAdminUsername: '',
  initialPassword: '',
  state: 1 as 0 | 1,
  remark: '',
});

function reset() {
  Object.assign(form, {
    tenantId: '',
    tenantCode: '',
    tenantName: '',
    mgrDomain: '',
    contactName: '',
    contactMobile: '',
    mgrAdminUsername: '',
    initialPassword: '',
    state: 1,
    remark: '',
  });
}

function showCreate() {
  creating.value = true;
  reset();
  visible.value = true;
}

function showEdit(row: PlatTenant) {
  creating.value = false;
  Object.assign(form, {
    tenantId: row.tenantId,
    tenantCode: row.tenantCode,
    tenantName: row.tenantName,
    mgrDomain: row.mgrDomain,
    contactName: row.contactName,
    contactMobile: row.contactMobile,
    mgrAdminUsername: row.mgrAdminUsername,
    initialPassword: '',
    state: row.state,
    remark: row.remark ?? '',
  });
  visible.value = true;
}

function submit() {
  if (!form.tenantCode.trim() || !form.tenantName.trim()) {
    message.error('请填写租户编码与名称');
    return;
  }
  if (creating.value) {
    if (!form.mgrAdminUsername.trim()) {
      message.error('请填写运营端主账号');
      return;
    }
    if (form.initialPassword.trim().length < 6) {
      message.error('主账号初始密码至少 6 位');
      return;
    }
  }
  emit('success', { ...form });
  visible.value = false;
}

defineExpose({ showCreate, showEdit });
</script>

<template>
  <Drawer
    v-model:open="visible"
    :title="creating ? '新建运营端' : '编辑运营端'"
    :width="480"
    destroy-on-close
  >
    <div class="ap-drawer-body">
      <section class="ap-drawer-section">
        <div class="ap-drawer-section-head">
          <h3 class="ap-drawer-section-title">运营端信息</h3>
        </div>
        <Form layout="vertical" class="ap-drawer-form">
          <Form.Item label="租户编码" required>
            <Input
              v-model:value="form.tenantCode"
              :disabled="!creating"
              placeholder="如 yanshi"
            />
          </Form.Item>
          <Form.Item label="运营端名称" required>
            <Input v-model:value="form.tenantName" placeholder="展示名称" />
          </Form.Item>
          <Form.Item label="运营域名">
            <Input v-model:value="form.mgrDomain" placeholder="mgr.example.com" />
          </Form.Item>
          <Form.Item label="联系人">
            <Input v-model:value="form.contactName" />
          </Form.Item>
          <Form.Item label="联系电话">
            <Input v-model:value="form.contactMobile" />
          </Form.Item>
          <Form.Item label="状态">
            <Radio.Group v-model:value="form.state">
              <Radio :value="1">启用</Radio>
              <Radio :value="0">停用</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="备注">
            <Input.TextArea v-model:value="form.remark" :rows="3" />
          </Form.Item>
        </Form>
      </section>
      <section class="ap-drawer-section">
        <div class="ap-drawer-section-head">
          <div>
            <h3 class="ap-drawer-section-title">运营端主账号</h3>
            <p class="ap-drawer-section-desc">
              {{ creating ? '开户后用于登录该运营端。' : '改密与解绑请用列表「主账号」。' }}
            </p>
          </div>
        </div>
        <Form layout="vertical" class="ap-drawer-form">
          <Form.Item v-if="creating" label="登录名" required>
            <Input
              v-model:value="form.mgrAdminUsername"
              placeholder="登录该运营端的主管理员"
            />
          </Form.Item>
          <Form.Item v-else label="登录名">
            <Input :value="form.mgrAdminUsername" disabled />
          </Form.Item>
          <Form.Item v-if="creating" label="初始密码" required>
            <Input.Password
              v-model:value="form.initialPassword"
              placeholder="至少 6 位"
            />
          </Form.Item>
        </Form>
      </section>
    </div>
    <template #footer>
      <Space>
        <Button @click="visible = false">取消</Button>
        <Button type="primary" @click="submit">保存</Button>
      </Space>
    </template>
  </Drawer>
</template>

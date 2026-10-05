<script lang="ts" setup>
import type { PlatTenant } from '#/api';

import { reactive, ref } from 'vue';

import {
  Button,
  Drawer,
  Form,
  Input,
  Popconfirm,
  Radio,
  Tag,
  message,
} from 'ant-design-vue';

import {
  resetMgrAdminPasswordApi,
  unbindMgrAdminGoogleApi,
  updateMgrAdminStateApi,
} from '#/api';

const emit = defineEmits<{ success: [] }>();

const visible = ref(false);
const busy = ref(false);
const tenant = ref<PlatTenant | null>(null);
const form = reactive({
  password: '',
  state: 1 as 0 | 1,
});

function show(row: PlatTenant) {
  tenant.value = row;
  form.password = '';
  form.state = row.mgrAdminState;
  visible.value = true;
}

async function resetPassword() {
  if (!tenant.value) return;
  if (form.password.trim().length < 6) {
    message.error('新密码至少 6 位');
    return;
  }
  busy.value = true;
  try {
    await resetMgrAdminPasswordApi(tenant.value.tenantId, form.password);
    form.password = '';
    message.success('已重置主账号密码');
    emit('success');
  } finally {
    busy.value = false;
  }
}

async function unbindGoogle() {
  if (!tenant.value) return;
  busy.value = true;
  try {
    const row = await unbindMgrAdminGoogleApi(tenant.value.tenantId);
    tenant.value = { ...row };
    message.success('已解绑谷歌验证');
    emit('success');
  } finally {
    busy.value = false;
  }
}

async function saveState() {
  if (!tenant.value) return;
  busy.value = true;
  try {
    const row = await updateMgrAdminStateApi(tenant.value.tenantId, form.state);
    tenant.value = { ...row };
    message.success(form.state === 1 ? '主账号已启用' : '主账号已停用');
    emit('success');
  } finally {
    busy.value = false;
  }
}

defineExpose({ show });
</script>

<template>
  <Drawer
    v-model:open="visible"
    title="运营端主账号"
    :width="480"
    destroy-on-close
  >
    <div class="ap-drawer-body">
      <section class="ap-drawer-section">
        <p class="ap-drawer-section-desc" style="margin-top: 0">
          仅开户与救场。日常操作员仍在对应运营端内管理。
        </p>
        <Form v-if="tenant" layout="vertical" class="ap-drawer-form">
          <Form.Item label="所属运营端">
            {{ tenant.tenantName }}（{{ tenant.tenantCode }}）
          </Form.Item>
          <Form.Item label="主账号">
            {{ tenant.mgrAdminUsername }}
          </Form.Item>
          <Form.Item label="谷歌验证">
            <Tag
              :color="tenant.mgrAdminGoogleAuth === 1 ? 'processing' : 'default'"
            >
              {{ tenant.mgrAdminGoogleAuth === 1 ? '已绑定' : '未绑定' }}
            </Tag>
          </Form.Item>
          <Form.Item label="主账号状态">
            <Radio.Group v-model:value="form.state">
              <Radio :value="1">启用</Radio>
              <Radio :value="0">停用</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="重置密码">
            <Input.Password
              v-model:value="form.password"
              placeholder="新密码，至少 6 位"
            />
          </Form.Item>
        </Form>
      </section>
    </div>
    <template #footer>
      <div class="ap-drawer-footer">
        <Button @click="visible = false">关闭</Button>
        <Popconfirm
          v-if="tenant?.mgrAdminGoogleAuth === 1"
          title="确认解绑该主账号的谷歌验证？"
          @confirm="unbindGoogle"
        >
          <Button :disabled="busy">解绑谷歌验证</Button>
        </Popconfirm>
        <Button :loading="busy" @click="saveState">保存状态</Button>
        <Button type="primary" :loading="busy" @click="resetPassword">
          重置密码
        </Button>
      </div>
    </template>
  </Drawer>
</template>

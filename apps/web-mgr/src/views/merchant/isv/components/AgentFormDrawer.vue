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
  Textarea,
  message,
} from 'ant-design-vue';

import {
  createIsvInfoApi,
  fetchIsvInfoApi,
  resetIsvLoginAuthApi,
  updateIsvInfoApi,
} from '#/api';

const emit = defineEmits<{ success: [] }>();

const visible = ref(false);
const creating = ref(true);
const saving = ref(false);
const loaded = ref(false);
const editingNo = ref<string | null>(null);

const emptyForm = {
  agentName: '',
  loginUserName: '',
  state: 1 as number,
  remark: '',
  agentNo: '' as string,
};

const form = reactive({ ...emptyForm });
const formRef = ref();

async function show(agentNo?: string) {
  creating.value = !agentNo;
  saving.value = false;
  formRef.value?.clearValidate?.();
  Object.assign(form, { ...emptyForm });
  if (agentNo) {
    editingNo.value = agentNo;
    loaded.value = true;
    const detail = await fetchIsvInfoApi(agentNo);
    if (detail) Object.assign(form, detail);
  } else {
    editingNo.value = null;
    loaded.value = false;
  }
  visible.value = true;
}

function closeDrawer() {
  visible.value = false;
  loaded.value = false;
}

async function save() {
  try {
    await formRef.value?.validate?.();
  } catch {
    return;
  }
  saving.value = true;
  try {
    if (creating.value) {
      await createIsvInfoApi({ ...form });
      message.success('新增成功');
      visible.value = false;
      emit('success');
    } else if (editingNo.value) {
      await updateIsvInfoApi(editingNo.value, { ...form });
      message.success('修改成功');
      visible.value = false;
      emit('success');
      loaded.value = true;
    }
  } finally {
    saving.value = false;
  }
}

function confirmResetAuth() {
  Modal.confirm({
    title: '确认重置密码并解绑谷歌验证',
    content: '确定要重置该代理的登录密码并解绑谷歌验证吗？操作后恢复默认密码。',
    okText: '确定',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      await resetIsvLoginAuthApi(
        String(form.agentNo || editingNo.value || ''),
        Number(form.state ?? 1),
      );
      message.success('重置密码成功');
    },
  });
}

defineExpose({ show });
</script>

<template>
  <Drawer
    v-model:open="visible"
    :title="creating ? '新增代理商' : '修改代理商'"
    :width="'48%'"
    :destroy-on-close="true"
    :mask-closable="false"
    @close="closeDrawer"
  >
    <div class="ap-drawer-body">
      <Form ref="formRef" :model="form" layout="vertical" class="ap-drawer-form">
        <Divider orientation="left">
          <Tag color="processing">基础信息</Tag>
        </Divider>
        <Form.Item
          label="代理商名称"
          name="agentName"
          :rules="[{ required: true, message: '请输入代理商名称' }]"
        >
          <Input
            v-model:value="form.agentName"
            placeholder="请输入代理商名称"
          />
        </Form.Item>
        <Form.Item
          label="登录名"
          name="loginUserName"
          :rules="[
            { required: true, message: '请输入登录名' },
            {
              pattern: /^[a-z][a-z0-9]{5,17}$/i,
              message: '字母开头，长度为6-18位',
            },
          ]"
        >
          <Input
            v-model:value="form.loginUserName"
            placeholder="请输入代理商登录名（字母开头，6-18位）"
            :disabled="!creating"
          />
        </Form.Item>
        <Form.Item
          label="状态"
          name="state"
          :rules="[{ required: true, message: '请选择状态' }]"
        >
          <Radio.Group v-model:value="form.state">
            <Radio :value="1">启用</Radio>
            <Radio :value="0">禁用</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item label="备注" name="remark">
          <Textarea
            v-model:value="form.remark"
            placeholder="请输入备注"
            :rows="3"
          />
        </Form.Item>
        <template v-if="!creating && loaded">
          <Divider orientation="left">
            <Tag color="error">账户安全</Tag>
          </Divider>
          <Form.Item label="重置密码">
            <Button danger @click="confirmResetAuth">
              重置密码并解绑谷歌验证
            </Button>
          </Form.Item>
        </template>
      </Form>
    </div>
    <template #footer>
      <Space>
        <Button type="primary" :loading="saving" @click="save">保存</Button>
        <Button @click="closeDrawer">取消</Button>
      </Space>
    </template>
  </Drawer>
</template>

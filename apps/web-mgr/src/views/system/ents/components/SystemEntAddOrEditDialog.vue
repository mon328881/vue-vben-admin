<script lang="ts" setup>
import { ref } from 'vue';

import { Form, Input, Modal, Radio, message } from 'ant-design-vue';

import { fetchSysEntBySysTypeApi, updateSysEntApi } from '#/api';

const props = defineProps<{
  callbackFunc?: (payload: {
    entId: string;
    patch: Record<string, unknown>;
  }) => void;
}>();

const visible = ref(false);
const creating = ref(true);
const saving = ref(false);
const detailLoading = ref(false);
const entId = ref<string | null>(null);
const sysType = ref('MGR');
const form = ref({
  entName: '',
  menuUri: '',
  entSort: '' as number | string,
  quickJump: 0,
  state: 1,
  menuType: '',
});

function resetForm() {
  form.value = {
    entName: '',
    menuUri: '',
    entSort: '',
    quickJump: 0,
    state: 1,
    menuType: '',
  };
  entId.value = null;
}

async function show(id?: string, type = 'MGR') {
  resetForm();
  sysType.value = type;
  creating.value = !id;
  entId.value = id ?? null;
  visible.value = true;
  if (creating.value) return;
  detailLoading.value = true;
  try {
    const data = await fetchSysEntBySysTypeApi(id as string, type);
    Object.assign(form.value, {
      entName: data?.entName ?? '',
      menuUri: data?.menuUri ?? '',
      entSort: data?.entSort ?? '',
      quickJump: Number(data?.quickJump) === 1 ? 1 : 0,
      state: Number(data?.state) === 0 ? 0 : 1,
      menuType: data?.menuType ?? data?.entType ?? '',
    });
  } finally {
    detailLoading.value = false;
  }
}

async function save() {
  if (!form.value.entName.trim()) {
    message.error('请输入资源名称');
    return;
  }
  if (creating.value || entId.value == null) return;
  saving.value = true;
  try {
    await updateSysEntApi(entId.value, {
      sysType: sysType.value,
      entName: form.value.entName,
      menuUri: form.value.menuUri,
      entSort: form.value.entSort,
      quickJump: form.value.quickJump,
      state: form.value.state,
      menuType: form.value.menuType,
    });
    message.success('修改成功');
    props.callbackFunc?.({
      entId: entId.value,
      patch: {
        entName: form.value.entName,
        menuUri: form.value.menuUri,
        entSort: form.value.entSort,
        quickJump: form.value.quickJump,
        state: form.value.state,
        menuType: form.value.menuType,
      },
    });
    visible.value = false;
    resetForm();
  } finally {
    saving.value = false;
  }
}

function close() {
  visible.value = false;
  resetForm();
}

defineExpose({ show });
</script>

<template>
  <Modal
    v-model:open="visible"
    :title="creating ? '新增菜单' : '修改菜单'"
    :confirm-loading="saving"
    :mask-closable="false"
    ok-text="确定"
    cancel-text="取消"
    width="520px"
    @ok="save"
    @cancel="close"
  >
    <Form layout="vertical" :model="form">
      <Form.Item label="资源名称" required>
        <Input v-model:value="form.entName" placeholder="请输入资源名称" />
      </Form.Item>
      <Form.Item label="路径地址">
        <Input v-model:value="form.menuUri" placeholder="路径地址" />
      </Form.Item>
      <Form.Item label="排序（正序显示）">
        <Input v-model:value="form.entSort" placeholder="排序值" />
      </Form.Item>
      <Form.Item label="快速开始">
        <Radio.Group
          v-model:value="form.quickJump"
          :disabled="form.menuType === 'PB' || !form.menuUri"
        >
          <Radio :value="1">是</Radio>
          <Radio :value="0">否</Radio>
        </Radio.Group>
      </Form.Item>
      <Form.Item label="状态">
        <Radio.Group v-model:value="form.state">
          <Radio :value="1">启用</Radio>
          <Radio :value="0">停用</Radio>
        </Radio.Group>
      </Form.Item>
    </Form>
  </Modal>
</template>

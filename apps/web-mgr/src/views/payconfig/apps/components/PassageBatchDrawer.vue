<script lang="ts" setup>
import { reactive, ref } from 'vue';

import {
  Alert,
  Button,
  Divider,
  Drawer,
  Form,
  Select,
  Space,
  message,
} from 'ant-design-vue';

import { postMchAppsMultipleSetApi } from '#/api';

const emit = defineEmits<{ success: [] }>();

const STATE_OPTIONS = [
  { value: 1, label: '启用' },
  { value: 0, label: '禁用' },
];

const visible = ref(false);
const saving = ref(false);
const selectedIds = ref<number[]>([]);
const labels = ref<string[]>([]);
const form = reactive({
  state: undefined as number | undefined,
});

function show(ids: Array<string | number>, names: string[]) {
  selectedIds.value = ids.map((id) => Number(id));
  labels.value = names;
  form.state = undefined;
  visible.value = true;
}

async function runBatchState() {
  if (form.state == null) {
    message.error('请先选择状态');
    return;
  }
  saving.value = true;
  try {
    await postMchAppsMultipleSetApi('multipleSetState', {
      state: form.state,
      selectedIds: selectedIds.value,
    });
    message.success('操作成功');
    visible.value = false;
    emit('success');
  } finally {
    saving.value = false;
  }
}

defineExpose({ show });
</script>

<template>
  <Drawer
    v-model:open="visible"
    title="批量操作通道"
    :width="480"
    :mask-closable="false"
    destroy-on-close
  >
    <Alert
      type="info"
      show-icon
      :message="`已选通道（${selectedIds.length}）`"
      class="mb-4"
    />
    <Divider orientation="left">常用操作</Divider>
    <Form layout="vertical">
      <Form.Item label="通道操作">
        <Select
          v-model:value="form.state"
          allow-clear
          placeholder="状态"
          :options="STATE_OPTIONS"
        />
      </Form.Item>
      <Button
        type="primary"
        ghost
        :loading="saving"
        @click="runBatchState"
      >
        批量开启/关闭
      </Button>
    </Form>
    <div v-if="labels.length" class="text-muted-foreground mt-4 text-xs">
      <div v-for="(name, idx) in labels.slice(0, 20)" :key="idx">{{ name }}</div>
      <div v-if="labels.length > 20">…共 {{ labels.length }} 条</div>
    </div>
    <template #footer>
      <Space>
        <Button @click="visible = false">关闭</Button>
      </Space>
    </template>
  </Drawer>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue';

import {
  Button,
  Divider,
  Drawer,
  Form,
  Modal,
  Radio,
  Row,
  Space,
  Tag,
  Textarea,
  message,
} from 'ant-design-vue';

import {
  multipleSetCanNotifyApi,
  multipleSetCanPushApi,
  multipleSetCanRateNotifyApi,
  multipleSetStateApi,
} from '#/api';

const emit = defineEmits<{ success: [] }>();

const visible = ref(false);
const summary = ref('');
const selectedIds = ref<string[]>([]);
const saving = ref(false);
const stateVisible = ref(false);
const pushVisible = ref(false);
const notifyVisible = ref(false);
const rateVisible = ref(false);
const form = reactive({
  state: undefined as number | undefined,
  canPush: undefined as number | undefined,
  canNotify: undefined as number | undefined,
  canRateNotify: undefined as number | undefined,
});

const count = computed(() => selectedIds.value.length);
const stateReady = computed(() => form.state === 0 || form.state === 1);
const pushReady = computed(() => form.canPush === 0 || form.canPush === 1);
const notifyReady = computed(
  () => form.canNotify === 0 || form.canNotify === 1,
);
const rateReady = computed(
  () => form.canRateNotify === 0 || form.canRateNotify === 1,
);

function reset() {
  form.state = undefined;
  form.canPush = undefined;
  form.canNotify = undefined;
  form.canRateNotify = undefined;
}

function closeSuccess() {
  reset();
  stateVisible.value = false;
  pushVisible.value = false;
  notifyVisible.value = false;
  rateVisible.value = false;
  visible.value = false;
  emit('success');
}

function show(ids: string[], labels: string[]) {
  reset();
  selectedIds.value = [...ids];
  summary.value = labels.join('\n');
  visible.value = true;
}

function onClose() {
  const n = selectedIds.value.length;
  visible.value = false;
  if (n > 0) {
    message.warning(
      `批量操作窗口已关闭，列表仍选中 ${n} 条商户，进行其他操作前请特别注意。`,
    );
  }
  emit('success');
}

async function saveState() {
  if (form.state === undefined) {
    message.error('请先选择状态');
    return;
  }
  saving.value = true;
  try {
    await multipleSetStateApi({
      state: form.state,
      selectedIds: selectedIds.value,
    });
    message.success('操作成功');
    closeSuccess();
  } finally {
    saving.value = false;
  }
}

async function savePush() {
  if (form.canPush === undefined) {
    message.error('请先选择启用推送');
    return;
  }
  saving.value = true;
  try {
    await multipleSetCanPushApi({
      canPush: form.canPush,
      selectedIds: selectedIds.value,
    });
    message.success('操作成功');
    closeSuccess();
  } finally {
    saving.value = false;
  }
}

async function saveNotify() {
  if (form.canNotify === undefined) {
    message.error('请先选择启用通知');
    return;
  }
  saving.value = true;
  try {
    await multipleSetCanNotifyApi({
      canNotify: form.canNotify,
      selectedIds: selectedIds.value,
    });
    message.success('操作成功');
    closeSuccess();
  } finally {
    saving.value = false;
  }
}

async function saveRate() {
  if (form.canRateNotify === undefined) {
    message.error('请先选择费率变动提醒');
    return;
  }
  saving.value = true;
  try {
    await multipleSetCanRateNotifyApi({
      canRateNotify: form.canRateNotify,
      selectedIds: selectedIds.value,
    });
    message.success('操作成功');
    closeSuccess();
  } finally {
    saving.value = false;
  }
}

defineExpose({ show });
</script>

<template>
  <Drawer
    v-model:open="visible"
    title="批量操作商户"
    :width="520"
    destroy-on-close
    @close="onClose"
  >
    <div class="ap-drawer-body">
      <div class="ap-drawer-section">
        <Divider orientation="left">
          <Tag color="blue">已选商户（{{ count }} 条）</Tag>
        </Divider>
        <Textarea
          v-model:value="summary"
          :rows="8"
          readonly
          placeholder="所选商户将显示在此处"
          class="font-mono text-xs"
        />
      </div>
      <div class="ap-drawer-section">
        <Divider orientation="left">
          <Tag color="blue">商户设置</Tag>
        </Divider>
        <Row :gutter="[8, 8]">
          <Space wrap>
            <Button type="primary" ghost @click="stateVisible = true">
              批量修改状态
            </Button>
            <Button @click="pushVisible = true">启用推送</Button>
            <Button @click="notifyVisible = true">启用通知</Button>
            <Button @click="rateVisible = true">费率变动提醒</Button>
          </Space>
        </Row>
      </div>
    </div>
    <template #footer>
      <Button @click="onClose">关闭</Button>
    </template>
  </Drawer>

  <Modal
    v-model:open="stateVisible"
    title="批量修改商户状态"
    :confirm-loading="saving"
    :ok-button-props="{ disabled: !stateReady }"
    ok-text="确定"
    cancel-text="取消"
    @ok="saveState"
  >
    <Form layout="vertical">
      <Form.Item label="商户状态">
        <Radio.Group v-model:value="form.state">
          <Radio :value="1">启用</Radio>
          <Radio :value="0">禁用</Radio>
        </Radio.Group>
      </Form.Item>
    </Form>
  </Modal>

  <Modal
    v-model:open="pushVisible"
    title="批量修改启用推送"
    :confirm-loading="saving"
    :ok-button-props="{ disabled: !pushReady }"
    ok-text="确定"
    cancel-text="取消"
    @ok="savePush"
  >
    <Form layout="vertical">
      <Form.Item label="启用推送">
        <Radio.Group v-model:value="form.canPush">
          <Radio :value="1">启用</Radio>
          <Radio :value="0">禁用</Radio>
        </Radio.Group>
        <p class="text-muted-foreground mt-2 text-xs">是否接收群发消息</p>
      </Form.Item>
    </Form>
  </Modal>

  <Modal
    v-model:open="notifyVisible"
    title="批量修改启用通知"
    :confirm-loading="saving"
    :ok-button-props="{ disabled: !notifyReady }"
    ok-text="确定"
    cancel-text="取消"
    @ok="saveNotify"
  >
    <Form layout="vertical">
      <Form.Item label="启用通知">
        <Radio.Group v-model:value="form.canNotify">
          <Radio :value="1">启用</Radio>
          <Radio :value="0">禁用</Radio>
        </Radio.Group>
        <p class="text-muted-foreground mt-2 text-xs">
          是否接收动账、预付等通知
        </p>
      </Form.Item>
    </Form>
  </Modal>

  <Modal
    v-model:open="rateVisible"
    title="批量修改费率变动提醒"
    :confirm-loading="saving"
    :ok-button-props="{ disabled: !rateReady }"
    ok-text="确定"
    cancel-text="取消"
    @ok="saveRate"
  >
    <Form layout="vertical">
      <Form.Item label="费率变动提醒">
        <Radio.Group v-model:value="form.canRateNotify">
          <Radio :value="1">启用</Radio>
          <Radio :value="0">禁用</Radio>
        </Radio.Group>
      </Form.Item>
    </Form>
  </Modal>
</template>

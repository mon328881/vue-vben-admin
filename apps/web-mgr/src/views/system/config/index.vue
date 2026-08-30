<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Tabs,
  message,
} from 'ant-design-vue';

import { fetchSysConfigsApi, updateSysConfigsApi } from '#/api';
import type { SysConfigItem } from '#/api/modules/system';

defineOptions({ name: 'SysConfigPage' });

const PAY_KEYS = new Set(['passageTimeout', 'pollingCount']);
const HIDDEN_APP_KEYS = new Set(['openState']);
const PAY_GROUP = 'payConfigGroup';
const MIN_SAVE_DELAY = 2000;

const activeTab = ref('applicationConfig');
const items = ref<SysConfigItem[]>([]);
const loading = ref(false);
const saving = ref(false);
const loadError = ref(false);
const formModel = ref<Record<string, string>>({});

function suffixOf(configKey: string) {
  if (configKey === 'passageTimeout') return '秒';
  if (configKey === 'pollingCount') return '次';
  return undefined;
}

function descOf(item: SysConfigItem) {
  if (item.configKey === 'passageTimeout') {
    return '请输入5–30之间的整数，单位为秒。';
  }
  if (item.configKey === 'pollingCount') {
    return '请输入10–60之间的整数，单位为次。';
  }
  return item.configDesc;
}

function isTextarea(item: SysConfigItem) {
  return String(item.type ?? '') === 'textarea';
}

async function load() {
  loadError.value = false;
  loading.value = true;
  items.value = [];
  try {
    const list = (await fetchSysConfigsApi(activeTab.value)) ?? [];
    const filtered =
      activeTab.value === PAY_GROUP
        ? list.filter((s) => PAY_KEYS.has(s.configKey))
        : list.filter((s) => !HIDDEN_APP_KEYS.has(s.configKey));
    items.value = filtered;
    const model: Record<string, string> = {};
    for (const item of filtered) {
      model[item.configKey] =
        item.configVal != null ? String(item.configVal) : '';
    }
    formModel.value = model;
  } catch {
    loadError.value = true;
    message.error('加载配置失败');
  } finally {
    loading.value = false;
  }
}

function onTabChange(key: string | number) {
  activeTab.value = String(key);
  void load();
}

async function submit() {
  const formData = new FormData();
  for (const item of items.value) {
    formData.append(
      item.configKey,
      formModel.value[item.configKey] ?? '',
    );
  }
  saving.value = true;
  try {
    await Promise.all([
      new Promise<void>((resolve) => setTimeout(resolve, MIN_SAVE_DELAY)),
      updateSysConfigsApi(activeTab.value, formData),
    ]);
    message.success('修改成功');
    await load();
  } finally {
    saving.value = false;
  }
}

function confirmSubmit() {
  const label = activeTab.value === PAY_GROUP ? '支付设置' : '应用配置';
  Modal.confirm({
    title: '确认修改',
    content: `确认修改${label}吗？`,
    okText: '确认',
    cancelText: '取消',
    async onOk() {
      try {
        await submit();
      } catch {
        // ignore
      }
    },
  });
}

onMounted(() => {
  void load();
});
</script>

<template>
  <Page auto-content-height title="系统配置">
    <Card :loading="loading">
      <Tabs :active-key="activeTab" @change="onTabChange">
        <Tabs.TabPane key="applicationConfig" tab="应用配置" />
        <Tabs.TabPane key="payConfigGroup" tab="支付设置" />
      </Tabs>

      <div class="config-form-wrap">
        <Alert
          v-if="activeTab === PAY_GROUP"
          type="info"
          show-icon
          class="mb-4"
          message="支付设置说明"
          description="单通道超时时间用于判断单次通道响应是否超时（5–30 秒）；轮询次数为单笔订单最多允许尝试的通道次数（10–60 次）。"
        />

        <div v-if="loadError" class="config-error">
          <Button type="primary" ghost @click="load">重新加载</Button>
        </div>

        <Form v-else layout="vertical" class="config-form">
          <Row :gutter="[24, 8]">
            <Col
              v-for="item in items"
              :key="item.configKey"
              :span="isTextarea(item) ? 24 : 12"
            >
              <Form.Item :label="item.configName" :help="descOf(item)">
                <Input.TextArea
                  v-if="isTextarea(item)"
                  v-model:value="formModel[item.configKey]"
                  :auto-size="{ minRows: 3, maxRows: 12 }"
                  allow-clear
                />
                <Input
                  v-else
                  v-model:value="formModel[item.configKey]"
                  allow-clear
                  :addon-after="suffixOf(item.configKey)"
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item class="mt-2">
            <Button type="primary" :loading="saving" @click="confirmSubmit">
              确认更新
            </Button>
          </Form.Item>
        </Form>
      </div>
    </Card>
  </Page>
</template>

<style scoped>
.config-form-wrap {
  margin-top: 4px;
  max-width: 960px;
}

.config-error {
  padding: 24px 0;
}
</style>

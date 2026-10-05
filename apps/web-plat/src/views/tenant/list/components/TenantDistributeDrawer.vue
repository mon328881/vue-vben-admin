<script lang="ts" setup>
import type { PlatPayIfDefine, PlatTenant } from '#/api';

import { ref } from 'vue';

import {
  Button,
  Checkbox,
  Drawer,
  Space,
  Tag,
  message,
} from 'ant-design-vue';

import { distributePayIfApi, fetchPayIfDefinesApi } from '#/api';

const emit = defineEmits<{ success: [] }>();

const visible = ref(false);
const loading = ref(false);
const submitting = ref(false);
const tenant = ref<PlatTenant | null>(null);
const defines = ref<PlatPayIfDefine[]>([]);
const ifCodes = ref<string[]>([]);

function distState(item: PlatPayIfDefine): 'none' | 'ok' | 'stale' {
  const sent = tenant.value?.distributedIfVersions?.[item.ifCode];
  if (!sent) return 'none';
  return sent === item.version ? 'ok' : 'stale';
}

function distVersion(item: PlatPayIfDefine) {
  return tenant.value?.distributedIfVersions?.[item.ifCode] ?? '';
}

async function show(row: PlatTenant) {
  tenant.value = row;
  ifCodes.value = [];
  visible.value = true;
  loading.value = true;
  try {
    const page = await fetchPayIfDefinesApi();
    defines.value = page.records.filter((item) => item.state === 1);
  } finally {
    loading.value = false;
  }
}

function selectAll() {
  ifCodes.value = defines.value.map((item) => item.ifCode);
}

async function submit() {
  if (!tenant.value) return;
  if (tenant.value.state !== 1) {
    message.error('租户已停用，无法下发');
    return;
  }
  if (!ifCodes.value.length) {
    message.error('请选择至少一个支付接口');
    return;
  }
  submitting.value = true;
  try {
    let lastStatus = 'success';
    for (const ifCode of ifCodes.value) {
      const record = await distributePayIfApi({
        ifCode,
        tenantIds: [tenant.value.tenantId],
      });
      lastStatus = record.status;
    }
    if (lastStatus === 'failed') message.error('下发失败');
    else if (lastStatus === 'partial') message.warning('部分成功');
    else message.success('已下发到该运营端');
    visible.value = false;
    emit('success');
  } catch (error) {
    message.error(error instanceof Error ? error.message : '下发失败');
  } finally {
    submitting.value = false;
  }
}

defineExpose({ show });
</script>

<template>
  <Drawer
    v-model:open="visible"
    :title="tenant ? `接口下发 · ${tenant.tenantName}` : '接口下发'"
    :width="520"
    destroy-on-close
  >
    <div class="ap-drawer-body">
      <p class="ap-drawer-section-desc" style="margin: 0 0 16px">
        将选中接口的 Schema 下发到当前运营端。已下发但 Schema 有更新的会标「有更新」，可再次下发覆盖。
      </p>
      <div class="mb-3 flex gap-2">
        <Button size="small" @click="selectAll">全选</Button>
        <Button size="small" @click="ifCodes = []">清空</Button>
      </div>
      <Checkbox.Group v-model:value="ifCodes" class="if-pick" :disabled="loading">
        <Checkbox
          v-for="item in defines"
          :key="item.ifCode"
          :value="item.ifCode"
          class="if-pick__item"
          :class="{ 'if-pick__item--stale': distState(item) === 'stale' }"
        >
          <span class="if-pick__body">
            <span class="if-pick__name">{{ item.ifName }}</span>
            <span class="if-pick__code">{{ item.ifCode }}</span>
          </span>
          <Tag>{{ item.version }}</Tag>
          <Tag color="blue">{{ item.ifParams.length }} 字段</Tag>
          <Tag v-if="distState(item) === 'none'">未下发</Tag>
          <template v-else>
            <Tag color="success">已下发 {{ distVersion(item) }}</Tag>
            <Tag v-if="distState(item) === 'stale'" color="warning">有更新</Tag>
          </template>
        </Checkbox>
      </Checkbox.Group>
    </div>
    <template #footer>
      <Space>
        <Button @click="visible = false">取消</Button>
        <Button type="primary" :loading="submitting" @click="submit">
          确认下发
        </Button>
      </Space>
    </template>
  </Drawer>
</template>

<style scoped>
.if-pick {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.if-pick :deep(.ant-checkbox-wrapper.if-pick__item) {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  width: 100%;
  padding: 12px 14px;
  margin-inline-end: 0;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
}

.if-pick :deep(.ant-checkbox-wrapper.if-pick__item--stale) {
  background: hsl(38 92% 50% / 8%);
  border-color: hsl(38 92% 45% / 55%);
}

.if-pick :deep(.ant-checkbox) {
  margin-top: 3px;
}

.if-pick :deep(.ant-checkbox + span) {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding-inline-start: 0;
}

.if-pick__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.if-pick__name {
  font-size: 14px;
  line-height: 22px;
}

.if-pick__code {
  font-size: 12px;
  line-height: 18px;
  color: hsl(var(--muted-foreground));
}
</style>

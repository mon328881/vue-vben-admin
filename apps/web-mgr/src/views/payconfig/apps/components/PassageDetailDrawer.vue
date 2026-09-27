<script lang="ts" setup>
import type { PayPassage } from '#/api';

import { computed, ref } from 'vue';

import { Descriptions, Drawer, message, Spin } from 'ant-design-vue';

import { fetchMchAppApi } from '#/api';
import { formatDateTime, formatYuan } from '#/utils/format';

defineOptions({ name: 'PassageDetailDrawer' });

const visible = ref(false);
const loading = ref(false);
const row = ref<null | PayPassage>(null);

const hasAgent = computed(() => {
  const agentNo = row.value?.agentNo;
  return (
    agentNo !== null && agentNo !== undefined && String(agentNo).trim() !== ''
  );
});

const configText = computed(() => {
  const raw = row.value?.payInterfaceConfig;
  return raw === null || raw === undefined ? '' : String(raw);
});

function payTypeText(value?: null | number) {
  if (value === 1) return '区间范围';
  if (value === 2) return '固定金额';
  return '--';
}

function ratePct(value?: null | number | string) {
  const num = typeof value === 'string' ? Number.parseFloat(value) : value;
  return Number.isFinite(num) ? (Number(num) * 100).toFixed(2) : '0.00';
}

async function show(target: PayPassage) {
  // 先用列表行占位（保留 productName/icon），再拉详情契约字段
  row.value = { ...target };
  visible.value = true;
  if (target.payPassageId === null || target.payPassageId === undefined) return;
  loading.value = true;
  try {
    const detail = await fetchMchAppApi(target.payPassageId);
    row.value = {
      ...detail,
      // 详情 21 字段不含列表展示字段，合并保留
      productName: detail.productName ?? target.productName,
      icon: detail.icon ?? target.icon,
      agentName: detail.agentName ?? target.agentName,
      passageGroupName: detail.passageGroupName ?? target.passageGroupName,
      successRate: detail.successRate ?? target.successRate,
    };
  } catch {
    message.error('加载通道详情失败');
  } finally {
    loading.value = false;
  }
}

defineExpose({ show });
</script>

<template>
  <Drawer
    v-model:open="visible"
    title="支付通道详情"
    width="50%"
    :destroy-on-close="true"
    :footer="false"
  >
    <Spin :spinning="loading">
      <div v-if="row?.payPassageId != null" class="passage-detail">
        <Descriptions :column="2" bordered size="small">
          <Descriptions.Item label="通道ID">
            <span class="passage-detail-id">{{ row.payPassageId }}</span>
          </Descriptions.Item>
          <Descriptions.Item label="通道名称">
            <b>{{ row.payPassageName }}</b>
          </Descriptions.Item>
          <Descriptions.Item label="所属产品" :span="2">
            <span class="passage-detail-product">[{{ row.productId }}] </span>
            <span>{{ row.productName || '--' }}</span>
          </Descriptions.Item>
          <Descriptions.Item label="收款规则类型">
            {{ payTypeText(row.payType) }}
          </Descriptions.Item>
          <Descriptions.Item label="收款规则">
            <b>[ {{ row.payRules ?? '--' }} ]</b>
          </Descriptions.Item>
        </Descriptions>

        <Descriptions :column="2" bordered size="small">
          <Descriptions.Item label="创建时间">
            {{ formatDateTime(row.createdAt) }}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {{ formatDateTime(row.updatedAt) }}
          </Descriptions.Item>
        </Descriptions>

        <Descriptions :column="2" bordered size="small">
          <Descriptions.Item label="支付接口代码">
            {{ row.ifCode ?? '--' }}
          </Descriptions.Item>
          <Descriptions.Item label="通道费率">
            <b>{{ ratePct(row.rate) }}%</b>
          </Descriptions.Item>
          <Descriptions.Item label="代理商商户号">
            {{ hasAgent ? row.agentNo : '无通道代理' }}
          </Descriptions.Item>
          <Descriptions.Item label="代理费率">
            <b>{{ hasAgent ? `${ratePct(row.agentRate)}%` : '--' }}</b>
          </Descriptions.Item>
          <Descriptions.Item label="轮询权重">
            <b>{{ row.weights ?? '--' }}</b>
          </Descriptions.Item>
          <Descriptions.Item label="通道余额">
            <b>{{ formatYuan(row.balance) }}</b>
          </Descriptions.Item>
          <Descriptions.Item label="日限额">
            {{ row.quotaLimitState === 1 ? formatYuan(row.quota) : '未开启' }}
          </Descriptions.Item>
          <Descriptions.Item label="所属供应商">
            {{ row.passageGroup || row.passageGroupName || '--' }}
          </Descriptions.Item>
        </Descriptions>

        <div class="passage-detail-config">
          <div class="passage-detail-config__label">支付参数配置</div>
          <pre class="passage-detail-config__body">{{ configText }}</pre>
        </div>
      </div>
    </Spin>
  </Drawer>
</template>

<style scoped>
.passage-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.passage-detail-id,
.passage-detail-product {
  color: hsl(var(--primary));
}

.passage-detail-id {
  font-weight: 600;
}

.passage-detail-config__label {
  margin-bottom: 8px;
  font-size: 14px;
  color: hsl(var(--muted-foreground));
}

.passage-detail-config__body {
  min-height: 160px;
  max-height: 360px;
  padding: 12px 14px;
  margin: 0;
  overflow: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  line-height: 1.55;
  word-break: normal;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
  background: hsl(var(--muted) / 35%);
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
}
</style>

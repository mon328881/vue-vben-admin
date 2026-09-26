<script lang="ts" setup>
import type { PayPassage } from '#/api';

import { computed, ref } from 'vue';

import { Descriptions, Drawer } from 'ant-design-vue';

import { formatDateTime, formatFeeRate } from '#/utils/format';

defineOptions({ name: 'PassageDetailDrawer' });

const visible = ref(false);
const row = ref<null | PayPassage>(null);

const hasAgent = computed(() => !!row.value?.agentNo);

function payTypeText(value?: null | number) {
  if (value === 1) return '区间范围';
  if (value === 2) return '固定金额';
  return '--';
}

function show(target: PayPassage) {
  row.value = target;
  visible.value = true;
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
    <div v-if="row?.payPassageId != null" class="passage-detail">
      <Descriptions :column="2" bordered size="small">
        <Descriptions.Item label="通道ID">
          {{ row.payPassageId }}
        </Descriptions.Item>
        <Descriptions.Item label="通道名称">
          <b>{{ row.payPassageName }}</b>
        </Descriptions.Item>
        <Descriptions.Item label="所属产品" :span="2">
          <span>[{{ row.productId }}] </span>
          <span>{{ row.productName }}</span>
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
          <b>{{ formatFeeRate(row.rate) }}</b>
        </Descriptions.Item>
        <Descriptions.Item label="代理商商户号">
          {{ hasAgent ? row.agentNo : '无通道代理' }}
        </Descriptions.Item>
        <Descriptions.Item label="代理费率">
          <b>{{ hasAgent ? formatFeeRate(row.agentRate) : '--' }}</b>
        </Descriptions.Item>
        <Descriptions.Item label="轮询权重" :span="2">
          <b>{{ row.weights ?? '--' }}</b>
        </Descriptions.Item>
      </Descriptions>

      <div class="passage-detail-config">
        <div class="passage-detail-config__label">支付参数配置</div>
        <pre class="passage-detail-config__body">{{
          row.payInterfaceConfig || ''
        }}</pre>
      </div>
    </div>
  </Drawer>
</template>

<style scoped>
.passage-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
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

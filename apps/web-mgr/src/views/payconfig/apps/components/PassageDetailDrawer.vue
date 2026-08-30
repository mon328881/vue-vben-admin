<script lang="ts" setup>
import { computed, ref } from 'vue';

import { Descriptions, Drawer } from 'ant-design-vue';

import type { PayPassage } from '#/api';
import { formatDateTime, formatRateDecimal } from '#/utils/format';

defineOptions({ name: 'PassageDetailDrawer' });

const visible = ref(false);
const row = ref<PayPassage | null>(null);

const hasAgent = computed(() => !!row.value?.agentNo);

function payTypeText(value?: number | null) {
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
    :width="'50%'"
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
          <b>{{ formatRateDecimal(row.rate) }}</b>
        </Descriptions.Item>
        <Descriptions.Item label="代理商商户号">
          {{ hasAgent ? row.agentNo : '无通道代理' }}
        </Descriptions.Item>
        <Descriptions.Item label="代理费率">
          <b>{{ hasAgent ? formatRateDecimal(row.agentRate) : '--' }}</b>
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
  color: hsl(var(--muted-foreground));
  font-size: 14px;
}

.passage-detail-config__body {
  margin: 0;
  min-height: 160px;
  max-height: 360px;
  overflow: auto;
  padding: 12px 14px;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  background: hsl(var(--muted) / 35%);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>

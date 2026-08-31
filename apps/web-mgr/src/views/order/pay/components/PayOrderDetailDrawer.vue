<script lang="ts" setup>
import { computed } from 'vue';

import { Descriptions, Drawer, Spin, Tag } from 'ant-design-vue';

import type { PayOrder } from '#/api/types/business';
import {
  notifyStateColor,
  notifyStateLabel,
  payOrderStateColor,
  payOrderStateLabel,
} from '#/constants/order';
import { formatDateTime } from '#/utils/format';

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  detail: PayOrder | null;
  loading?: boolean;
}>();

/** 对齐旧端 formatCent：分→元，固定两位 */
function formatCent(cent?: number | null) {
  if (cent == null) return '0.00';
  return (Number(cent) / 100).toFixed(2);
}

/** 对齐旧端 ratePct：费率小数 ×100 */
function ratePct(rate?: number | string | null) {
  if (rate == null) return '0.00';
  return (Number(rate) * 100).toFixed(2);
}

function fmt(value?: string | null) {
  if (!value) return '--';
  return formatDateTime(value);
}

const platformProfit = computed(() => {
  const d = props.detail;
  if (!d) return 0;
  return (
    (d.mchFeeAmount ?? 0) -
    (d.agentFeeAmount ?? 0) -
    (d.passageFeeAmount ?? 0) -
    (d.agentPassageFee ?? 0)
  );
});

const forceYesNo = computed(() => {
  const v = props.detail?.forceChangeState;
  if (v === 0 || v === 1) return v;
  return null;
});
</script>

<template>
  <Drawer
    v-model:open="open"
    title="订单详情"
    :width="1000"
    destroy-on-close
  >
    <Spin :spinning="!!loading">
    <div v-if="detail?.payOrderId" class="detail-body">
      <section class="detail-section">
        <Descriptions :column="2" bordered size="small">
          <Descriptions.Item label="商户号">
            {{ detail.mchNo }}
          </Descriptions.Item>
          <Descriptions.Item label="商户名称">
            {{ detail.mchName || '--' }}
          </Descriptions.Item>
          <Descriptions.Item label="支付金额">
            <b>{{ formatCent(detail.amount) }}</b>
          </Descriptions.Item>
          <Descriptions.Item label="支付产品">
            [{{ detail.productId ?? '--' }}] {{ detail.productName || '' }}
          </Descriptions.Item>
          <Descriptions.Item label="支付订单号" :span="2">
            <span class="text-brand">{{ detail.payOrderId }}</span>
          </Descriptions.Item>
          <Descriptions.Item label="订单状态">
            <Tag :color="payOrderStateColor(detail.state)">
              {{ payOrderStateLabel(detail.state) }}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="回调状态">
            <Tag :color="notifyStateColor(detail.notifyState)">
              {{ notifyStateLabel(detail.notifyState) }}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="是否强制补单">
            <Tag
              v-if="forceYesNo !== null"
              :color="forceYesNo === 1 ? 'warning' : 'default'"
            >
              {{ forceYesNo === 1 ? '是' : '否' }}
            </Tag>
            <span v-else>--</span>
          </Descriptions.Item>
          <Descriptions.Item label="操作员">
            {{ detail.forceChangeLoginName || '--' }}
          </Descriptions.Item>
          <Descriptions.Item label="商户订单号" :span="2">
            {{ detail.mchOrderNo }}
          </Descriptions.Item>
        </Descriptions>
      </section>

      <section class="detail-section">
        <Descriptions :column="2" bordered size="small">
          <Descriptions.Item label="创建时间">
            {{ fmt(detail.createdAt) }}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {{ fmt(detail.updatedAt) }}
          </Descriptions.Item>
          <Descriptions.Item label="订单失效时间">
            {{ fmt(detail.expiredTime) }}
          </Descriptions.Item>
          <Descriptions.Item label="支付成功时间">
            {{ fmt(detail.successTime) }}
          </Descriptions.Item>
        </Descriptions>
      </section>

      <section class="detail-section">
        <Descriptions :column="4" bordered size="small">
          <Descriptions.Item label="商户代理" :span="2">
            {{ detail.agentNo || '无' }}
          </Descriptions.Item>
          <Descriptions.Item label="支付通道代理" :span="2">
            {{ detail.agentNoPassage || '无' }}
          </Descriptions.Item>
          <Descriptions.Item label="商户费率">
            {{ ratePct(detail.mchFeeRate) }}%
          </Descriptions.Item>
          <Descriptions.Item label="商户代理费率">
            {{ ratePct(detail.agentRate) }}%
          </Descriptions.Item>
          <Descriptions.Item label="通道费率">
            {{ ratePct(detail.passageRate) }}%
          </Descriptions.Item>
          <Descriptions.Item label="通道代理费率">
            {{ ratePct(detail.agentPassageRate) }}%
          </Descriptions.Item>
          <Descriptions.Item label="商户手续费">
            {{ formatCent(detail.mchFeeAmount) }}
          </Descriptions.Item>
          <Descriptions.Item label="商户代理手续费">
            {{ formatCent(detail.agentFeeAmount) }}
          </Descriptions.Item>
          <Descriptions.Item label="通道手续费">
            {{ formatCent(detail.passageFeeAmount) }}
          </Descriptions.Item>
          <Descriptions.Item label="通道代理手续费">
            {{ formatCent(detail.agentPassageFee) }}
          </Descriptions.Item>
          <Descriptions.Item label="平台利润" :span="4">
            <b
              :class="
                platformProfit > 0
                  ? 'amount-positive'
                  : platformProfit < 0
                    ? 'amount-negative'
                    : ''
              "
            >
              {{ formatCent(platformProfit) }}
            </b>
          </Descriptions.Item>
        </Descriptions>
      </section>

      <section class="detail-section">
        <Descriptions :column="3" bordered size="small">
          <Descriptions.Item label="渠道订单号" :span="3">
            {{ detail.passageOrderNo || '无' }}
          </Descriptions.Item>
          <Descriptions.Item label="支付接口代码">
            {{ detail.ifCode || '--' }}
          </Descriptions.Item>
          <Descriptions.Item label="支付通道ID">
            {{ detail.passageId ?? '--' }}
          </Descriptions.Item>
          <Descriptions.Item label="客户端IP" :span="3">
            {{ detail.clientIp || '--' }}
          </Descriptions.Item>
          <Descriptions.Item label="异步通知地址" :span="3">
            {{ detail.notifyUrl || '--' }}
          </Descriptions.Item>
        </Descriptions>
      </section>

      <div class="detail-block">
        <div class="detail-block__label">下单返回参数</div>
        <pre class="result-textarea">{{ detail.passageResp || '--' }}</pre>
      </div>
      <div class="detail-block">
        <div class="detail-block__label">回调通知参数</div>
        <pre class="result-textarea">{{ detail.notifyParams || '--' }}</pre>
      </div>
    </div>
    </Spin>
  </Drawer>
</template>

<style scoped>
.detail-body {
  display: grid;
  gap: 16px;
}

.detail-section {
  min-width: 0;
}

.text-brand {
  /* 对齐旧端 OrderDetailDrawer 订单号高亮 */
  color: #d97706;
  font-weight: 600;
}

.amount-positive {
  color: #4bd884;
}

.amount-negative {
  color: #db4b4b;
}

.detail-block__label {
  margin-bottom: 8px;
  font-size: 14px;
  color: hsl(var(--foreground) / 85%);
}

.result-textarea {
  margin: 0;
  width: 100%;
  min-height: 72px;
  padding: 10px 12px;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  background: hsl(var(--muted) / 40%);
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 12px;
}
</style>

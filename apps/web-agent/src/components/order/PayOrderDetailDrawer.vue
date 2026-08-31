<script lang="ts" setup>
import { ref } from 'vue';

import { Descriptions, Drawer, Tag } from 'ant-design-vue';

import type { PayOrder } from '#/api/types/business';
import {
  notifyStateColor,
  notifyStateLabel,
  orderStateColor,
  orderStateLabel,
} from '#/constants/order';
import { formatDateTime, formatYuan } from '#/utils/format';

defineOptions({ name: 'PayOrderDetailDrawer' });

const open = ref(false);
const detail = ref<PayOrder | null>(null);

function dash(value: unknown, fallback = '—') {
  if (value == null) return fallback;
  const text = String(value).trim();
  return text === '' ? fallback : text;
}

function ratePct(value?: null | number | string) {
  if (value == null) return '0.00';
  return (Number(value) * 100).toFixed(2);
}

function show(data?: null | PayOrder) {
  detail.value = data && typeof data === 'object' ? data : null;
  open.value = true;
}

defineExpose({ show });
</script>

<template>
  <Drawer
    v-model:open="open"
    title="订单详情"
    width="720"
    destroy-on-close
  >
    <div v-if="detail?.payOrderId" class="detail-body">
      <section class="detail-section">
        <Descriptions bordered :column="2" size="small">
          <Descriptions.Item label="商户号">
            {{ dash(detail.mchNo) }}
          </Descriptions.Item>
          <Descriptions.Item label="商户名称">
            {{ dash(detail.mchName) }}
          </Descriptions.Item>
          <Descriptions.Item label="支付订单号" :span="2">
            <span class="text-primary font-semibold">{{ detail.payOrderId }}</span>
          </Descriptions.Item>
          <Descriptions.Item label="商户订单号" :span="2">
            {{ dash(detail.mchOrderNo) }}
          </Descriptions.Item>
          <Descriptions.Item label="支付金额">
            <Tag color="success">{{ formatYuan(detail.amount) }}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="订单状态">
            <Tag :color="orderStateColor(detail.state)">
              {{ orderStateLabel(detail.state) }}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="回调状态">
            <Tag :color="notifyStateColor(detail.notifyState)">
              {{ notifyStateLabel(detail.notifyState) }}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="支付产品">
            <span>
              <span class="text-primary font-semibold">[{{ dash(detail.productId, '—') }}]</span>
              {{ dash(detail.productName) }}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="是否强制补单">
            <Tag
              v-if="detail.forceChangeState === 0 || detail.forceChangeState === 1"
              :color="detail.forceChangeState === 1 ? 'warning' : 'default'"
            >
              {{ detail.forceChangeState === 1 ? '是' : '否' }}
            </Tag>
            <span v-else>—</span>
          </Descriptions.Item>
          <Descriptions.Item label="操作员">
            {{ dash(detail.forceChangeLoginName) }}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {{ formatDateTime(detail.createdAt) }}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {{ formatDateTime(detail.updatedAt) }}
          </Descriptions.Item>
          <Descriptions.Item label="订单失效时间">
            {{ formatDateTime(detail.expiredTime) }}
          </Descriptions.Item>
          <Descriptions.Item label="支付成功时间">
            {{ formatDateTime(detail.successTime) }}
          </Descriptions.Item>
        </Descriptions>
      </section>

      <div class="detail-divider" />

      <section class="detail-section">
        <Descriptions bordered :column="2" size="small">
          <Descriptions.Item label="商户费率">
            {{ ratePct(detail.mchFeeRate) }}%
          </Descriptions.Item>
          <Descriptions.Item label="商户手续费">
            <span class="font-semibold">{{ formatYuan(detail.mchFeeAmount) }}</span>
          </Descriptions.Item>
        </Descriptions>
      </section>

      <div class="detail-divider" />

      <section class="detail-section">
        <Descriptions bordered :column="1" size="small">
          <Descriptions.Item label="客户端IP">
            {{ dash(detail.clientIp) }}
          </Descriptions.Item>
          <Descriptions.Item label="异步通知地址">
            <span class="detail-url">{{ dash(detail.notifyUrl) }}</span>
          </Descriptions.Item>
        </Descriptions>
      </section>
    </div>
  </Drawer>
</template>

<style scoped>
.detail-body {
  font-size: 13px;
}

.detail-divider {
  border-top: 1px solid hsl(var(--border) / 60%);
  margin: 16px 0;
}

.detail-url {
  word-break: break-all;
}
</style>

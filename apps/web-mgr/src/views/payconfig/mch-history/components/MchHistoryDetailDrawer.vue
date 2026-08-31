<script lang="ts" setup>
import { computed, ref } from 'vue';

import {
  Descriptions,
  Drawer,
  Input,
  Tag,
} from 'ant-design-vue';

import {
  MCH_BIZ_TYPE_OPTIONS,
  bizTypeLabel,
  fundDirectionLabel,
} from '#/constants/merchant';
import { formatDateTime, formatYuan, signedYuan } from '#/utils/format';

defineOptions({ name: 'MchHistoryDetailDrawer' });

const open = ref(false);
const detail = ref<Record<string, unknown>>({});

const bizText = computed(() =>
  bizTypeLabel(detail.value.bizType as any, MCH_BIZ_TYPE_OPTIONS),
);
const fundText = computed(() =>
  fundDirectionLabel(detail.value.fundDirection as any),
);
const amountClass = computed(() => {
  const n = Number(detail.value.amount ?? 0);
  if (n > 0) return 'amount-positive';
  if (n < 0) return 'amount-negative';
  return '';
});

function show(row: Record<string, unknown>) {
  detail.value = { ...row };
  open.value = true;
}

defineExpose({ show });
</script>

<template>
  <Drawer
    v-model:open="open"
    title="订单详情"
    :width="'50%'"
    destroy-on-close
    :footer="null"
  >
    <div class="detail-body">
      <Descriptions bordered :column="2" size="small">
        <Descriptions.Item label="商户号">
          {{ detail.mchNo || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="商户名">
          {{ detail.mchName || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="支付订单号">
          {{ detail.payOrderId || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="支付金额">
          {{ formatYuan(detail.payOrderAmount as number) }}
        </Descriptions.Item>
        <Descriptions.Item label="手续费">
          {{ formatYuan(detail.mchRateAmount as number) }}
        </Descriptions.Item>
        <Descriptions.Item label="业务类型">
          <Tag v-if="bizText !== '-'" color="processing">{{ bizText }}</Tag>
          <span v-else>-</span>
        </Descriptions.Item>
        <Descriptions.Item label="资金变更方向">
          <Tag
            v-if="fundText !== '-'"
            :color="String(detail.fundDirection) === '1' ? 'success' : 'error'"
          >
            {{ fundText }}
          </Tag>
          <span v-else>-</span>
        </Descriptions.Item>
        <Descriptions.Item label="创建时间">
          {{ formatDateTime(detail.createdAt as string) }}
        </Descriptions.Item>
        <Descriptions.Item label="变更前余额">
          {{ formatYuan(detail.beforeBalance as number) }}
        </Descriptions.Item>
        <Descriptions.Item label="变更后余额">
          {{ formatYuan(detail.afterBalance as number) }}
        </Descriptions.Item>
        <Descriptions.Item label="变更金额">
          <b :class="amountClass">{{ signedYuan(detail.amount as number) }}</b>
        </Descriptions.Item>
        <Descriptions.Item label="代理商商户号">
          {{ detail.agentNo || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="代理商户名">
          {{ detail.agentName || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="代理分润">
          {{ formatYuan(detail.agentIncome as number) }}
        </Descriptions.Item>
        <Descriptions.Item label="操作员ID">
          {{ detail.createdUid ?? '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="操作员登录名">
          {{ detail.createdLoginName || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="平台分润">
          {{ formatYuan(detail.platIncome as number) }}
        </Descriptions.Item>
      </Descriptions>
      <div class="detail-remark">
        <div class="detail-remark__label">备注</div>
        <Input.TextArea
          :value="String(detail.remark ?? '')"
          :auto-size="{ minRows: 3, maxRows: 6 }"
          readonly
        />
      </div>
    </div>
  </Drawer>
</template>

<style scoped>
.detail-body {
  padding-bottom: 8px;
}

.detail-remark {
  margin-top: 12px;
}

.detail-remark__label {
  margin-bottom: 8px;
  color: hsl(var(--muted-foreground));
  font-size: 13px;
}

.amount-positive {
  color: hsl(var(--success));
}

.amount-negative {
  color: hsl(var(--destructive));
}
</style>

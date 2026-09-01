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
  fundDirectionLabel,
} from '#/constants/merchant';
import HistoryAdjustBizTypeCell from '@asiapay/shared/components/HistoryAdjustBizTypeCell.vue';
import AmountText from '@asiapay/shared/components/AmountText.vue';
import {
  formatDateTime,
  formatYuan,
} from '#/utils/format';

defineOptions({ name: 'MchHistoryDetailDrawer' });

const open = ref(false);
const detail = ref<Record<string, unknown>>({});

const fundText = computed(() =>
  fundDirectionLabel(detail.value.fundDirection as any),
);

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
          <HistoryAdjustBizTypeCell
            :biz-type="detail.bizType as number | string"
            :created-login-name="detail.createdLoginName as string"
            :created-uid="detail.createdUid as number | string"
            :options="MCH_BIZ_TYPE_OPTIONS"
          />
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
          <AmountText
            :value="detail.amount as number"
            kind="signed"
          />
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
</style>

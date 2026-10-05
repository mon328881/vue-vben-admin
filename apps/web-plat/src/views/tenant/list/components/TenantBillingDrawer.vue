<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import type { PlatTenant, TenantBillingKind, TenantBillingRecord } from '#/api';

import { ref } from 'vue';

import { Drawer, Table } from 'ant-design-vue';

import {
  fetchTenantBillingApi,
  formatTenantBalance,
  formatTenantExpire,
  formatTenantPlan,
  TENANT_BILLING_KIND_LABEL,
} from '#/api';

const visible = ref(false);
const loading = ref(false);
const tenant = ref<null | PlatTenant>(null);
const dataSource = ref<TenantBillingRecord[]>([]);

const columns: TableColumnsType = [
  { dataIndex: 'createdAt', title: '时间', width: 170 },
  { dataIndex: 'kind', title: '类型', width: 100 },
  { dataIndex: 'amount', title: '金额', width: 100 },
  { dataIndex: 'afterBalance', title: '余额', width: 90 },
  { dataIndex: 'expireOn', title: '到期日', width: 120 },
  { dataIndex: 'operator', title: '操作人', width: 100 },
  { dataIndex: 'remark', title: '说明', ellipsis: true },
];

async function load() {
  if (!tenant.value) return;
  loading.value = true;
  try {
    const page = await fetchTenantBillingApi(tenant.value.tenantId);
    dataSource.value = page.records;
  } finally {
    loading.value = false;
  }
}

async function show(row: PlatTenant) {
  tenant.value = row;
  visible.value = true;
  await load();
}

defineExpose({ show });
</script>

<template>
  <Drawer
    v-model:open="visible"
    :title="tenant ? `计费明细 · ${tenant.tenantName}` : '计费明细'"
    :width="820"
    destroy-on-close
  >
    <div v-if="tenant" class="ap-drawer-body">
      <p class="ap-drawer-section-desc">
        {{ formatTenantPlan(tenant) }}
        <template v-if="tenant.planType !== 'perpetual'">
          · 到期 {{ formatTenantExpire(tenant) }}
        </template>
        <template v-if="tenant.planType === 'rate'">
          · 余额 {{ formatTenantBalance(tenant) }}（列表「调额」调整）
        </template>
      </p>
      <Table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="{ pageSize: 10 }"
        :scroll="{ x: 880 }"
        row-key="id"
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'kind'">
            {{
              TENANT_BILLING_KIND_LABEL[record.kind as TenantBillingKind] ||
              record.kind
            }}
          </template>
          <template v-else-if="column.dataIndex === 'amount'">
            <span :class="{ 'is-debit': record.amount < 0 }">
              {{ record.amount > 0 ? `+${record.amount}` : record.amount }}
            </span>
          </template>
          <template v-else-if="column.dataIndex === 'afterBalance'">
            {{ record.afterBalance ?? '—' }}
          </template>
          <template v-else-if="column.dataIndex === 'expireOn'">
            {{ record.expireOn || '—' }}
          </template>
        </template>
      </Table>
    </div>
  </Drawer>
</template>

<style scoped>
.is-debit {
  color: #cf1322;
}
</style>

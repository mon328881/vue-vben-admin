<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import type { PlatTenant } from '#/api';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Form,
  Input,
  message,
  Select,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  fetchTenantsApi,
  formatTenantBalance,
  formatTenantExpire,
  formatTenantPlan,
  saveTenantApi,
  updateTenantStateApi,
} from '#/api';
import FilterActions from '#/components/list/FilterActions.vue';
import { PLAT_ENT } from '#/constants/entitlements';
import { hasEnt } from '#/utils/access';

import TenantBalanceAdjustDialog from './components/TenantBalanceAdjustDialog.vue';
import TenantBillingDrawer from './components/TenantBillingDrawer.vue';
import TenantDistributeDrawer from './components/TenantDistributeDrawer.vue';
import TenantDistributeLogDrawer from './components/TenantDistributeLogDrawer.vue';
import TenantFormDrawer from './components/TenantFormDrawer.vue';
import TenantMgrAdminDrawer from './components/TenantMgrAdminDrawer.vue';

defineOptions({ name: 'TenantListPage' });

const loading = ref(false);
const dataSource = ref<PlatTenant[]>([]);
const total = ref(0);
const query = reactive<{ keyword: string; state: 0 | 1 | '' }>({
  keyword: '',
  state: '',
});
const drawerRef = ref<InstanceType<typeof TenantFormDrawer>>();
const adminRef = ref<InstanceType<typeof TenantMgrAdminDrawer>>();
const billingRef = ref<InstanceType<typeof TenantBillingDrawer>>();
const balanceRef = ref<InstanceType<typeof TenantBalanceAdjustDialog>>();
const distributeRef = ref<InstanceType<typeof TenantDistributeDrawer>>();
const logRef = ref<InstanceType<typeof TenantDistributeLogDrawer>>();

const canEdit = computed(() => hasEnt(PLAT_ENT.TENANT_EDIT));
const canAdmin = computed(() => hasEnt(PLAT_ENT.TENANT_ADMIN));
const canDist = computed(() => hasEnt(PLAT_ENT.TENANT_DIST));
const canDistLog = computed(() => hasEnt(PLAT_ENT.DIST_LOG));

const columns: TableColumnsType = [
  { dataIndex: 'tenantCode', title: '租户编码', width: 120 },
  { dataIndex: 'tenantName', title: '运营端名称', ellipsis: true, width: 160 },
  { dataIndex: 'mgrDomain', title: '运营域名', ellipsis: true, width: 200 },
  { dataIndex: 'plan', title: '用户类型', width: 180 },
  { dataIndex: 'planExpireOn', title: '到期日', width: 120 },
  { dataIndex: 'planBalance', title: '余额', width: 180 },
  { dataIndex: 'mgrAdminUsername', title: '主账号', width: 140 },
  { dataIndex: 'mgrAdminState', title: '主账号状态', width: 110 },
  { dataIndex: 'state', title: '租户状态', width: 90 },
  { dataIndex: 'updatedAt', title: '更新时间', width: 170 },
  { dataIndex: 'action', fixed: 'right', title: '操作', width: 360 },
];

async function loadData() {
  loading.value = true;
  try {
    const page = await fetchTenantsApi(query);
    dataSource.value = page.records;
    total.value = page.total;
  } finally {
    loading.value = false;
  }
}

function onReset() {
  query.keyword = '';
  query.state = '';
  void loadData();
}

function asTenant(row: Record<string, unknown>) {
  return row as unknown as PlatTenant;
}

function onEdit(row: Record<string, unknown>) {
  drawerRef.value?.showEdit(asTenant(row));
}

function onAdmin(row: Record<string, any>) {
  adminRef.value?.show(row as PlatTenant);
}

function onDistribute(row: Record<string, any>) {
  void distributeRef.value?.show(row as PlatTenant);
}

function onBilling(row: Record<string, any>) {
  void billingRef.value?.show(row as PlatTenant);
}

function onAdjustBalance(row: Record<string, any>) {
  balanceRef.value?.show(row as PlatTenant);
}

function onDistributeLog(row: Record<string, any>) {
  void logRef.value?.show(row as PlatTenant);
}

function onToggleState(row: Record<string, any>) {
  void toggleState(row as PlatTenant);
}

async function toggleState(row: PlatTenant) {
  const next = row.state === 1 ? 0 : 1;
  await updateTenantStateApi(row.tenantId, next);
  message.success(next === 1 ? '已启用' : '已停用');
  await loadData();
}

async function onSaved(payload: Parameters<typeof saveTenantApi>[0]) {
  await saveTenantApi(payload);
  message.success('保存成功');
  await loadData();
}

onMounted(loadData);
</script>

<template>
  <Page auto-content-height title="运营租户">
    <div class="ap-page-stack">
      <Card :bordered="false" class="ap-page-filter">
        <Form layout="inline" @submit.prevent="loadData">
          <Form.Item label="关键词">
            <Input
              v-model:value="query.keyword"
              allow-clear
              placeholder="编码/名称/域名/主账号"
              style="width: 220px"
            />
          </Form.Item>
          <Form.Item label="状态">
            <Select
              v-model:value="query.state"
              allow-clear
              placeholder="全部"
              style="width: 120px"
              :options="[
                { label: '启用', value: 1 },
                { label: '停用', value: 0 },
              ]"
            />
          </Form.Item>
          <Form.Item class="ap-filter-actions">
            <FilterActions @reset="onReset" />
          </Form.Item>
        </Form>
      </Card>

      <Card :bordered="false">
        <div v-if="canEdit" class="ap-table-toolbar">
          <Button type="primary" @click="drawerRef?.showCreate()">
            新建运营端
          </Button>
        </div>
        <Table
          :columns="columns"
          :data-source="dataSource"
          :loading="loading"
          :pagination="{ total, showSizeChanger: true }"
          row-key="tenantId"
          :scroll="{ x: 1960 }"
          size="middle"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'plan'">
              {{ formatTenantPlan(asTenant(record)) }}
            </template>
            <template v-else-if="column.dataIndex === 'planExpireOn'">
              {{ formatTenantExpire(asTenant(record)) }}
            </template>
            <template v-else-if="column.dataIndex === 'planBalance'">
              <div v-if="record.planType === 'rate'" class="inline-action-cell">
                <Button
                  v-if="canEdit"
                  size="small"
                  type="primary"
                  class="inline-action-cell__action"
                  @click="onAdjustBalance(record)"
                >
                  调额
                </Button>
                <b
                  class="inline-action-cell__value"
                  :class="
                    (record.planBalance ?? 0) > 0
                      ? 'amount-positive'
                      : 'amount-negative'
                  "
                >
                  {{ formatTenantBalance(asTenant(record)) }}
                </b>
              </div>
              <template v-else>—</template>
            </template>
            <template v-else-if="column.dataIndex === 'mgrAdminState'">
              <Tag :color="record.mgrAdminState === 1 ? 'success' : 'default'">
                {{ record.mgrAdminState === 1 ? '启用' : '停用' }}
              </Tag>
            </template>
            <template v-else-if="column.dataIndex === 'state'">
              <Tag :color="record.state === 1 ? 'success' : 'default'">
                {{ record.state === 1 ? '启用' : '停用' }}
              </Tag>
            </template>
            <template v-else-if="column.dataIndex === 'action'">
              <div class="ap-table-ops">
                <Button
                  v-if="canEdit"
                  type="link"
                  size="small"
                  @click="onEdit(record)"
                >
                  编辑
                </Button>
                <Button
                  v-if="canAdmin"
                  type="link"
                  size="small"
                  @click="onAdmin(record)"
                >
                  主账号
                </Button>
                <Button
                  v-if="canDist"
                  type="link"
                  size="small"
                  @click="onDistribute(record)"
                >
                  接口下发
                </Button>
                <Button type="link" size="small" @click="onBilling(record)">
                  计费明细
                </Button>
                <Button
                  v-if="canDistLog"
                  type="link"
                  size="small"
                  @click="onDistributeLog(record)"
                >
                  下发记录
                </Button>
                <Button
                  v-if="canEdit"
                  type="link"
                  size="small"
                  @click="onToggleState(record)"
                >
                  {{ record.state === 1 ? '停用' : '启用' }}
                </Button>
              </div>
            </template>
          </template>
        </Table>
      </Card>
    </div>

    <TenantFormDrawer ref="drawerRef" @success="onSaved" />
    <TenantMgrAdminDrawer ref="adminRef" @success="loadData" />
    <TenantBalanceAdjustDialog ref="balanceRef" @success="loadData" />
    <TenantBillingDrawer ref="billingRef" @success="loadData" />
    <TenantDistributeDrawer ref="distributeRef" @success="loadData" />
    <TenantDistributeLogDrawer ref="logRef" />
  </Page>
</template>

<style scoped>
.inline-action-cell {
  display: flex;
  gap: 8px;
  align-items: center;
}

.inline-action-cell__value {
  font-weight: 600;
}

.amount-positive {
  color: #389e0d;
}

.amount-negative {
  color: #cf1322;
}
</style>

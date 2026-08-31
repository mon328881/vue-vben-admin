<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import {
  Button,
  Card,
  Form,
  Input,
  RangePicker,
  Space,
  Table,
} from 'ant-design-vue';

import { fetchPassageStatApi, fetchPassageStatCountApi } from '#/api';
import AsyncExportButtons from '#/components/export/AsyncExportButtons.vue';
import ExportReportListDialog from '#/components/export/ExportReportListDialog.vue';
import ListStatCards, {
  type ListStatCardItem,
} from '#/components/list/ListStatCards.vue';
import PassageGroupSelector from '#/components/selectors/PassageGroupSelector.vue';
import PassageSelector from '#/components/selectors/PassageSelector.vue';
import ProductSelector from '#/components/selectors/ProductSelector.vue';
import { usePassageStatExport } from '#/composables/use-async-export';

import { defaultWeekRange } from '#/utils/date-range';
import { formatDateTime, formatSuccessRate, formatYuan } from '#/utils/format';

import PassageRateDetailDrawer from '../components/PassageRateDetailDrawer.vue';

defineOptions({ name: 'PassageStatPage' });

const {
  exportLoading,
  exportProgress,
  reportListVisible,
  reportListLoading,
  reportListTitle,
  hasReportDownloads,
  completedExports,
  submitExport,
  restoreRunningTask,
  syncReportDownloadAvailability,
  openReportList,
  downloadFile,
  deleteCompletedItem,
} = usePassageStatExport();

const loading = ref(false);
const dataSource = ref<Record<string, unknown>[]>([]);
const total = ref(0);
const pagination = reactive({ current: 1, pageSize: 20 });
const dateRange = ref<[string, string] | undefined>(defaultWeekRange());
const query = reactive({
  payPassageName: '',
  payPassageId: '',
  productId: '',
  passageGroupName: '',
});
const stat = ref<Record<string, any>>({});
const rateDetailRef = ref<InstanceType<typeof PassageRateDetailDrawer>>();

const listStatItems = computed<ListStatCardItem[]>(() => [
  {
    title: '成交订单金额',
    value: Number(stat.value.totalSuccessAmount ?? 0) / 100,
    decimals: 2,
    prefix: '¥',
    icon: 'lucide:wallet',
  },
  {
    title: '成交订单数',
    value: Number(stat.value.totalSuccessCount ?? 0),
    icon: 'lucide:list-ordered',
  },
  {
    title: '通道成本',
    value: Number(stat.value.totalCost ?? 0) / 100,
    decimals: 2,
    prefix: '¥',
    icon: 'lucide:percent',
  },
]);

const columns: TableColumnsType = [
  { dataIndex: 'createdAt', title: '日期', width: 120 },
  { dataIndex: 'payPassageName', title: '通道名', width: 160 },
  { dataIndex: 'totalSuccessAmount', title: '成交金额', width: 120 },
  { dataIndex: 'totalPassageCost', title: '通道成本', width: 110 },
  { dataIndex: 'productName', title: '产品类型', width: 120 },
  { dataIndex: 'totalOrderCount', title: '订单总笔数', width: 110 },
  { dataIndex: 'orderSuccessCount', title: '成交笔数', width: 100 },
  { dataIndex: 'successRate', title: '支付成功率', width: 110 },
];

function buildParams() {
  const [createdStart, createdEnd] = dateRange.value ?? [];
  return {
    ...query,
    createdStart,
    createdEnd,
    pageNumber: pagination.current,
    pageSize: pagination.pageSize,
  };
}

async function loadStat() {
  try {
    stat.value = (await fetchPassageStatCountApi(buildParams())) ?? {};
  } catch {
    // ignore
  }
}

async function loadData(resetPage = false) {
  if (resetPage) pagination.current = 1;
  loading.value = true;
  try {
    void loadStat();
    const page = await fetchPassageStatApi(buildParams());
    dataSource.value = (page?.records as Record<string, unknown>[]) ?? [];
    total.value = page?.total ?? 0;
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  void loadData(true);
}

function onReset() {
  query.payPassageName = '';
  query.payPassageId = '';
  query.productId = '';
  query.passageGroupName = '';
  dateRange.value = defaultWeekRange();
  void loadData(true);
}

function onTableChange(pag: { current?: number; pageSize?: number }) {
  pagination.current = pag.current ?? 1;
  pagination.pageSize = pag.pageSize ?? 20;
  void loadData();
}

async function onExport() {
  await submitExport(buildParams());
}

function openRateDetail(row: Record<string, unknown>) {
  const payPassageId = Number(row.payPassageId);
  if (!Number.isFinite(payPassageId)) return;
  const dateRaw = String(row.createdAt ?? row.statisticsDate ?? '');
  rateDetailRef.value?.show({
    payPassageId,
    payPassageName: String(row.payPassageName ?? ''),
    statisticsDate: dateRaw.slice(0, 10),
  });
}

onMounted(async () => {
  await restoreRunningTask();
  await syncReportDownloadAvailability();
  void loadData(true);
});
</script>

<template>
  <Page auto-content-height title="通道统计">
    <div class="ap-page-stack">
      <Card class="ap-page-filter">
      <Form layout="inline" @finish="onSearch">
        <Form.Item>
          <RangePicker
            v-model:value="dateRange"
            show-time
            value-format="YYYY-MM-DD HH:mm:ss"
            :placeholder="['创建时间开始', '创建时间结束']"
          />
        </Form.Item>
        <Form.Item>
          <Input v-model:value="query.payPassageName" allow-clear placeholder="通道名" />
        </Form.Item>
        <Form.Item>
          <PassageSelector
            v-model="query.payPassageId"
            placeholder="对应通道"
          />
        </Form.Item>
        <Form.Item>
          <ProductSelector
            v-model="query.productId"
            placeholder="对应产品"
          />
        </Form.Item>
        <Form.Item>
          <PassageGroupSelector
            v-model="query.passageGroupName"
            placeholder="通道供应商"
          />
        </Form.Item>
        <Form.Item class="ap-filter-actions">
          <Space>
            <Button html-type="submit" type="primary">查询</Button>
            <Button @click="onReset">重置</Button>
            <AsyncExportButtons
              danger
              :loading="exportLoading"
              :progress="exportProgress"
              :has-report-downloads="hasReportDownloads"
              @export="onExport"
              @open-report-list="openReportList"
            />
          </Space>
        </Form.Item>
      </Form>
    </Card>
    <ListStatCards :items="listStatItems" />
    <Card>
      <Table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="{
          current: pagination.current,
          pageSize: pagination.pageSize,
          showSizeChanger: true,
          showTotal: (t: number) => `共 ${t} 条`,
          total,
        }"
        :row-key="(_r: any, i?: number) => String(i ?? 0)"
        size="middle"
        :scroll="{ x: 1200 }"
        @change="onTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="false" />
          <template v-else-if="column.dataIndex === 'payPassageName'">
            <button
              type="button"
              class="passage-rate-link"
              title="查看通道费率明细"
              @click="openRateDetail(record)"
            >
              <span class="passage-id">[{{ record.payPassageId ?? '--' }}]</span>
              <span>{{ record.payPassageName ?? '--' }}</span>
            </button>
          </template>
          <template v-else-if="column.dataIndex === 'totalSuccessAmount'">
            {{ formatYuan(record.totalSuccessAmount as number) }}
          </template>
          <template v-else-if="column.dataIndex === 'totalPassageCost'">
            {{ formatYuan(record.totalPassageCost as number) }}
          </template>
          <template v-else-if="column.dataIndex === 'successRate'">
            {{
              formatSuccessRate(
                record.orderSuccessCount as number,
                record.totalOrderCount as number,
              )
            }}
          </template>
          <template v-else-if="column.dataIndex === 'createdAt'">
            {{ formatDateTime(record.createdAt as string) }}
          </template>
        </template>
      </Table>
    </Card>
    <PassageRateDetailDrawer ref="rateDetailRef" />
    <ExportReportListDialog
      v-model:visible="reportListVisible"
      :loading="reportListLoading"
      :title="reportListTitle"
      :data="completedExports"
      @download="downloadFile"
      @remove="deleteCompletedItem"
    />
    </div>
  </Page>
</template>

<style scoped>
.passage-rate-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: 0;
  background: transparent;
  color: hsl(var(--primary));
  cursor: pointer;
  text-align: left;
}

.passage-rate-link:hover {
  text-decoration: underline;
}

.passage-id {
  font-weight: 500;
}
</style>

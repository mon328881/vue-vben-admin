<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import {
  Card,
  Form,
  Input,
  RangePicker,
  Table,
} from 'ant-design-vue';

import { fetchAgentStatApi, fetchAgentStatCountApi } from '#/api';
import AsyncExportButtons from '#/components/export/AsyncExportButtons.vue';
import ExportReportListDialog from '#/components/export/ExportReportListDialog.vue';
import FilterActions from '#/components/list/FilterActions.vue';
import ListStatCards from '#/components/list/ListStatCards.vue';
import AmountText from '@asiapay/shared/components/AmountText.vue';
import { useAgentStatExport } from '#/composables/use-async-export';
import { useListStat } from '#/composables/use-list-stat';

import { defaultWeekRange } from '#/utils/date-range';
import {
  fenToYuanNumber,
  formatDateTime,
  formatSuccessRate,
} from '#/utils/format';

defineOptions({ name: 'AgentStatPage' });

const {
  exportLoading,
  exportProgress,
  reportListVisible,
  reportListLoading,
  reportListTitle,
  reportListEmptyHint,
  hasReportDownloads,
  completedExports,
  submitExport,
  restoreRunningTask,
  syncReportDownloadAvailability,
  openReportList,
  downloadFile,
  deleteCompletedItem,
} = useAgentStatExport();

const loading = ref(false);
const dataSource = ref<Record<string, unknown>[]>([]);
const total = ref(0);
const pagination = reactive({ current: 1, pageSize: 20 });
const dateRange = ref<[string, string] | undefined>(defaultWeekRange());
const query = reactive({
  agentName: '',
  agentNo: '',
});
const stat = ref<Record<string, any>>({});
const { loadStatSafely, buildStatItems } = useListStat();

const listStatItems = buildStatItems(() => [
  {
    title: '成交订单金额',
    value: fenToYuanNumber(stat.value.totalSuccessAmount),
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
    title: '代理分润',
    value: fenToYuanNumber(stat.value.totalAgentIncome),
    decimals: 2,
    prefix: '¥',
    tone: 'positive',
    icon: 'lucide:trending-up',
  },
]);

const columns: TableColumnsType = [
  { dataIndex: 'createdAt', title: '日期', width: 120 },
  { dataIndex: 'agentNo', title: '代理号', width: 120 },
  { dataIndex: 'agentName', title: '代理名称', width: 140 },
  { dataIndex: 'totalSuccessAmount', title: '成交金额', width: 120 },
  { dataIndex: 'totalAmount', title: '订单金额', width: 120 },
  { dataIndex: 'totalAgentIncome', title: '代理分润', width: 110 },
  { dataIndex: 'successRate', title: '支付成功率', width: 110 },
  { dataIndex: 'totalOrderCount', title: '订单总笔数', width: 110 },
  { dataIndex: 'orderSuccessCount', title: '成交笔数', width: 100 },
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
  await loadStatSafely(async () => {
    stat.value = (await fetchAgentStatCountApi(buildParams())) ?? {};
  });
}

async function loadData(resetPage = false) {
  if (resetPage) pagination.current = 1;
  loading.value = true;
  try {
    void loadStat();
    const page = await fetchAgentStatApi(buildParams());
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
  query.agentName = '';
  query.agentNo = '';
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

onMounted(async () => {
  await restoreRunningTask();
  await syncReportDownloadAvailability();
  void loadData(true);
});
</script>

<template>
  <Page auto-content-height title="代理统计">
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
          <Input v-model:value="query.agentName" allow-clear placeholder="代理名称" />
        </Form.Item>
        <Form.Item>
          <Input v-model:value="query.agentNo" allow-clear placeholder="代理商号" />
        </Form.Item>
        <Form.Item class="ap-filter-actions">
          <FilterActions @reset="onReset" />
        </Form.Item>
      </Form>
    </Card>
    <ListStatCards :items="listStatItems" />
    <Card>
      <div class="ap-table-toolbar">
        <AsyncExportButtons
          danger
          :loading="exportLoading"
          :progress="exportProgress"
          :has-report-downloads="hasReportDownloads"
          @export="onExport"
          @open-report-list="openReportList"
        />
      </div>
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
          <template v-else-if="column.dataIndex === 'totalSuccessAmount'">
            <AmountText
              :value="record.totalSuccessAmount as number"
              kind="plain"
            />
          </template>
          <template v-else-if="column.dataIndex === 'totalAmount'">
            <AmountText
              :value="record.totalAmount as number"
              kind="plain"
            />
          </template>
          <template v-else-if="column.dataIndex === 'totalAgentIncome'">
            <AmountText
              :value="record.totalAgentIncome as number"
              kind="signed"
            />
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
    <ExportReportListDialog
      v-model:visible="reportListVisible"
      :loading="reportListLoading"
      :title="reportListTitle"
      :empty-hint="reportListEmptyHint"
      :data="completedExports"
      @download="downloadFile"
      @remove="deleteCompletedItem"
    />
    </div>
  </Page>
</template>

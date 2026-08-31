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

import { fetchAgentStatApi, fetchAgentStatCountApi } from '#/api';
import AsyncExportButtons from '#/components/export/AsyncExportButtons.vue';
import ExportReportListDialog from '#/components/export/ExportReportListDialog.vue';
import ListStatCards, {
  type ListStatCardItem,
} from '#/components/list/ListStatCards.vue';
import { useAgentStatExport } from '#/composables/use-async-export';

import { defaultWeekRange } from '#/utils/date-range';
import { formatDateTime, formatRateDecimal, formatYuan } from '#/utils/format';

defineOptions({ name: 'AgentStatPage' });

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
    title: '代理分润',
    value: Number(stat.value.totalAgentIncome ?? 0) / 100,
    decimals: 2,
    prefix: '¥',
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
  try {
    stat.value = (await fetchAgentStatCountApi(buildParams())) ?? {};
  } catch {
    // ignore
  }
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
          <template v-else-if="column.dataIndex === 'totalSuccessAmount'">
            {{ formatYuan(record.totalSuccessAmount as number) }}
          </template>
          <template v-else-if="column.dataIndex === 'totalAmount'">
            {{ formatYuan(record.totalAmount as number) }}
          </template>
          <template v-else-if="column.dataIndex === 'totalAgentIncome'">
            {{ formatYuan(record.totalAgentIncome as number) }}
          </template>
          <template v-else-if="column.dataIndex === 'successRate'">
            {{ formatRateDecimal(record.successRate as number) }}
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
      :data="completedExports"
      @download="downloadFile"
      @remove="deleteCompletedItem"
    />
    </div>
  </Page>
</template>

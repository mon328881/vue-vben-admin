<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import {
  Card,
  Form,
  Input,
  RangePicker,
  Select,
  Table,
} from 'ant-design-vue';

import { fetchAgentHistoryApi, fetchAgentHistoryStatApi } from '#/api';
import AsyncExportButtons from '#/components/export/AsyncExportButtons.vue';
import ExportReportListDialog from '#/components/export/ExportReportListDialog.vue';
import FilterActions from '#/components/list/FilterActions.vue';
import ListStatCards, {
  type ListStatCardItem,
} from '#/components/list/ListStatCards.vue';
import { useAgentHistoryExport } from '#/composables/use-async-export';
import { FUND_DIRECTION_OPTIONS, AGENT_BIZ_TYPE_OPTIONS, bizTypeLabel } from '#/constants/merchant';
import { formatDateTime, formatYuan } from '#/utils/format';
import { defaultTodayRange } from '#/utils/date-range';

defineOptions({ name: 'AgentHistoryListPage' });

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
} = useAgentHistoryExport();

const loading = ref(false);
const dataSource = ref<Record<string, unknown>[]>([]);
const total = ref(0);
const pagination = reactive({ current: 1, pageSize: 20 });
const dateRange = ref<[string, string] | undefined>(defaultTodayRange());
const query = reactive({
  agentNo: '' as any,
  agentName: '' as any,
  payOrderId: '' as any,
  fundDirection: '' as any,
  bizType: '' as any,
});
const stat = ref<{ totalAmount?: number; totalCount?: number }>({});

const listStatItems = computed<ListStatCardItem[]>(() => {
  const s = stat.value;
  return [
    {
      title: '变更金额汇总',
      value: Number(s.totalAmount ?? 0) / 100,
      decimals: 2,
      prefix: '¥',
      icon: 'lucide:wallet',
    },
    {
      title: '记录条数',
      value: Number(s.totalCount ?? 0),
      icon: 'lucide:list-ordered',
    },
  ];
});

const columns: TableColumnsType = [
  { dataIndex: 'agentName', title: '代理商名称', width: 140 },
  { dataIndex: 'agentNo', title: '代理商账号', width: 130 },
  { dataIndex: 'beforeBalance', title: '变更前余额', width: 120 },
  { dataIndex: 'amount', title: '变更金额', width: 120 },
  { dataIndex: 'afterBalance', title: '变更后余额', width: 120 },
  { dataIndex: 'payOrderId', title: '订单号', width: 180 },
  { dataIndex: 'bizType', title: '业务类型', width: 100 },
  { dataIndex: 'createdAt', title: '创建日期', width: 170 },
  { dataIndex: 'remark', title: '备注', ellipsis: true },
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
    stat.value = (await fetchAgentHistoryStatApi(buildParams())) ?? {};
  } catch {
    // ignore
  }
}

async function loadData(resetPage = false) {
  if (resetPage) pagination.current = 1;
  loading.value = true;
  try {
    void loadStat();
    const page = await fetchAgentHistoryApi(buildParams());
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
  query.agentNo = '';
  query.agentName = '';
  query.payOrderId = '';
  query.fundDirection = '';
  query.bizType = '';
  dateRange.value = defaultTodayRange();
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
  <Page auto-content-height title="代理资金流水">
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
          <Input v-model:value="query.agentNo" allow-clear placeholder="代理商账号" />
        </Form.Item>
        <Form.Item>
          <Input v-model:value="query.agentName" allow-clear placeholder="代理商名称" />
        </Form.Item>
        <Form.Item>
          <Input v-model:value="query.payOrderId" allow-clear placeholder="订单号" />
        </Form.Item>
        <Form.Item>
          <Select
            v-model:value="query.fundDirection"
            allow-clear
            placeholder="资金变动方向"
            style="width: 140px"
            :options="FUND_DIRECTION_OPTIONS"
          />
        </Form.Item>
        <Form.Item>
          <Select
            v-model:value="query.bizType"
            allow-clear
            placeholder="业务类型"
            style="width: 140px"
            :options="AGENT_BIZ_TYPE_OPTIONS"
          />
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
        :row-key="(r: any, i?: number) => String(r.agentName ?? i ?? 0)"
        size="middle"
        :scroll="{ x: 1200 }"
        @change="onTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="false" />
          <template v-else-if="column.dataIndex === 'beforeBalance'">
            {{ formatYuan(record.beforeBalance as number) }}
          </template>
          <template v-else-if="column.dataIndex === 'amount'">
            {{ formatYuan(record.amount as number) }}
          </template>
          <template v-else-if="column.dataIndex === 'afterBalance'">
            {{ formatYuan(record.afterBalance as number) }}
          </template>
          <template v-else-if="column.dataIndex === 'createdAt'">
            {{ formatDateTime(record.createdAt as string) }}
          </template>
          <template v-else-if="column.dataIndex === 'bizType'">
            {{ bizTypeLabel(record.bizType as any, AGENT_BIZ_TYPE_OPTIONS) }}
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

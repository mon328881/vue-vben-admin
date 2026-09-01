<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import {
  Card,
  Col,
  DatePicker,
  Form,
  Row,
  Table,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchDayStatCountApi, fetchDayStatListApi } from '#/api';
import type { AgentDayStat } from '#/api/types/business';
import AsyncExportButtons from '#/components/export/AsyncExportButtons.vue';
import ExportReportListDialog from '#/components/export/ExportReportListDialog.vue';
import FilterActions from '#/components/list/FilterActions.vue';
import ListStatCards, {
  type ListStatCardItem,
} from '#/components/list/ListStatCards.vue';
import { useAgentDayStatExport } from '#/composables/use-async-export';
import {
  defaultWeekRange,
  formatDateOnly,
} from '#/utils/date-range';
import { formatDateTime, formatSuccessRate, formatYuan } from '#/utils/format';

defineOptions({ name: 'AgentDayStatPage' });

const query = reactive({
  pageNumber: 1,
  pageSize: 20,
  createdStart: '',
  createdEnd: '',
});
const createdRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>();
const list = ref<AgentDayStat[]>([]);
const total = ref(0);
const loading = ref(false);
const searchLoading = ref(false);
const summary = reactive({
  totalSuccessAmount: 0,
  totalSuccessCount: 0,
  totalAgentIncome: 0,
});

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
} = useAgentDayStatExport();

const listStatItems = computed<ListStatCardItem[]>(() => [
  {
    title: '成交订单金额',
    value: Number(summary.totalSuccessAmount ?? 0) / 100,
    decimals: 2,
    prefix: '¥',
    icon: 'lucide:wallet',
  },
  {
    title: '成交订单数',
    value: Number(summary.totalSuccessCount ?? 0),
    icon: 'lucide:list-ordered',
  },
  {
    title: '代理收入',
    value: Number(summary.totalAgentIncome ?? 0) / 100,
    decimals: 2,
    prefix: '¥',
    icon: 'lucide:trending-up',
  },
]);

const columns: TableColumnsType<AgentDayStat> = [
  { dataIndex: 'statisticsDate', title: '日期', width: 140 },
  { dataIndex: 'agentNo', title: '代理号', width: 140 },
  { dataIndex: 'agentName', title: '代理名', width: 140, ellipsis: true },
  { dataIndex: 'totalSuccessAmount', title: '成交额' },
  { dataIndex: 'totalAgentIncome', title: '代理收入' },
  { dataIndex: 'successRate', title: '支付成功率' },
  { dataIndex: 'totalOrderCount', title: '订单总笔数' },
  { dataIndex: 'orderSuccessCount', title: '成交笔数' },
  { dataIndex: 'createdAt', title: '创建日期', width: 180 },
];

function syncRange() {
  if (createdRange.value?.[0] && createdRange.value?.[1]) {
    // 选择器展示 00:00:00 ~ 23:59:59；agentDayStat 按 statisticsDate 过滤，API 传 yyyy-MM-dd
    query.createdStart = formatDateOnly(createdRange.value[0].toDate());
    query.createdEnd = formatDateOnly(createdRange.value[1].toDate());
  } else {
    query.createdStart = '';
    query.createdEnd = '';
  }
}

function filters() {
  syncRange();
  return {
    createdEnd: query.createdEnd || undefined,
    createdStart: query.createdStart || undefined,
  };
}

async function loadSummary() {
  try {
    const data = await fetchDayStatCountApi(filters());
    summary.totalSuccessAmount = data?.totalSuccessAmount ?? 0;
    summary.totalSuccessCount = data?.totalSuccessCount ?? 0;
    summary.totalAgentIncome = data?.totalAgentIncome ?? 0;
  } catch (error) {
    console.error(error);
  }
}

async function load() {
  loading.value = true;
  try {
    const data = await fetchDayStatListApi({
      pageNumber: query.pageNumber,
      pageSize: query.pageSize,
      ...filters(),
    });
    list.value = data.records ?? [];
    total.value = data.total ?? 0;
  } catch (error) {
    message.error(error instanceof Error ? error.message : '加载失败');
  } finally {
    loading.value = false;
    searchLoading.value = false;
  }
}

async function onSearch() {
  query.pageNumber = 1;
  searchLoading.value = true;
  await loadSummary();
  await load();
}

function applyDefaultRange() {
  const [start, end] = defaultWeekRange();
  createdRange.value = [dayjs(start), dayjs(end)];
  query.createdStart = formatDateOnly(dayjs(start).toDate());
  query.createdEnd = formatDateOnly(dayjs(end).toDate());
}

function onReset() {
  applyDefaultRange();
  query.pageNumber = 1;
  searchLoading.value = true;
  void loadSummary();
  void load();
}

function onExport() {
  submitExport(filters());
}

onMounted(async () => {
  applyDefaultRange();
  searchLoading.value = true;
  await loadSummary();
  await load();
  await restoreRunningTask();
  await syncReportDownloadAvailability();
});
</script>

<template>
  <Page auto-content-height title="日终统计">
    <div class="ap-page-stack">
      <Card class="ap-page-filter">
        <Form class="ap-pay-order-filter" @finish="onSearch">
          <Row :gutter="[16, 16]">
            <Col :lg="8" :md="12" :span="24">
              <Form.Item>
                <DatePicker.RangePicker
                  v-model:value="createdRange"
                  show-time
                  style="width: 100%"
                  :placeholder="['统计日期开始', '统计日期结束']"
                />
              </Form.Item>
            </Col>
            <Col :lg="16" :md="12" :span="24" class="ap-filter-actions">
              <FilterActions
                submit-text="搜索"
                :loading="searchLoading"
                @reset="onReset"
              />
            </Col>
          </Row>
        </Form>
      </Card>

      <ListStatCards :items="listStatItems" />

      <Card>
        <div class="ap-table-toolbar">
          <AsyncExportButtons
            danger
            :has-report-downloads="hasReportDownloads"
            :loading="exportLoading"
            :progress="exportProgress"
            @export="onExport"
            @open-report-list="openReportList"
          />
        </div>
        <Table
          :columns="columns"
          :data-source="list"
          :loading="loading"
          :pagination="{
            current: query.pageNumber,
            pageSize: query.pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
          }"
          row-key="statisticsAgentId"
          @change="
            (p) => {
              query.pageNumber = p.current ?? 1;
              query.pageSize = p.pageSize ?? 20;
              load();
            }
          "
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'statisticsDate'">
              <b>{{
                String(record.statisticsDate || record.createdAt || '').slice(
                  0,
                  10,
                ) || '—'
              }}</b>
            </template>
            <template v-else-if="column.dataIndex === 'totalSuccessAmount'">
              <b class="amount-positive">{{
                formatYuan(record.totalSuccessAmount)
              }}</b>
            </template>
            <template v-else-if="column.dataIndex === 'totalAgentIncome'">
              <b>{{ formatYuan(record.totalAgentIncome) }}</b>
            </template>
            <template v-else-if="column.dataIndex === 'successRate'">
              <b>{{
                formatSuccessRate(
                  record.orderSuccessCount,
                  record.totalOrderCount,
                )
              }}</b>
            </template>
            <template v-else-if="column.dataIndex === 'totalOrderCount'">
              {{ record.totalOrderCount || 0 }}
            </template>
            <template v-else-if="column.dataIndex === 'orderSuccessCount'">
              {{ record.orderSuccessCount || 0 }}
            </template>
            <template v-else-if="column.dataIndex === 'createdAt'">
              {{ formatDateTime(record.createdAt) }}
            </template>
          </template>
        </Table>
      </Card>
    </div>

    <ExportReportListDialog
      v-model:visible="reportListVisible"
      :data="completedExports"
      :loading="reportListLoading"
      :title="reportListTitle"
      :empty-hint="reportListEmptyHint"
      @download="downloadFile"
      @remove="deleteCompletedItem"
    />
  </Page>
</template>

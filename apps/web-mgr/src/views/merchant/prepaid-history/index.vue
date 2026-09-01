<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import {
  Card,
  Form,
  Input,
  RangePicker,
  Select,
  Table,
  message,
} from 'ant-design-vue';

import { fetchMchPrepaidHistoryApi, fetchMchPrepaidHistoryStatApi } from '#/api';
import type { PrepaidHistoryStat } from '#/api/modules/history';
import type { MchPrepaidHistory } from '#/api/types/business';
import HistoryPrepaidOperatorCell from '#/components/prepaid/HistoryPrepaidOperatorCell.vue';
import PicPreviewButton from '#/components/prepaid/PicPreviewButton.vue';
import PrepaidHistoryStatCards from '#/components/prepaid/PrepaidHistoryStatCards.vue';
import AsyncExportButtons from '#/components/export/AsyncExportButtons.vue';
import ExportReportListDialog from '#/components/export/ExportReportListDialog.vue';
import FilterActions from '#/components/list/FilterActions.vue';
import { useMchPrepaidHistoryExport } from '#/composables/use-async-export';
import { useListStat } from '#/composables/use-list-stat';
import { FUND_DIRECTION_OPTIONS } from '#/constants/merchant';
import {
  cleanListParams,
  defaultTodayRange,
  toDateTimeParam,
} from '#/utils/date-range';
import {
  amountSignedClass,
  formatDateTime,
  formatExchangeRate,
  formatOptionalText,
  formatPrepaidQuantity,
  formatYuan,
  signedYuan,
} from '#/utils/format';

defineOptions({ name: 'MchPrepaidHistoryListPage' });

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
} = useMchPrepaidHistoryExport();

const loading = ref(false);
const dataSource = ref<MchPrepaidHistory[]>([]);
const total = ref(0);
const pagination = reactive({ current: 1, pageSize: 20 });
const dateRange = ref<[string, string] | undefined>(defaultTodayRange());
const query = reactive({
  mchNo: '' as any,
  mchName: '' as any,
  fundDirection: '' as any,
});
const stat = ref<PrepaidHistoryStat>({});
const { loadStatSafely } = useListStat();

const columns: TableColumnsType<MchPrepaidHistory> = [
  { dataIndex: 'mchNo', title: '商户号', width: 130 },
  { dataIndex: 'mchName', title: '商户名称', width: 140, ellipsis: true },
  { dataIndex: 'beforeBalance', title: '变更前预付', width: 120 },
  { dataIndex: 'amount', title: '变更金额', width: 120 },
  { dataIndex: 'afterBalance', title: '变更后预付', width: 120 },
  { dataIndex: 'currencyType', title: '货币类型', width: 100 },
  { dataIndex: 'quantity', title: '数量', width: 110 },
  { dataIndex: 'exchangeRate', title: '汇率', width: 100 },
  { dataIndex: 'pic', title: '凭证', width: 80, align: 'center' },
  { dataIndex: 'operator', title: '操作员', width: 200 },
  { dataIndex: 'remark', title: '备注', ellipsis: true, width: 160 },
  { dataIndex: 'createdAt', title: '操作时间', width: 170 },
];

function buildParams() {
  return cleanListParams({
    ...query,
    createdStart: toDateTimeParam(dateRange.value?.[0]),
    createdEnd: toDateTimeParam(dateRange.value?.[1]),
    pageNumber: pagination.current,
    pageSize: pagination.pageSize,
  });
}

async function loadStat() {
  await loadStatSafely(async () => {
    stat.value = (await fetchMchPrepaidHistoryStatApi(buildParams())) ?? {};
  });
}

async function loadData(resetPage = false) {
  if (resetPage) pagination.current = 1;
  loading.value = true;
  try {
    void loadStat();
    const page = await fetchMchPrepaidHistoryApi(buildParams());
    dataSource.value = page?.records ?? [];
    total.value = page?.total ?? 0;
  } catch (error) {
    dataSource.value = [];
    total.value = 0;
    message.error(error instanceof Error ? error.message : '加载商户预付流水失败');
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  void loadData(true);
}

function onReset() {
  query.mchNo = '';
  query.mchName = '';
  query.fundDirection = '';
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
  <Page auto-content-height title="商户预付流水">
    <div class="ap-page-stack">
      <Card class="ap-page-filter">
        <Form layout="inline" @submit="onSearch">
          <Form.Item>
            <RangePicker
              v-model:value="dateRange"
              show-time
              value-format="YYYY-MM-DD HH:mm:ss"
              :placeholder="['操作时间开始', '操作时间结束']"
            />
          </Form.Item>
          <Form.Item>
            <Input v-model:value="query.mchNo" allow-clear placeholder="商户号" />
          </Form.Item>
          <Form.Item>
            <Input v-model:value="query.mchName" allow-clear placeholder="商户名称" />
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
          <Form.Item class="ap-filter-actions">
            <FilterActions @search="onSearch" @reset="onReset" />
          </Form.Item>
        </Form>
      </Card>
      <PrepaidHistoryStatCards :stat="stat" />
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
          row-key="mchPrepaidHistoryId"
          size="middle"
          :scroll="{ x: 1500 }"
          @change="onTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'beforeBalance'">
              <b>{{ formatYuan(record.beforeBalance) }}</b>
            </template>
            <template v-else-if="column.dataIndex === 'amount'">
              <b :class="amountSignedClass(record.amount)">
                {{ signedYuan(record.amount) }}
              </b>
            </template>
            <template v-else-if="column.dataIndex === 'afterBalance'">
              <b>{{ formatYuan(record.afterBalance) }}</b>
            </template>
            <template v-else-if="column.dataIndex === 'currencyType'">
              {{ formatOptionalText(record.currencyType) }}
            </template>
            <template v-else-if="column.dataIndex === 'quantity'">
              {{ formatPrepaidQuantity(record.quantity) }}
            </template>
            <template v-else-if="column.dataIndex === 'exchangeRate'">
              {{ formatExchangeRate(record.exchangeRate) }}
            </template>
            <template v-else-if="column.dataIndex === 'pic'">
              <PicPreviewButton :pic="record.pic" />
            </template>
            <template v-else-if="column.dataIndex === 'operator'">
              <HistoryPrepaidOperatorCell
                :created-login-name="record.createdLoginName"
                :created-uid="record.createdUid"
              />
            </template>
            <template v-else-if="column.dataIndex === 'createdAt'">
              {{ formatDateTime(record.createdAt) }}
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

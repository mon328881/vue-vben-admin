<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { reactive, ref } from 'vue';

import {
  DatePicker,
  Drawer,
  Form,
  Select,
  Table,
  Tag,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  fetchMchPrepaidHistoryApi,
  fetchMchPrepaidHistoryStatApi,
} from '#/api';
import type { MchInfoDetail, MchPrepaidHistory } from '#/api/types/business';
import HistoryPrepaidOperatorCell from '#/components/prepaid/HistoryPrepaidOperatorCell.vue';
import PicPreviewButton from '#/components/prepaid/PicPreviewButton.vue';
import AsyncExportButtons from '#/components/export/AsyncExportButtons.vue';
import ExportReportListDialog from '#/components/export/ExportReportListDialog.vue';
import FilterActions from '#/components/list/FilterActions.vue';
import { FUND_DIRECTION_OPTIONS } from '#/constants/history';
import { useMchPrepaidHistoryExport } from '#/composables/use-async-export';
import { defaultTodayRange, formatDayEnd, formatDayStart } from '#/utils/date-range';
import {
  amountSignedClass,
  formatDateTime,
  formatExchangeRate,
  formatOptionalText,
  formatPrepaidQuantity,
  formatYuan,
  signedYuan,
} from '#/utils/format';

defineOptions({ name: 'MchPrepaidHistoryDrawer' });

const visible = ref(false);
const loading = ref(false);
const mch = ref<Pick<MchInfoDetail, 'mchNo' | 'mchName'>>({
  mchNo: '',
  mchName: '',
});
const list = ref<MchPrepaidHistory[]>([]);
const total = ref(0);
const pageNumber = ref(1);
const pageSize = ref(20);
const summary = reactive({ totalAmount: 0, totalCount: 0 });
const createdRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>();
const fundDirection = ref<number | undefined>();

const columns: TableColumnsType<MchPrepaidHistory> = [
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
} = useMchPrepaidHistoryExport();

function filters() {
  let createdStart: string | undefined;
  let createdEnd: string | undefined;
  if (createdRange.value?.[0] && createdRange.value?.[1]) {
    createdStart = formatDayStart(createdRange.value[0].toDate());
    createdEnd = formatDayEnd(createdRange.value[1].toDate());
  }
  return {
    createdEnd,
    createdStart,
    fundDirection: fundDirection.value,
  };
}

async function loadSummary() {
  try {
    const data = await fetchMchPrepaidHistoryStatApi(filters());
    summary.totalAmount = data?.totalAmount ?? 0;
    summary.totalCount = data?.totalCount ?? 0;
  } catch (error) {
    console.error(error);
  }
}

async function load() {
  loading.value = true;
  try {
    const data = await fetchMchPrepaidHistoryApi({
      pageNumber: pageNumber.value,
      pageSize: pageSize.value,
      ...filters(),
    });
    list.value = data.records ?? [];
    total.value = data.total ?? 0;
  } finally {
    loading.value = false;
  }
}

async function onSearch() {
  pageNumber.value = 1;
  await loadSummary();
  await load();
}

function applyToday() {
  const [start, end] = defaultTodayRange();
  createdRange.value = [dayjs(start), dayjs(end)];
}

function onReset() {
  fundDirection.value = undefined;
  applyToday();
  onSearch();
}

async function show(info: Pick<MchInfoDetail, 'mchNo' | 'mchName'>) {
  mch.value = info;
  fundDirection.value = undefined;
  applyToday();
  pageNumber.value = 1;
  visible.value = true;
  await onSearch();
  await restoreRunningTask();
  await syncReportDownloadAvailability();
}

function onExport() {
  submitExport(filters());
}

async function onPageChange(current: number, size: number) {
  pageNumber.value = current;
  pageSize.value = size;
  await load();
}

defineExpose({ show });
</script>

<template>
  <Drawer
    v-model:open="visible"
    title="预付流水记录"
    width="1200"
    destroy-on-close
    :footer="false"
  >
    <div class="ap-drawer-body">
      <div class="ap-drawer-section ap-drawer-mch-info">
        <span>商户名称: </span>
        [<span class="text-primary font-semibold">{{ mch.mchNo || '--' }}</span>]
        <span class="text-muted-foreground ml-1 font-semibold">
          {{ mch.mchName || '--' }}
        </span>
      </div>

      <div class="ap-drawer-section">
        <Form layout="inline" class="ap-drawer-filter" @finish="onSearch">
          <Form.Item>
            <DatePicker.RangePicker
              v-model:value="createdRange"
              show-time
              style="width: 400px"
              :placeholder="['创建时间开始', '创建时间结束']"
            />
          </Form.Item>
          <Form.Item>
            <Select
              v-model:value="fundDirection"
              allow-clear
              placeholder="资金变动方向"
              style="width: 140px"
              :options="FUND_DIRECTION_OPTIONS"
            />
          </Form.Item>
          <Form.Item class="ap-drawer-filter-actions">
            <FilterActions
              submit-text="搜索"
              :loading="loading"
              @reset="onReset"
            >
              <AsyncExportButtons
                danger
                :has-report-downloads="hasReportDownloads"
                :loading="exportLoading"
                :progress="exportProgress"
                @export="onExport"
                @open-report-list="openReportList"
              />
            </FilterActions>
          </Form.Item>
        </Form>
      </div>

      <div class="ap-drawer-section flex items-center gap-2">
        <span class="font-semibold">变更金额汇总：</span>
        <Tag color="blue">{{ formatYuan(summary.totalAmount) }}</Tag>
        <span class="font-semibold">记录条数：</span>
        <Tag color="success">{{ summary.totalCount || 0 }}</Tag>
      </div>

      <div class="ap-drawer-section ap-drawer-table-card">
        <Table
          :columns="columns"
          :data-source="list"
          :loading="loading"
          :pagination="{
            current: pageNumber,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
          }"
          :row-key="(record) => record.mchPrepaidHistoryId ?? record.id ?? ''"
          size="middle"
          :scroll="{ x: 1200 }"
          @change="(p) => onPageChange(p.current ?? 1, p.pageSize ?? 20)"
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
                :created-login-name="record.createdLoginName || record.operator"
                :created-uid="record.createdUid"
              />
            </template>
            <template v-else-if="column.dataIndex === 'remark'">
              {{ record.remark || '—' }}
            </template>
            <template v-else-if="column.dataIndex === 'createdAt'">
              {{ formatDateTime(record.createdAt) }}
            </template>
          </template>
        </Table>
      </div>
    </div>

    <ExportReportListDialog
      v-model:visible="reportListVisible"
      :data="completedExports"
      :loading="reportListLoading"
      :title="reportListTitle"
      @download="downloadFile"
      @remove="deleteCompletedItem"
    />

  </Drawer>
</template>

<style scoped>
.amount-positive {
  color: hsl(142 71% 40%);
}

.amount-negative {
  color: hsl(var(--destructive));
}
</style>

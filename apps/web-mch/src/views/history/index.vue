<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchHistoryCountApi, fetchHistoryListApi } from '#/api';
import type { MchAccountHistory } from '#/api/types/business';
import AsyncExportButtons from '#/components/export/AsyncExportButtons.vue';
import ExportReportListDialog from '#/components/export/ExportReportListDialog.vue';
import CellCopyStack from '#/components/table/CellCopyStack.vue';
import {
  BIZ_TYPE_OPTIONS,
  FUND_DIRECTION_OPTIONS,
  bizTypeLabel,
} from '#/constants/history';
import { useMchHistoryExport } from '#/composables/use-async-export';
import { hasEnt } from '#/utils/access';
import {
  defaultTodayRange,
  formatDayEnd,
  formatDayStart,
} from '#/utils/date-range';
import {
  amountSignedClass,
  formatDateTime,
  formatYuan,
  signedYuan,
} from '#/utils/format';

defineOptions({ name: 'MchHistoryPage' });

const query = reactive({
  pageNumber: 1,
  pageSize: 50,
  mchOrderNo: '',
  payOrderId: '',
  fundDirection: undefined as number | undefined,
  bizType: undefined as number | undefined,
  createdStart: '',
  createdEnd: '',
});
const createdRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>();
const list = ref<MchAccountHistory[]>([]);
const total = ref(0);
const loading = ref(false);
const summary = reactive({ totalAmount: 0, totalCount: 0 });

const canCount = computed(
  () => hasEnt('ENT_C_MAIN_PAY_COUNT'),
);

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
} = useMchHistoryExport();

const columns: TableColumnsType<MchAccountHistory> = [
  { dataIndex: 'mchNo', title: '商户号', width: 140 },
  { dataIndex: 'mchName', title: '商户名', ellipsis: true },
  { dataIndex: 'beforeBalance', title: '变更前余额', width: 130 },
  { dataIndex: 'amount', title: '变更金额', width: 120 },
  { dataIndex: 'afterBalance', title: '变更后余额', width: 130 },
  { dataIndex: 'orderNo', title: '订单号（点击复制）', width: 280, ellipsis: true },
  { dataIndex: 'payOrderAmount', title: '订单金额', width: 120 },
  { dataIndex: 'bizType', title: '业务类型', width: 100 },
  { dataIndex: 'createdAt', title: '创建日期', width: 180 },
  { dataIndex: 'remark', title: '备注', ellipsis: true },
];

function syncRange() {
  if (createdRange.value?.[0] && createdRange.value?.[1]) {
    query.createdStart = formatDayStart(createdRange.value[0].toDate());
    query.createdEnd = formatDayEnd(createdRange.value[1].toDate());
  } else {
    query.createdStart = '';
    query.createdEnd = '';
  }
}

function filters() {
  syncRange();
  return {
    bizType: query.bizType,
    createdEnd: query.createdEnd || undefined,
    createdStart: query.createdStart || undefined,
    fundDirection: query.fundDirection,
    mchOrderNo: query.mchOrderNo || undefined,
    payOrderId: query.payOrderId || undefined,
  };
}

async function loadSummary() {
  if (!canCount.value) return;
  try {
    const data = await fetchHistoryCountApi(filters());
    summary.totalAmount = data?.totalAmount ?? 0;
    summary.totalCount = data?.totalCount ?? 0;
  } catch (error) {
    console.error(error);
  }
}

async function load() {
  loading.value = true;
  try {
    const data = await fetchHistoryListApi({
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
  }
}

async function onSearch() {
  query.pageNumber = 1;
  await loadSummary();
  await load();
}

function applyToday() {
  const [start, end] = defaultTodayRange();
  createdRange.value = [dayjs(start), dayjs(end)];
  query.createdStart = start;
  query.createdEnd = end;
}

function onReset() {
  query.mchOrderNo = '';
  query.payOrderId = '';
  query.fundDirection = undefined;
  query.bizType = undefined;
  applyToday();
  query.pageNumber = 1;
  onSearch();
}

function onExport() {
  submitExport(filters());
}

onMounted(async () => {
  applyToday();
  await onSearch();
  await restoreRunningTask();
  await syncReportDownloadAvailability();
});
</script>

<template>
  <Page auto-content-height title="资金流水">
    <div class="ap-page-stack">
      <Row v-if="canCount" :gutter="[16, 16]" class="ap-page-stats">
        <Col :md="12" :span="24">
          <Card>
            <Statistic
              title="变更金额汇总"
              :precision="2"
              :value="summary.totalAmount / 100"
              prefix="¥"
            />
          </Card>
        </Col>
        <Col :md="12" :span="24">
          <Card>
            <Statistic title="记录条数" :value="summary.totalCount" />
          </Card>
        </Col>
      </Row>

      <Card class="ap-page-filter">
        <Form class="ap-pay-order-filter" @finish="onSearch">
          <Row :gutter="[16, 16]">
            <Col :lg="8" :md="12" :span="24" :xl="8">
              <Form.Item>
                <DatePicker.RangePicker
                  v-model:value="createdRange"
                  show-time
                  style="width: 100%"
                  :placeholder="['创建时间开始', '创建时间结束']"
                />
              </Form.Item>
            </Col>
            <Col :lg="4" :md="8" :span="24" :xl="4">
              <Form.Item>
                <Input
                  v-model:value="query.mchOrderNo"
                  allow-clear
                  placeholder="商户订单号"
                />
              </Form.Item>
            </Col>
            <Col :lg="4" :md="8" :span="24" :xl="4">
              <Form.Item>
                <Input
                  v-model:value="query.payOrderId"
                  allow-clear
                  placeholder="支付订单号"
                />
              </Form.Item>
            </Col>
            <Col :lg="4" :md="8" :span="24" :xl="4">
              <Form.Item>
                <Select
                  v-model:value="query.fundDirection"
                  allow-clear
                  placeholder="资金变动方向"
                  style="width: 100%"
                  :options="FUND_DIRECTION_OPTIONS"
                />
              </Form.Item>
            </Col>
            <Col :lg="4" :md="8" :span="24" :xl="4">
              <Form.Item>
                <Select
                  v-model:value="query.bizType"
                  allow-clear
                  placeholder="业务类型"
                  style="width: 100%"
                  :options="BIZ_TYPE_OPTIONS"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row :gutter="[16, 16]" class="mt-1">
            <Col :span="24" class="ap-filter-actions">
              <Space>
                <Button html-type="submit" type="primary" :loading="loading">
                  搜索
                </Button>
                <Button @click="onReset">重置</Button>
                <AsyncExportButtons
                  danger
                  :has-report-downloads="hasReportDownloads"
                  :loading="exportLoading"
                  :progress="exportProgress"
                  @export="onExport"
                  @open-report-list="openReportList"
                />
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card>
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
          :scroll="{ x: 1400 }"
          row-key="id"
          @change="
            (p) => {
              query.pageNumber = p.current ?? 1;
              query.pageSize = p.pageSize ?? 50;
              load();
            }
          "
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'beforeBalance'">
              {{ formatYuan(record.beforeBalance) }}
            </template>
            <template v-else-if="column.dataIndex === 'amount'">
              <span :class="amountSignedClass(record.amount)">
                {{ signedYuan(record.amount) }}
              </span>
            </template>
            <template v-else-if="column.dataIndex === 'afterBalance'">
              {{ formatYuan(record.afterBalance) }}
            </template>
            <template v-else-if="column.dataIndex === 'orderNo'">
              <CellCopyStack
                :mch-order-no="record.mchOrderNo"
                :pay-order-id="record.payOrderId"
              />
            </template>
            <template v-else-if="column.dataIndex === 'payOrderAmount'">
              {{ formatYuan(record.payOrderAmount) }}
            </template>
            <template v-else-if="column.dataIndex === 'bizType'">
              {{ bizTypeLabel(record.bizType) }}
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
      @download="downloadFile"
      @remove="deleteCompletedItem"
    />
  </Page>
</template>

<style scoped>
.amount-positive {
  color: hsl(142 71% 40%);
}

.amount-negative {
  color: hsl(var(--destructive));
}

.amount-zero {
  color: inherit;
}
</style>

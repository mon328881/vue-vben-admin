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
  Table,
  Tag,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  fetchPayOrderDetailApi,
  fetchPayOrderListApi,
  fetchProductListShortApi,
} from '#/api';
import type { PayOrder, ProductShort } from '#/api/types/business';
import AsyncExportButtons from '#/components/export/AsyncExportButtons.vue';
import ExportReportListDialog from '#/components/export/ExportReportListDialog.vue';
import FilterActions from '#/components/list/FilterActions.vue';
import PayOrderDetailDrawer from '#/components/order/PayOrderDetailDrawer.vue';
import AssetsIcon from '#/components/payconfig/AssetsIcon.vue';
import CellCopyStack from '#/components/table/CellCopyStack.vue';
import {
  FORCE_CHANGE_OPTIONS,
  NOTIFY_STATE_OPTIONS,
  ORDER_STATE_OPTIONS,
  notifyStateColor,
  notifyStateLabel,
  orderStateColor,
  orderStateLabel,
} from '#/constants/order';
import { usePayOrderExport } from '#/composables/use-async-export';
import { defaultTodayRange, formatDayEnd, formatDayStart } from '#/utils/date-range';
import { formatDateTime, formatYuan } from '#/utils/format';

defineOptions({ name: 'AgentPayOrderListPage' });

const query = reactive({
  pageNumber: 1,
  pageSize: 20,
  payOrderId: '',
  mchOrderNo: '',
  mchNo: '',
  mchName: '',
  productId: undefined as number | undefined,
  state: undefined as number | undefined,
  notifyState: undefined as number | undefined,
  forceChangeState: undefined as number | undefined,
  createdStart: '',
  createdEnd: '',
  successTimeStart: '',
  successTimeEnd: '',
});

const createdRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>();
const successRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>();
const list = ref<PayOrder[]>([]);
const total = ref(0);
const loading = ref(false);
const products = ref<ProductShort[]>([]);
const detailDrawerRef = ref<InstanceType<typeof PayOrderDetailDrawer>>();

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
} = usePayOrderExport();

const productOptions = computed(() =>
  products.value.map((p) => ({
    label: `[${p.productId}] ${p.productName}`,
    value: p.productId,
  })),
);

const productIconMap = computed(() => {
  const map = new Map<string, string>();
  for (const item of products.value) {
    if (item.productId != null && item.icon) {
      map.set(String(item.productId), item.icon);
    }
  }
  return map;
});

const columns: TableColumnsType<PayOrder> = [
  { dataIndex: 'mch', title: '商户号/商户', width: 180 },
  {
    dataIndex: 'orderNo',
    title: '订单号（点击复制）',
    width: 310,
    ellipsis: true,
  },
  { dataIndex: 'product', title: '支付产品', width: 200 },
  { dataIndex: 'amount', title: '支付金额', width: 120 },
  { dataIndex: 'state', title: '支付状态', width: 100 },
  { dataIndex: 'forceChangeState', title: '补单', width: 70 },
  { dataIndex: 'notifyState', title: '回调状态', width: 100 },
  { dataIndex: 'times', title: '创建/成功时间', width: 180 },
  { dataIndex: 'action', title: '操作', width: 90, fixed: 'right' },
];

function syncCreatedRange() {
  if (createdRange.value?.[0] && createdRange.value?.[1]) {
    query.createdStart = formatDayStart(createdRange.value[0].toDate());
    query.createdEnd = formatDayEnd(createdRange.value[1].toDate());
  } else {
    query.createdStart = '';
    query.createdEnd = '';
  }
}

function syncSuccessRange() {
  if (successRange.value?.[0] && successRange.value?.[1]) {
    query.successTimeStart = formatDayStart(successRange.value[0].toDate());
    query.successTimeEnd = formatDayEnd(successRange.value[1].toDate());
  } else {
    query.successTimeStart = '';
    query.successTimeEnd = '';
  }
}

function filters() {
  syncCreatedRange();
  syncSuccessRange();
  return {
    createdEnd: query.createdEnd || undefined,
    createdStart: query.createdStart || undefined,
    forceChangeState: query.forceChangeState,
    mchName: query.mchName || undefined,
    mchNo: query.mchNo || undefined,
    mchOrderNo: query.mchOrderNo || undefined,
    notifyState: query.notifyState,
    payOrderId: query.payOrderId || undefined,
    productId: query.productId,
    state: query.state,
    successTimeEnd: query.successTimeEnd || undefined,
    successTimeStart: query.successTimeStart || undefined,
  };
}

function rowIcon(row: PayOrder) {
  const fromOrder = String(row.icon ?? '').trim();
  if (fromOrder) return fromOrder;
  return productIconMap.value.get(String(row.productId)) ?? '';
}

async function load() {
  loading.value = true;
  try {
    const data = await fetchPayOrderListApi({
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

async function openDetail(row: PayOrder) {
  try {
    const data = await fetchPayOrderDetailApi(row.payOrderId);
    detailDrawerRef.value?.show(data ?? row);
  } catch (error) {
    message.error(error instanceof Error ? error.message : '加载详情失败');
    detailDrawerRef.value?.show(row);
  }
}

function onSearch() {
  query.pageNumber = 1;
  load();
}

function applyToday() {
  const [start, end] = defaultTodayRange();
  createdRange.value = [dayjs(start), dayjs(end)];
  query.createdStart = start;
  query.createdEnd = end;
}

function onReset() {
  query.payOrderId = '';
  query.mchOrderNo = '';
  query.mchNo = '';
  query.mchName = '';
  query.productId = undefined;
  query.state = undefined;
  query.notifyState = undefined;
  query.forceChangeState = undefined;
  successRange.value = undefined;
  applyToday();
  query.pageNumber = 1;
  load();
}

function onExport() {
  submitExport(filters());
}

onMounted(async () => {
  try {
    products.value = (await fetchProductListShortApi()) ?? [];
  } catch {
    products.value = [];
  }
  applyToday();
  await load();
  await restoreRunningTask();
  await syncReportDownloadAvailability();
});
</script>

<template>
  <Page auto-content-height title="商户订单">
    <div class="ap-page-stack">
      <Card class="ap-page-filter">
        <Form class="ap-pay-order-filter" @submit="onSearch">
          <Row :gutter="[16, 16]">
            <Col :lg="6" :md="10" :sm="12" :span="24" :xl="6">
              <Form.Item>
                <DatePicker.RangePicker
                  v-model:value="createdRange"
                  show-time
                  style="width: 100%"
                  :placeholder="['创建时间开始', '创建时间结束']"
                />
              </Form.Item>
            </Col>
            <Col :lg="4" :md="7" :sm="12" :span="24" :xl="4">
              <Form.Item>
                <Input
                  v-model:value="query.payOrderId"
                  allow-clear
                  placeholder="支付订单号"
                />
              </Form.Item>
            </Col>
            <Col :lg="4" :md="7" :sm="12" :span="24" :xl="4">
              <Form.Item>
                <Input
                  v-model:value="query.mchOrderNo"
                  allow-clear
                  placeholder="商户订单号"
                />
              </Form.Item>
            </Col>
            <Col :lg="4" :md="7" :sm="12" :span="24" :xl="4">
              <Form.Item>
                <Input
                  v-model:value="query.mchNo"
                  allow-clear
                  placeholder="商户号"
                />
              </Form.Item>
            </Col>
            <Col :lg="4" :md="7" :sm="12" :span="24" :xl="4">
              <Form.Item>
                <Input
                  v-model:value="query.mchName"
                  allow-clear
                  placeholder="商户名"
                />
              </Form.Item>
            </Col>
            <Col :lg="4" :md="7" :sm="12" :span="24" :xl="4">
              <Form.Item>
                <Select
                  v-model:value="query.productId"
                  allow-clear
                  placeholder="对应产品 (ID)"
                  style="width: 100%"
                  :options="productOptions"
                />
              </Form.Item>
            </Col>
            <Col :lg="4" :md="7" :sm="12" :span="24" :xl="4">
              <Form.Item>
                <Select
                  v-model:value="query.state"
                  allow-clear
                  placeholder="支付状态"
                  style="width: 100%"
                  :options="ORDER_STATE_OPTIONS"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row :gutter="[16, 16]">
            <Col :lg="4" :md="7" :sm="12" :span="24" :xl="4">
              <Form.Item>
                <Select
                  v-model:value="query.notifyState"
                  allow-clear
                  placeholder="回调状态"
                  style="width: 100%"
                  :options="NOTIFY_STATE_OPTIONS"
                />
              </Form.Item>
            </Col>
            <Col :lg="4" :md="7" :sm="12" :span="24" :xl="4">
              <Form.Item>
                <Select
                  v-model:value="query.forceChangeState"
                  allow-clear
                  placeholder="手动补单"
                  style="width: 100%"
                  :options="FORCE_CHANGE_OPTIONS"
                />
              </Form.Item>
            </Col>
            <Col :lg="5" :md="10" :sm="12" :span="24" :xl="5">
              <Form.Item>
                <DatePicker.RangePicker
                  v-model:value="successRange"
                  show-time
                  style="width: 100%"
                  :placeholder="['成功时间开始', '成功时间结束']"
                />
              </Form.Item>
            </Col>
            <Col :lg="24" :md="24" :sm="24" :span="24" :xl="24">
              <Form.Item class="ap-filter-actions">
                <FilterActions
                  submit-text="搜索"
                  :loading="loading"
                  @search="onSearch"
                  @reset="onReset"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

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
          :scroll="{ x: 1400 }"
          row-key="payOrderId"
          @change="
            (p) => {
              query.pageNumber = p.current ?? 1;
              query.pageSize = p.pageSize ?? 20;
              load();
            }
          "
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'mch'">
              <div class="cell-stack">
                <span class="cell-stack__line text-primary">{{
                  record.mchNo || '—'
                }}</span>
                <span class="cell-stack__line text-muted-foreground">{{
                  record.mchName || '—'
                }}</span>
              </div>
            </template>
            <template v-else-if="column.dataIndex === 'orderNo'">
              <CellCopyStack
                :mch-order-no="record.mchOrderNo"
                :pay-order-id="record.payOrderId"
              />
            </template>
            <template v-else-if="column.dataIndex === 'product'">
              <div class="cell-inline">
                <span class="cell-inline__id">[{{ record.productId ?? '—' }}]</span>
                <AssetsIcon
                  :filename="rowIcon(record as PayOrder)"
                  :size="16"
                  class="cell-inline__icon"
                />
                <span
                  class="cell-inline__grow"
                  :title="String(record.productName ?? '—')"
                >
                  {{ record.productName || '—' }}
                </span>
              </div>
            </template>
            <template v-else-if="column.dataIndex === 'amount'">
              {{ formatYuan(record.amount) }}
            </template>
            <template v-else-if="column.dataIndex === 'state'">
              <Tag :color="orderStateColor(record.state)">
                {{ orderStateLabel(record.state) }}
              </Tag>
            </template>
            <template v-else-if="column.dataIndex === 'forceChangeState'">
              <Tag :color="record.forceChangeState === 1 ? 'warning' : 'default'">
                {{ record.forceChangeState === 1 ? '是' : '否' }}
              </Tag>
            </template>
            <template v-else-if="column.dataIndex === 'notifyState'">
              <Tag :color="notifyStateColor(record.notifyState)">
                {{ notifyStateLabel(record.notifyState) }}
              </Tag>
            </template>
            <template v-else-if="column.dataIndex === 'times'">
              <div class="cell-stack text-xs">
                <span>{{ formatDateTime(record.createdAt) }}</span>
                <span>{{ formatDateTime(record.successTime) }}</span>
              </div>
            </template>
            <template v-else-if="column.dataIndex === 'action'">
              <Button
                size="small"
                type="link"
                @click="openDetail(record as PayOrder)"
              >
                详情
              </Button>
            </template>
          </template>
        </Table>
      </Card>
    </div>

    <PayOrderDetailDrawer ref="detailDrawerRef" />

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
.cell-stack {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.cell-stack__line {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-inline {
  align-items: center;
  display: flex;
  gap: 6px;
  min-width: 0;
}

.cell-inline__id {
  flex-shrink: 0;
  font-weight: 600;
}

.cell-inline__icon {
  flex-shrink: 0;
}

.cell-inline__grow {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

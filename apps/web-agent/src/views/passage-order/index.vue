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
  Table,
  Tag,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  fetchPassagePayOrderDetailApi,
  fetchPassagePayOrderListApi,
  fetchProductListShortApi,
} from '#/api';
import type { PayOrder, ProductShort } from '#/api/types/business';
import AsyncExportButtons from '#/components/export/AsyncExportButtons.vue';
import ExportReportListDialog from '#/components/export/ExportReportListDialog.vue';
import PayOrderDetailDrawer from '#/components/order/PayOrderDetailDrawer.vue';
import AssetsIcon from '#/components/payconfig/AssetsIcon.vue';
import { copyText } from '#/utils/copy';
import {
  ORDER_STATE_OPTIONS,
  notifyStateColor,
  notifyStateLabel,
  orderStateColor,
  orderStateLabel,
} from '#/constants/order';
import { usePassagePayOrderExport } from '#/composables/use-async-export';
import { defaultTodayRange, formatDayEnd, formatDayStart } from '#/utils/date-range';
import { formatDateTime, formatYuan } from '#/utils/format';

defineOptions({ name: 'AgentPassagePayOrderListPage' });

const query = reactive({
  pageNumber: 1,
  pageSize: 20,
  payOrderId: '',
  passageOrderNo: '',
  passageId: '',
  payPassageName: '',
  productId: undefined as number | undefined,
  state: undefined as number | undefined,
  createdStart: '',
  createdEnd: '',
});

const createdRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>();
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
} = usePassagePayOrderExport();

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
  { dataIndex: 'passage', title: '通道信息', width: 220 },
  {
    dataIndex: 'orderNo',
    title: '平台订单号',
    width: 300,
    ellipsis: true,
  },
  { dataIndex: 'amount', title: '支付金额', width: 120 },
  { dataIndex: 'state', title: '支付状态', width: 100 },
  { dataIndex: 'product', title: '产品(快照)', width: 220 },
  { dataIndex: 'notifyState', title: '回调状态', width: 100 },
  { dataIndex: 'createdAt', title: '创建日期', width: 170 },
  { dataIndex: 'successTime', title: '成功日期', width: 170 },
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

function filters() {
  syncCreatedRange();
  return {
    createdEnd: query.createdEnd || undefined,
    createdStart: query.createdStart || undefined,
    passageId: query.passageId || undefined,
    passageOrderNo: query.passageOrderNo || undefined,
    payOrderId: query.payOrderId || undefined,
    payPassageName: query.payPassageName || undefined,
    productId: query.productId,
    state: query.state,
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
    const data = await fetchPassagePayOrderListApi({
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
    const data = await fetchPassagePayOrderDetailApi(row.payOrderId);
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
  query.passageOrderNo = '';
  query.passageId = '';
  query.payPassageName = '';
  query.productId = undefined;
  query.state = undefined;
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
  <Page auto-content-height title="通道订单">
    <div class="ap-page-stack">
      <Card class="ap-page-filter">
        <Form class="ap-pay-order-filter" @finish="onSearch">
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
                  v-model:value="query.passageId"
                  allow-clear
                  placeholder="通道ID"
                />
              </Form.Item>
            </Col>
            <Col :lg="4" :md="7" :sm="12" :span="24" :xl="4">
              <Form.Item>
                <Input
                  v-model:value="query.payPassageName"
                  allow-clear
                  placeholder="通道名"
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
                  v-model:value="query.passageOrderNo"
                  allow-clear
                  placeholder="通道订单号"
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
            <Col :lg="4" :md="6" :sm="12" :span="24" :xl="4">
              <Form.Item class="ap-filter-actions">
                <Space>
                  <Button html-type="submit" type="primary" :loading="loading">
                    搜索
                  </Button>
                  <Button @click="onReset">重置</Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <div class="ap-page-toolbar">
          <AsyncExportButtons
            danger
            :has-report-downloads="hasReportDownloads"
            :loading="exportLoading"
            :progress="exportProgress"
            @export="onExport"
            @open-report-list="openReportList"
          />
        </div>
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
            <template v-if="column.dataIndex === 'passage'">
              <div class="cell-inline">
                <span class="cell-inline__id">[{{ record.passageId ?? '—' }}]</span>
                <span class="cell-inline__grow">{{ record.passageName || '—' }}</span>
              </div>
            </template>
            <template v-else-if="column.dataIndex === 'orderNo'">
              <div class="cell-copy-stack">
                <div
                  class="cell-copy-stack__row"
                  @click="copyText(record.payOrderId, '支付单号')"
                >
                  <Tag color="processing">支付单号</Tag>
                  <span class="cell-copy-stack__value">{{ record.payOrderId || '—' }}</span>
                </div>
                <div
                  v-if="record.passageOrderNo"
                  class="cell-copy-stack__row"
                  @click="copyText(record.passageOrderNo, '通道单号')"
                >
                  <Tag color="warning">通道单号</Tag>
                  <span class="cell-copy-stack__value">{{ record.passageOrderNo }}</span>
                </div>
              </div>
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
              <b>{{ formatYuan(record.amount) }}</b>
            </template>
            <template v-else-if="column.dataIndex === 'state'">
              <Tag :color="orderStateColor(record.state)">
                {{ orderStateLabel(record.state) }}
              </Tag>
            </template>
            <template v-else-if="column.dataIndex === 'notifyState'">
              <Tag :color="notifyStateColor(record.notifyState)">
                {{ notifyStateLabel(record.notifyState) }}
              </Tag>
            </template>
            <template v-else-if="column.dataIndex === 'createdAt'">
              {{ formatDateTime(record.createdAt) }}
            </template>
            <template v-else-if="column.dataIndex === 'successTime'">
              {{ formatDateTime(record.successTime) }}
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

.cell-copy-stack {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cell-copy-stack__row {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.cell-copy-stack__value {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
}
</style>

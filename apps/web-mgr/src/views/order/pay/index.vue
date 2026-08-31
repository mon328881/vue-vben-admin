<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';
import type { Dayjs } from 'dayjs';

import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  RangePicker,
  Row,
  Select,
  Slider,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from 'ant-design-vue';

import {
  fetchPassageGroupListShortApi,
  fetchPassageListShortApi,
  fetchPayOrderDetailApi,
  fetchPayOrderListApi,
  fetchPayRealTimeStatApi,
  fetchProductListShortApi,
  forcePayOrderRedoApi,
} from '#/api';
import type { PayOrder, PayRealTimeStat } from '#/api/types/business';
import AsyncExportButtons from '#/components/export/AsyncExportButtons.vue';
import ExportReportListDialog from '#/components/export/ExportReportListDialog.vue';
import FilterActions from '#/components/list/FilterActions.vue';
import ListStatCards, {
  type ListStatCardItem,
} from '#/components/list/ListStatCards.vue';
import TableActionLinks, {
  type TableActionItem,
} from '#/components/table/TableActionLinks.vue';
import { usePayOrderExport } from '#/composables/use-async-export';
import {
  FORCE_CHANGE_OPTIONS,
  NOTIFY_STATE_OPTIONS,
  PAY_STATE_OPTIONS,
  TIME_RANGE_OPTIONS,
  notifyStateColor,
  notifyStateLabel,
  payOrderStateColor,
  payOrderStateLabel,
} from '#/constants/order';
import { hasEnt } from '#/utils/access';
import { formatDateTime, formatRateDecimal, formatYuan } from '#/utils/format';

import PayOrderChangeDialog from './components/PayOrderChangeDialog.vue';
import PayOrderDetailDrawer from './components/PayOrderDetailDrawer.vue';
import PayOrderForceDialog from './components/PayOrderForceDialog.vue';

defineOptions({ name: 'PayOrderListPage' });

const STORAGE_KEY = 'asiapay_mgr_pay_order_list_ui_v1';

const loading = ref(false);
const dataSource = ref<PayOrder[]>([]);
const total = ref(0);
const pagination = reactive({ current: 1, pageSize: 20 });
const query = reactive({
  payOrderId: '',
  mchOrderNo: '',
  passageOrderNo: '',
  state: undefined as number | undefined,
  mchName: '',
  mchNo: '',
  agentNo: '',
  passageId: undefined as number | undefined,
  productId: undefined as number | undefined,
  passageGroupName: undefined as string | undefined,
  notifyState: undefined as number | undefined,
  forceChangeState: undefined as number | undefined,
  minAmount: '',
  maxAmount: '',
  timeRange: undefined as number | undefined,
  createdStart: '',
  createdEnd: '',
  successTimeStart: '',
  successTimeEnd: '',
});

const createdRange = ref<[string, string] | undefined>();
const successRange = ref<[string, string] | undefined>();

const passageOptions = ref<{ label: string; value: number }[]>([]);
const productOptions = ref<{ label: string; value: number }[]>([]);
const passageGroupOptions = ref<{ label: string; value: string }[]>([]);

const stat = ref<PayRealTimeStat>({});
const detailOpen = ref(false);
const detailLoading = ref(false);
const detail = ref<PayOrder | null>(null);
const showStat = ref(true);
const autoRefresh = ref(false);
const refreshTimeSec = ref(30);
const countdown = ref(30);
let refreshTimer: ReturnType<typeof setInterval> | null = null;
let pageVisible = true;

const forceRef = ref<InstanceType<typeof PayOrderForceDialog>>();
const changeRef = ref<InstanceType<typeof PayOrderChangeDialog>>();

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

const canView = computed(() => hasEnt('ENT_PAY_ORDER_VIEW'));
const canEdit = computed(() => hasEnt('ENT_PAY_ORDER_EDIT'));
const canCount = computed(() => hasEnt('ENT_C_MAIN_PAY_COUNT'));

const columns: TableColumnsType<PayOrder> = [
  { dataIndex: 'mchNo', fixed: 'left', title: '商户号/商户', width: 160 },
  { dataIndex: 'payOrderId', title: '订单号（点击复制）', width: 200 },
  { dataIndex: 'productName', ellipsis: true, title: '支付产品', width: 160 },
  { dataIndex: 'amount', title: '支付金额', width: 110 },
  { dataIndex: 'state', title: '支付状态', width: 100 },
  { dataIndex: 'notifyState', title: '回调状态', width: 100 },
  { dataIndex: 'forceChangeState', title: '补单', width: 70 },
  { dataIndex: 'createdAt', title: '创建/成功时间', width: 180 },
  { dataIndex: 'passageName', ellipsis: true, title: '支付通道', width: 160 },
  { dataIndex: 'mchFeeAmount', title: '商户费用', width: 100 },
  { dataIndex: 'passageFeeAmount', title: '通道费用', width: 100 },
  { dataIndex: 'action', fixed: 'right', title: '操作', width: 220 },
];

function successRateText() {
  const s = Number(stat.value.successCount ?? 0);
  const t = Number(stat.value.totalCount ?? 0);
  if (t === 0) return '0.00%';
  return `${((s / t) * 100).toFixed(2)}%`;
}

const listStatItems = computed<ListStatCardItem[]>(() => {
  const s = stat.value;
  return [
    {
      title: '订单金额',
      value: Number(s.successAmount ?? 0) / 100,
      decimals: 2,
      prefix: '¥',
      sub: `总：${formatYuan(s.totalAmount)}`,
      icon: 'lucide:wallet',
    },
    {
      title: '订单数',
      value: Number(s.successCount ?? 0),
      sub: `总：${s.totalCount ?? 0}`,
      icon: 'lucide:list-ordered',
    },
    {
      title: '商户入账',
      value: Number(s.totalMchIncome ?? 0) / 100,
      decimals: 2,
      prefix: '¥',
      icon: 'lucide:building-2',
    },
    {
      title: '平台利润',
      value: Number(s.totalIncome ?? 0) / 100,
      decimals: 2,
      prefix: '¥',
      icon: 'lucide:trending-up',
    },
    {
      title: '成功率',
      display: successRateText(),
      icon: 'lucide:percent',
    },
  ];
});

function canForce(row: PayOrder) {
  return canEdit.value && [1, 3, 6].includes(Number(row.state));
}

function canRedo(row: PayOrder) {
  return canEdit.value && Number(row.state) === 2;
}

function opItems(row: PayOrder): TableActionItem[] {
  return [
    { key: 'detail', label: '详情', hidden: !canView.value },
    { key: 'force', label: '补单', hidden: !canForce(row) },
    { key: 'changeAmount', label: '调额', hidden: !canForce(row) },
    { key: 'testRedo', label: '冲正', danger: true, hidden: !canRedo(row) },
  ];
}

function onOpClick(key: string, row: PayOrder) {
  const handlers: Record<string, () => void> = {
    detail: () => void openDetail(row),
    force: () => onForce(row),
    changeAmount: () => onChangeAmount(row),
    testRedo: () => onRedo(row),
  };
  handlers[key]?.();
}

function refreshTimeSecValue() {
  const v = refreshTimeSec.value;
  return Array.isArray(v) ? (v[0] ?? 30) : v;
}

function buildParams() {
  const params: Record<string, unknown> = { ...query };
  const timeRange = Number(params.timeRange);
  if (Number.isInteger(timeRange) && timeRange >= 1 && timeRange <= 5) {
    params.timeRange = timeRange;
    delete params.createdStart;
    delete params.createdEnd;
  } else {
    delete params.timeRange;
  }
  return params;
}

function onCreatedRangeChange(
  value: [string, string] | [Dayjs, Dayjs] | null,
) {
  const arr = Array.isArray(value) ? value.map(String) : [];
  if (arr.length >= 2) {
    query.timeRange = undefined;
    query.createdStart = arr[0]!;
    query.createdEnd = arr[1]!;
    createdRange.value = [arr[0]!, arr[1]!];
  } else {
    query.createdStart = '';
    query.createdEnd = '';
    createdRange.value = undefined;
  }
}

function onTimeRangeChange() {
  if (query.timeRange == null) return;
  query.createdStart = '';
  query.createdEnd = '';
  createdRange.value = undefined;
}

function onSuccessRangeChange(
  value: [string, string] | [Dayjs, Dayjs] | null,
) {
  const arr = Array.isArray(value) ? value.map(String) : [];
  if (arr.length >= 2) {
    query.successTimeStart = arr[0]!;
    query.successTimeEnd = arr[1]!;
    successRange.value = [arr[0]!, arr[1]!];
  } else {
    query.successTimeStart = '';
    query.successTimeEnd = '';
    successRange.value = undefined;
  }
}

function onPassageGroupChange() {
  query.passageId = undefined;
}

async function loadFilterOptions() {
  try {
    const [passages, products, groups] = await Promise.all([
      fetchPassageListShortApi(),
      fetchProductListShortApi(),
      fetchPassageGroupListShortApi(),
    ]);
    passageOptions.value = (passages ?? []).map((p) => ({
      label: `[${p.payPassageId}] ${p.payPassageName ?? ''}`,
      value: p.payPassageId,
    }));
    productOptions.value = (products ?? []).map((p) => ({
      label: `[${p.productId}] ${p.productName ?? ''}`,
      value: p.productId,
    }));
    passageGroupOptions.value = (groups ?? []).map((g) => ({
      label: g.passageGroupName,
      value: g.passageGroupName,
    }));
  } catch {
    // ignore
  }
}

async function loadStat() {
  if (!showStat.value || !canCount.value) return;
  try {
    stat.value = (await fetchPayRealTimeStatApi(buildParams())) ?? {};
  } catch {
    // ignore
  }
}

async function loadData(resetPage = false) {
  if (resetPage) pagination.current = 1;
  loading.value = true;
  try {
    void loadStat();
    const page = await fetchPayOrderListApi({
      ...buildParams(),
      pageNumber: pagination.current,
      pageSize: pagination.pageSize,
    });
    dataSource.value = page?.records ?? [];
    total.value = page?.total ?? 0;
  } finally {
    loading.value = false;
  }
}

async function onExport() {
  await submitExport(buildParams());
}

function onSearch() {
  void loadData(true);
}

function onReset() {
  query.payOrderId = '';
  query.mchOrderNo = '';
  query.passageOrderNo = '';
  query.mchNo = '';
  query.mchName = '';
  query.agentNo = '';
  query.passageId = undefined;
  query.productId = undefined;
  query.passageGroupName = undefined;
  query.state = undefined;
  query.notifyState = undefined;
  query.forceChangeState = undefined;
  query.minAmount = '';
  query.maxAmount = '';
  query.timeRange = undefined;
  query.createdStart = '';
  query.createdEnd = '';
  query.successTimeStart = '';
  query.successTimeEnd = '';
  createdRange.value = undefined;
  successRange.value = undefined;
  void loadData(true);
}

function onTableChange(pag: { current?: number; pageSize?: number }) {
  pagination.current = pag.current ?? 1;
  pagination.pageSize = pag.pageSize ?? 20;
  void loadData();
}

async function openDetail(row: PayOrder) {
  detailOpen.value = true;
  detailLoading.value = true;
  try {
    detail.value = await fetchPayOrderDetailApi(row.payOrderId);
  } finally {
    detailLoading.value = false;
  }
}

async function copyOrderId(text?: string) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    message.success('已复制');
  } catch {
    message.error('复制失败');
  }
}

function onForce(row: PayOrder) {
  forceRef.value?.confirm(row.payOrderId);
}

function onChangeAmount(row: PayOrder) {
  changeRef.value?.show(row);
}

function onRedo(row: PayOrder) {
  Modal.confirm({
    title: '确认测试冲正？',
    content: '确认将该订单标记为测试订单（测试冲正）？',
    okText: '确认',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      await forcePayOrderRedoApi(row.payOrderId);
      message.success('操作成功');
      void loadData(true);
    },
  });
}

function writeStoredUi() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        realTimeStatOpen: !!showStat.value,
        autoRefresh: !!autoRefresh.value,
        refreshTimeSec: refreshTimeSecValue(),
      }),
    );
  } catch {
    // ignore
  }
}

function readStoredUi() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const stored = JSON.parse(raw) as {
      autoRefresh?: boolean;
      realTimeStatOpen?: boolean;
      refreshTimeSec?: number;
    };
    if (typeof stored.realTimeStatOpen === 'boolean') {
      showStat.value = stored.realTimeStatOpen;
    }
    if (
      typeof stored.refreshTimeSec === 'number' &&
      stored.refreshTimeSec >= 30 &&
      stored.refreshTimeSec <= 120
    ) {
      refreshTimeSec.value = stored.refreshTimeSec;
      countdown.value = stored.refreshTimeSec;
    }
    if (stored.autoRefresh) {
      autoRefresh.value = true;
    }
  } catch {
    // ignore
  }
}

function stopTimer() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  countdown.value = refreshTimeSecValue();
}

function shouldRun() {
  return !!autoRefresh.value && pageVisible && !document.hidden;
}

function startTimer() {
  stopTimer();
  if (!shouldRun()) return;
  countdown.value = refreshTimeSecValue();
  refreshTimer = setInterval(() => {
    if (!shouldRun()) return;
    countdown.value -= 1;
    if (countdown.value <= 0) {
      countdown.value = refreshTimeSecValue();
      void loadData();
    }
  }, 1000);
}

function onAutoRefreshToggle(checked: boolean | string | number) {
  autoRefresh.value = !!checked;
  if (autoRefresh.value) startTimer();
  else stopTimer();
  writeStoredUi();
}

function onRefreshTimeSecChange(value: number | [number, number]) {
  const v = Array.isArray(value) ? (value[0] ?? 30) : value;
  refreshTimeSec.value = v;
  if (autoRefresh.value) countdown.value = v;
  writeStoredUi();
}

function onStatToggle(checked: boolean | string | number) {
  showStat.value = !!checked;
  if (showStat.value) void loadStat();
  writeStoredUi();
}

function onVisibilityChange() {
  pageVisible = document.visibilityState === 'visible';
  if (autoRefresh.value && pageVisible) startTimer();
  else if (!pageVisible) stopTimer();
}

watch(showStat, () => writeStoredUi());

onMounted(async () => {
  readStoredUi();
  document.addEventListener('visibilitychange', onVisibilityChange);
  await loadFilterOptions();
  await restoreRunningTask();
  await syncReportDownloadAvailability();
  void loadData(true);
  if (autoRefresh.value) startTimer();
});

onUnmounted(() => {
  stopTimer();
  document.removeEventListener('visibilitychange', onVisibilityChange);
});
</script>

<template>
  <Page auto-content-height title="支付订单">
    <div class="ap-page-stack">
      <Card class="ap-page-filter">
        <Form class="ap-pay-order-filter" @finish="onSearch">
          <Row :gutter="[16, 16]">
            <Col :xs="24" :sm="12" :md="10" :lg="6" :xl="6">
              <Form.Item>
                <RangePicker
                  v-model:value="createdRange"
                  show-time
                  value-format="YYYY-MM-DD HH:mm:ss"
                  style="width: 100%"
                  :placeholder="['创建时间开始', '创建时间结束']"
                  @change="onCreatedRangeChange"
                />
              </Form.Item>
            </Col>
            <Col :xs="24" :sm="12" :md="7" :lg="4" :xl="4">
              <Form.Item>
                <Input
                  v-model:value="query.payOrderId"
                  allow-clear
                  placeholder="支付订单号"
                />
              </Form.Item>
            </Col>
            <Col :xs="24" :sm="12" :md="7" :lg="4" :xl="4">
              <Form.Item>
                <Input
                  v-model:value="query.mchOrderNo"
                  allow-clear
                  placeholder="商户订单号"
                />
              </Form.Item>
            </Col>
            <Col :xs="24" :sm="12" :md="7" :lg="4" :xl="4">
              <Form.Item>
                <Input
                  v-model:value="query.passageOrderNo"
                  allow-clear
                  placeholder="通道订单号"
                />
              </Form.Item>
            </Col>
            <Col :xs="24" :sm="12" :md="7" :lg="4" :xl="4">
              <Form.Item>
                <Select
                  v-model:value="query.state"
                  allow-clear
                  placeholder="支付状态"
                  style="width: 100%"
                  :options="PAY_STATE_OPTIONS"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row :gutter="[16, 16]" class="mt-1">
            <Col :xs="24" :sm="12" :md="8" :lg="4" :xl="4">
              <Form.Item>
                <Input
                  v-model:value="query.mchName"
                  allow-clear
                  placeholder="商户名"
                />
              </Form.Item>
            </Col>
            <Col :xs="24" :sm="12" :md="8" :lg="4" :xl="4">
              <Form.Item>
                <Input
                  v-model:value="query.mchNo"
                  allow-clear
                  placeholder="商户号"
                />
              </Form.Item>
            </Col>
            <Col :xs="24" :sm="12" :md="8" :lg="4" :xl="4">
              <Form.Item>
                <Input
                  v-model:value="query.agentNo"
                  allow-clear
                  placeholder="代理商号"
                />
              </Form.Item>
            </Col>
            <Col :xs="24" :sm="12" :md="8" :lg="4" :xl="4">
              <Form.Item>
                <Select
                  v-model:value="query.passageId"
                  allow-clear
                  show-search
                  option-filter-prop="label"
                  placeholder="对应通道 (ID)"
                  style="width: 100%"
                  :options="passageOptions"
                />
              </Form.Item>
            </Col>
            <Col :xs="24" :sm="12" :md="8" :lg="4" :xl="4">
              <Form.Item>
                <Select
                  v-model:value="query.productId"
                  allow-clear
                  show-search
                  option-filter-prop="label"
                  placeholder="对应产品 (ID)"
                  style="width: 100%"
                  :options="productOptions"
                />
              </Form.Item>
            </Col>
            <Col :xs="24" :sm="12" :md="8" :lg="4" :xl="4">
              <Form.Item>
                <Select
                  v-model:value="query.passageGroupName"
                  allow-clear
                  show-search
                  option-filter-prop="label"
                  placeholder="通道供应商"
                  style="width: 100%"
                  :options="passageGroupOptions"
                  @change="onPassageGroupChange"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row :gutter="[16, 16]" class="mt-1">
            <Col :xs="24" :sm="12" :md="8" :lg="4" :xl="4">
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
            <Col :xs="24" :sm="12" :md="8" :lg="4" :xl="4">
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
            <Col :xs="12" :sm="6" :md="4" :lg="2" :xl="2">
              <Form.Item>
                <Input
                  v-model:value="query.minAmount"
                  allow-clear
                  placeholder="最小金额"
                />
              </Form.Item>
            </Col>
            <Col :xs="12" :sm="6" :md="4" :lg="2" :xl="2">
              <Form.Item>
                <Input
                  v-model:value="query.maxAmount"
                  allow-clear
                  placeholder="最大金额"
                />
              </Form.Item>
            </Col>
            <Col :xs="24" :sm="12" :md="8" :lg="4" :xl="4">
              <Form.Item>
                <Select
                  v-model:value="query.timeRange"
                  allow-clear
                  placeholder="订单时间段"
                  style="width: 100%"
                  :options="TIME_RANGE_OPTIONS"
                  @change="onTimeRangeChange"
                />
              </Form.Item>
            </Col>
            <Col :xs="24" :sm="12" :md="10" :lg="5" :xl="5">
              <Form.Item>
                <RangePicker
                  v-model:value="successRange"
                  show-time
                  value-format="YYYY-MM-DD HH:mm:ss"
                  style="width: 100%"
                  :placeholder="['成功时间开始', '成功时间结束']"
                  @change="onSuccessRangeChange"
                />
              </Form.Item>
            </Col>
            <Col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
              <Form.Item class="ap-filter-actions">
                <FilterActions @reset="onReset" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <ListStatCards
        v-if="showStat && canCount"
        :items="listStatItems"
      />

      <Card>
        <div class="ap-table-toolbar">
          <span v-if="canCount" class="inline-flex items-center gap-2">
            <span>统计</span>
            <Switch :checked="showStat" @change="onStatToggle" />
          </span>
          <span v-if="canCount" class="inline-flex items-center gap-2">
            <span>自动刷新</span>
            <Switch :checked="autoRefresh" @change="onAutoRefreshToggle" />
          </span>
          <Slider
            v-if="canCount"
            :value="refreshTimeSec"
            :min="30"
            :max="120"
            :step="10"
            :disabled="!autoRefresh"
            style="width: 120px; margin: 0"
            @change="onRefreshTimeSecChange"
          />
          <span v-if="autoRefresh" class="countdown-tag">{{ countdown }}s</span>
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
          row-key="payOrderId"
          :scroll="{ x: 1800 }"
          size="middle"
          @change="onTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'mchNo'">
              <div>
                <div class="text-brand">{{ record.mchNo }}</div>
                <div class="text-muted-foreground text-xs">
                  {{ record.mchName || '' }}
                </div>
              </div>
            </template>
            <template v-else-if="column.dataIndex === 'payOrderId'">
              <div>
                <a class="text-brand" @click="copyOrderId(record.payOrderId)">
                  {{ record.payOrderId }}
                </a>
                <div class="text-muted-foreground text-xs">
                  {{ record.mchOrderNo }}
                </div>
              </div>
            </template>
            <template v-else-if="column.dataIndex === 'productName'">
              <div>
                <span class="text-brand text-xs">
                  [{{ record.productId ?? '--' }}]
                </span>
                {{ record.productName || '--' }}
              </div>
            </template>
            <template v-else-if="column.dataIndex === 'amount'">
              <b class="text-brand">{{ formatYuan(record.amount) }}</b>
            </template>
            <template v-else-if="column.dataIndex === 'mchFeeAmount'">
              <div>
                <div>
                  {{
                    record.mchFeeRate == null
                      ? '--'
                      : formatRateDecimal(record.mchFeeRate)
                  }}
                </div>
                <div>
                  {{
                    record.mchFeeAmount == null
                      ? '--'
                      : formatYuan(record.mchFeeAmount)
                  }}
                </div>
              </div>
            </template>
            <template v-else-if="column.dataIndex === 'passageFeeAmount'">
              <div>
                <div>
                  {{
                    record.passageRate == null
                      ? '--'
                      : formatRateDecimal(record.passageRate)
                  }}
                </div>
                <div>
                  {{
                    record.passageFeeAmount == null
                      ? '--'
                      : formatYuan(record.passageFeeAmount)
                  }}
                </div>
              </div>
            </template>
            <template v-else-if="column.dataIndex === 'state'">
              <Tag :color="payOrderStateColor(record.state)">
                {{ payOrderStateLabel(record.state) }}
              </Tag>
            </template>
            <template v-else-if="column.dataIndex === 'notifyState'">
              <Tag :color="notifyStateColor(record.notifyState)">
                {{ notifyStateLabel(record.notifyState) }}
              </Tag>
            </template>
            <template v-else-if="column.dataIndex === 'forceChangeState'">
              <Tag
                :color="
                  Number(record.forceChangeState) === 1 ? 'warning' : 'default'
                "
              >
                {{ Number(record.forceChangeState) === 1 ? '是' : '否' }}
              </Tag>
            </template>
            <template v-else-if="column.dataIndex === 'createdAt'">
              <div>{{ formatDateTime(record.createdAt) }}</div>
              <div class="text-muted-foreground text-xs">
                {{ formatDateTime(record.successTime) }}
              </div>
            </template>
            <template v-else-if="column.dataIndex === 'passageName'">
              <div>
                <span class="text-muted-foreground text-xs">
                  [{{ record.passageId ?? '--' }}]
                </span>
                {{ record.passageName || '--' }}
              </div>
            </template>
            <template v-else-if="column.dataIndex === 'action'">
              <TableActionLinks
                :items="opItems(record as PayOrder)"
                @click="onOpClick($event, record as PayOrder)"
              />
            </template>
          </template>
        </Table>
      </Card>
    </div>

    <PayOrderDetailDrawer
      v-model:open="detailOpen"
      :detail="detail"
      :loading="detailLoading"
    />

    <PayOrderForceDialog ref="forceRef" @success="loadData()" />
    <PayOrderChangeDialog ref="changeRef" @success="loadData()" />
    <ExportReportListDialog
      v-model:visible="reportListVisible"
      :loading="reportListLoading"
      :title="reportListTitle"
      :data="completedExports"
      @download="downloadFile"
      @remove="deleteCompletedItem"
    />
  </Page>
</template>

<style scoped>
.countdown-tag {
  display: inline-flex;
  align-items: center;
  min-width: 36px;
  color: hsl(var(--primary));
  font-variant-numeric: tabular-nums;
}
</style>

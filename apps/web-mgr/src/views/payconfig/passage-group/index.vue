<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';
import type { Key } from 'ant-design-vue/es/table/interface';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Space,
  Statistic,
  Switch,
  Table,
  Tag,
  Tooltip,
  message,
} from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';

import {
  allPassageGroupPrepaidResetApi,
  allPassageGroupSettleApi,
  deletePassageGroupApi,
  fetchPassageGroupListApi,
  fetchPassageGroupStatApi,
  multiplePassageGroupPrepaidResetApi,
  multiplePassageGroupSettleApi,
  setPassageGroupStateApi,
  settlePassageGroupApi,
  type PassageStatInfo,
} from '#/api';
import type {
  PassageGroupInfo,
  PassageGroupStat,
} from '#/api/modules/passage-group';
import AsyncExportButtons from '#/components/export/AsyncExportButtons.vue';
import ExportReportListDialog from '#/components/export/ExportReportListDialog.vue';
import { usePassageGroupExport } from '#/composables/use-async-export';
import {
  passageGroupSettleModeLabel,
  passageGroupSettleModeTagColor,
} from '#/constants/merchant';
import { hasEnt } from '#/utils/access';
import { formatDateTime, formatRateDecimal, formatYuan } from '#/utils/format';

import PassageAutoCleanDialog from './components/PassageAutoCleanDialog.vue';
import PassageGroupBatchDrawer from './components/PassageGroupBatchDrawer.vue';
import PassageGroupFormDrawer from './components/PassageGroupFormDrawer.vue';
import PassageGroupPrepaidAdjustDialog from './components/PassageGroupPrepaidAdjustDialog.vue';
import PassageGroupPrepaidHistoryDrawer from './components/PassageGroupPrepaidHistoryDrawer.vue';
import PassageGroupQuotaDialog from './components/PassageGroupQuotaDialog.vue';

defineOptions({ name: 'PassageGroupListPage' });

const AUTO_CLEAN_MESSAGE =
  '开启后每天定时清空未绑定供应商的通道余额；设置为“跟随全局”的供应商也会在该时间自动结算（北京时间）。';

const FEATURE_FLAGS = [
  { short: '推', label: '启用推送', field: 'canPush' as const },
  { short: '通', label: '启用通知', field: 'canNotify' as const },
  { short: '催', label: '启用自动催单', field: 'canRemind' as const },
  { short: '警', label: '启用异常警报', field: 'canWarn' as const },
];

const loading = ref(false);
const dataSource = ref<PassageGroupInfo[]>([]);
const total = ref(0);
const pagination = reactive({ current: 1, pageSize: 20 });
const selectedRowKeys = ref<Key[]>([]);
const query = reactive({ passageGroupName: '' });
const stat = ref<PassageGroupStat>({});
const stateBusy = ref<Record<string, boolean>>({});

const formRef = ref<InstanceType<typeof PassageGroupFormDrawer>>();
const historyRef = ref<InstanceType<typeof PassageGroupPrepaidHistoryDrawer>>();
const batchRef = ref<InstanceType<typeof PassageGroupBatchDrawer>>();
const prepaidRef = ref<InstanceType<typeof PassageGroupPrepaidAdjustDialog>>();
const quotaRef = ref<InstanceType<typeof PassageGroupQuotaDialog>>();
const autoCleanRef = ref<InstanceType<typeof PassageAutoCleanDialog>>();

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
} = usePassageGroupExport();

const canEdit = computed(() => hasEnt('ENT_MCH_APP_EDIT'));

const columns: TableColumnsType = [
  {
    dataIndex: 'passageGroupName',
    ellipsis: true,
    fixed: 'left',
    title: '供应商名称',
    width: 160,
  },
  { dataIndex: 'state', title: '状态', width: 90 },
  { dataIndex: 'featureFlags', title: '功能开关', width: 120 },
  { dataIndex: 'prepaid', title: '预付', width: 180 },
  { dataIndex: 'balance', title: '余额', width: 110 },
  { dataIndex: 'diff', title: '[预付-余额]差额', width: 180 },
  { dataIndex: 'quota', title: '授信', width: 200 },
  { dataIndex: 'successAmount', title: '今日跑量', width: 110 },
  { dataIndex: 'successRate', title: '今日成率', width: 100 },
  { dataIndex: 'passageCount', title: '通道数量', width: 90 },
  { dataIndex: 'isAutoSettle', title: '自动结算模式', width: 120 },
  { dataIndex: 'autoSettleTime', title: '结算时间', width: 100 },
  { dataIndex: 'createdAt', title: '创建日期', width: 170 },
  { dataIndex: 'remark', ellipsis: true, title: '备注', width: 140 },
  { dataIndex: 'action', fixed: 'right', title: '操作', width: 200 },
];

const rowSelection = computed(() =>
  canEdit.value
    ? {
        selectedRowKeys: selectedRowKeys.value,
        onChange: (keys: Key[]) => {
          selectedRowKeys.value = keys;
        },
      }
    : undefined,
);

async function loadStat() {
  try {
    stat.value =
      (await fetchPassageGroupStatApi({
        passageGroupName: query.passageGroupName || undefined,
      })) ?? {};
  } catch {
    // ignore
  }
}

async function loadData(resetPage = false) {
  if (resetPage) pagination.current = 1;
  loading.value = true;
  try {
    void loadStat();
    const page = await fetchPassageGroupListApi({
      ...query,
      pageNumber: pagination.current,
      pageSize: pagination.pageSize,
    });
    dataSource.value = page?.records ?? [];
    total.value = page?.total ?? 0;
  } finally {
    loading.value = false;
  }
}

function reloadTable() {
  selectedRowKeys.value = [];
  void loadData();
}

function onSearch() {
  selectedRowKeys.value = [];
  void loadData(true);
}

function onReset() {
  query.passageGroupName = '';
  selectedRowKeys.value = [];
  void loadData(true);
}

function onTableChange(pag: { current?: number; pageSize?: number }) {
  pagination.current = pag.current ?? 1;
  pagination.pageSize = pag.pageSize ?? 20;
  void loadData();
}

function onFormSuccess(toFirst: boolean) {
  selectedRowKeys.value = [];
  void loadData(toFirst);
}

async function toggleState(row: PassageGroupInfo, checked: boolean | string | number) {
  const next = checked ? 1 : 0;
  const ok = await new Promise<boolean>((resolve) => {
    Modal.confirm({
      title: '二次确认',
      content:
        next === 1 ? '确认【开启】该供应商？' : '确认【关闭】该供应商？',
      okText: '确认',
      cancelText: '取消',
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
  if (!ok) return;
  const name = row.passageGroupName;
  stateBusy.value[name] = true;
  try {
    await setPassageGroupStateApi(name, next);
    row.state = next;
    message.success('操作成功');
  } catch {
    message.error('操作失败');
  } finally {
    stateBusy.value[name] = false;
  }
}

function confirmDelete(row: PassageGroupInfo) {
  Modal.confirm({
    title: '确认删除？',
    content: '该操作将删除该[供应商]及其[预付流水记录]',
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      await deletePassageGroupApi(row.passageGroupName);
      message.success('删除成功');
      reloadTable();
    },
  });
}

async function confirmSettle(row: PassageGroupInfo) {
  if (!canEdit.value) return;
  if (!row.balance || row.balance === 0) {
    message.error('供应商通道余额等于0，无需结算');
    return;
  }
  await settlePassageGroupApi(row.passageGroupName);
  message.success('结算成功');
  reloadTable();
}

async function confirmBatchPrepaid() {
  if (!canEdit.value) return;
  if (!selectedRowKeys.value.length) {
    message.error('请先选择要批量操作的供应商');
    return;
  }
  await multiplePassageGroupPrepaidResetApi(selectedRowKeys.value.map(String));
  message.success('操作成功');
  reloadTable();
}

async function confirmBatchSettle() {
  if (!canEdit.value) return;
  if (!selectedRowKeys.value.length) {
    message.error('请先选择要批量操作的供应商');
    return;
  }
  await multiplePassageGroupSettleApi(selectedRowKeys.value.map(String));
  message.success('操作成功');
  reloadTable();
}

function confirmAllPrepaid() {
  if (!canEdit.value) return;
  Modal.confirm({
    title: '确认操作？',
    content: '该操作将[全部供应商]预付额清零，请谨慎操作！',
    okText: '确认',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      await allPassageGroupPrepaidResetApi();
      message.success('操作成功');
      onReset();
    },
  });
}

function confirmAllSettle() {
  if (!canEdit.value) return;
  Modal.confirm({
    title: '确认操作？',
    content: '该操作将结算[全部供应商]，请谨慎操作！',
    okText: '确认',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      await allPassageGroupSettleApi();
      message.success('操作成功');
      onReset();
    },
  });
}

function openBatch() {
  if (!canEdit.value) return;
  if (!selectedRowKeys.value.length) {
    message.error('请先勾选需要进行批量操作的供应商');
    return;
  }
  const ids = selectedRowKeys.value.map(String);
  const rows = dataSource.value.filter((row) =>
    ids.includes(String(row.passageGroupName)),
  );
  const labels = rows.length
    ? rows.map((row) => String(row.passageGroupName ?? ''))
    : ids;
  batchRef.value?.show(ids, labels);
}

function openAutoClean() {
  autoCleanRef.value?.show({
    totalBalance: 0,
    passageNum: 0,
    openPassageNum: 0,
    closedPassageNum: 0,
    payPassageAutoClean: stat.value.payPassageAutoClean,
    payPassageAutoCleanTime: stat.value.payPassageAutoCleanTime,
  });
}

function onAutoCleanSuccess(info: PassageStatInfo) {
  stat.value.payPassageAutoClean = info.payPassageAutoClean;
  stat.value.payPassageAutoCleanTime = info.payPassageAutoCleanTime;
}

function creditAmountOf(row: PassageGroupInfo) {
  return Number(row.quota ?? row.creditAmount ?? 0);
}

function creditText(row: PassageGroupInfo) {
  const amount = creditAmountOf(row);
  if (!amount && row.quotaLimitState !== 1) return '--';
  return formatYuan(amount);
}

function autoCleanTagText() {
  const on = stat.value.payPassageAutoClean === 1;
  const time = stat.value.payPassageAutoCleanTime;
  if (!on) return '自动日切关闭';
  if (time && time !== '--:--') return `自动日切开启（每日 ${time}）`;
  return '自动日切开启';
}

async function onExport() {
  await submitExport({ ...query });
}

onMounted(async () => {
  await restoreRunningTask();
  await syncReportDownloadAvailability();
  void loadData(true);
});
</script>

<template>
  <Page auto-content-height title="通道供应商">
    <div class="ap-page-stack">
    <Card class="ap-page-filter">
      <Form layout="inline" @finish="onSearch">
        <Form.Item>
          <Input
            v-model:value="query.passageGroupName"
            allow-clear
            placeholder="供应商名称"
          />
        </Form.Item>
        <Form.Item class="ap-filter-actions">
          <Space>
            <Button html-type="submit" type="primary">查询</Button>
            <Button @click="onReset">重置</Button>
          </Space>
        </Form.Item>
      </Form>
      <div
        class="mt-3 flex flex-wrap items-center justify-between gap-3 border-t pt-3"
      >
        <Space wrap>
          <Button v-if="canEdit" type="primary" @click="formRef?.show()">
            新建
          </Button>
          <Popconfirm
            v-if="canEdit"
            title="确认批量清零么?"
            @confirm="confirmBatchPrepaid"
          >
            <Button>预付批量清零</Button>
          </Popconfirm>
          <Popconfirm
            v-if="canEdit"
            title="确认批量结算么?"
            @confirm="confirmBatchSettle"
          >
            <Button>供应商批量结算</Button>
          </Popconfirm>
          <Button v-if="canEdit" danger ghost @click="confirmAllPrepaid">
            预付全部清零
          </Button>
          <Button v-if="canEdit" danger ghost @click="confirmAllSettle">
            供应商全部结算
          </Button>
          <Button v-if="canEdit" danger ghost @click="openAutoClean">
            通道自动日切设置
          </Button>
          <Button v-if="canEdit" @click="openBatch">批量操作供应商</Button>
          <AsyncExportButtons
            :loading="exportLoading"
            :progress="exportProgress"
            :has-report-downloads="hasReportDownloads"
            @export="onExport"
            @open-report-list="openReportList"
          />
        </Space>
        <Tag
          :color="stat.payPassageAutoClean === 1 ? 'success' : 'default'"
        >
          {{ autoCleanTagText() }}
        </Tag>
      </div>
    </Card>

    <Row :gutter="[12, 12]" class="ap-page-stats">
      <Col :md="6" :span="12">
        <Card size="small">
          <Statistic title="供应商总数" :value="stat.num ?? 0" />
        </Card>
      </Col>
      <Col :md="6" :span="12">
        <Card size="small">
          <Statistic title="预付汇总" :value="formatYuan(stat.totalPrepaid)" />
        </Card>
      </Col>
      <Col :md="6" :span="12">
        <Card size="small">
          <Statistic title="余额汇总" :value="formatYuan(stat.totalBalance)" />
        </Card>
      </Col>
      <Col :md="6" :span="12">
        <Card size="small">
          <Statistic
            title="差额汇总"
            :value="
              formatYuan(
                (stat.totalPrepaid ?? 0) - (stat.totalBalance ?? 0),
              )
            "
          />
        </Card>
      </Col>
    </Row>

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
        :row-selection="rowSelection"
        row-key="passageGroupName"
        :scroll="{ x: 2000 }"
        size="middle"
        @change="onTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'state'">
            <Switch
              :checked="record.state === 1"
              :disabled="!canEdit"
              :loading="!!stateBusy[record.passageGroupName as string]"
              @change="
                (c) => toggleState(record as PassageGroupInfo, c)
              "
            />
          </template>
          <template v-else-if="column.dataIndex === 'featureFlags'">
            <Space :size="4">
              <Tooltip
                v-for="flag in FEATURE_FLAGS"
                :key="flag.field"
                :title="flag.label"
              >
                <Tag
                  :color="
                    Number((record as PassageGroupInfo)[flag.field]) === 1
                      ? 'success'
                      : 'default'
                  "
                >
                  {{ flag.short }}
                </Tag>
              </Tooltip>
            </Space>
          </template>
          <template v-else-if="column.dataIndex === 'prepaid'">
            <div class="inline-action-cell">
              <Button
                v-if="canEdit"
                size="small"
                type="primary"
                @click="prepaidRef?.show(record as PassageGroupInfo)"
              >
                调额
              </Button>
              <b>{{ formatYuan(record.prepaid as number) }}</b>
            </div>
          </template>
          <template v-else-if="column.dataIndex === 'balance'">
            <b
              :class="
                (record.balance as number) > 0
                  ? 'text-green-500'
                  : 'text-red-500'
              "
            >
              {{ formatYuan(record.balance as number) }}
            </b>
          </template>
          <template v-else-if="column.dataIndex === 'diff'">
            <div class="inline-action-cell">
              <Popconfirm
                v-if="canEdit && (record.balance as number) !== 0"
                title="[结算]操作将清空余额并从预付中扣除，确认结算么?"
                @confirm="confirmSettle(record as PassageGroupInfo)"
              >
                <Button size="small" type="primary">结算</Button>
              </Popconfirm>
              <span
                :class="
                  Number(record.prepaid ?? 0) - Number(record.balance ?? 0) >= 0
                    ? ''
                    : 'text-red-500'
                "
              >
                {{
                  formatYuan(
                    (record.diff as number | undefined) ??
                      Number(record.prepaid ?? 0) -
                        Number(record.balance ?? 0),
                  )
                }}
              </span>
            </div>
          </template>
          <template v-else-if="column.dataIndex === 'quota'">
            <div class="inline-action-cell">
              <Button
                v-if="canEdit"
                size="small"
                type="primary"
                @click="quotaRef?.show(record as PassageGroupInfo)"
              >
                <template #icon>
                  <IconifyIcon icon="ant-design:setting-outlined" />
                </template>
              </Button>
              <Tooltip
                :title="
                  Number(record.quotaLimitState) === 1
                    ? '授信已启用'
                    : '授信已禁用'
                "
              >
                <span
                  class="quota-dot"
                  :class="
                    Number(record.quotaLimitState) === 1
                      ? 'quota-dot--on'
                      : 'quota-dot--off'
                  "
                />
              </Tooltip>
              <span
                :class="
                  Number(record.quotaLimitState) === 0
                    ? 'quota-value--disabled'
                    : ''
                "
              >
                {{ creditText(record as PassageGroupInfo) }}
              </span>
            </div>
          </template>
          <template v-else-if="column.dataIndex === 'successAmount'">
            {{
              record.successAmount != null
                ? formatYuan(record.successAmount as number)
                : '-'
            }}
          </template>
          <template v-else-if="column.dataIndex === 'successRate'">
            {{ formatRateDecimal(record.successRate as number) }}
          </template>
          <template v-else-if="column.dataIndex === 'isAutoSettle'">
            <Tag
              :color="
                passageGroupSettleModeTagColor(record.isAutoSettle as number)
              "
            >
              {{ passageGroupSettleModeLabel(record.isAutoSettle as number) }}
            </Tag>
          </template>
          <template v-else-if="column.dataIndex === 'autoSettleTime'">
            {{
              record.isAutoSettle === 1 && record.autoSettleTime
                ? record.autoSettleTime
                : '--'
            }}
          </template>
          <template v-else-if="column.dataIndex === 'createdAt'">
            {{ formatDateTime(record.createdAt as string) }}
          </template>
          <template v-else-if="column.dataIndex === 'action'">
            <Space>
              <Button
                size="small"
                type="link"
                @click="
                  historyRef?.show(
                    (record as PassageGroupInfo).passageGroupName,
                  )
                "
              >
                预付记录
              </Button>
              <Button
                v-if="canEdit"
                size="small"
                type="link"
                @click="
                  formRef?.show(
                    (record as PassageGroupInfo).passageGroupName,
                  )
                "
              >
                修改
              </Button>
              <Button
                v-if="canEdit"
                danger
                size="small"
                type="link"
                @click="confirmDelete(record as PassageGroupInfo)"
              >
                删除
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>
    </div>

    <PassageGroupFormDrawer ref="formRef" @success="onFormSuccess" />
    <PassageGroupBatchDrawer ref="batchRef" @success="reloadTable" />
    <PassageGroupPrepaidHistoryDrawer ref="historyRef" />
    <PassageGroupPrepaidAdjustDialog ref="prepaidRef" @success="reloadTable" />
    <PassageGroupQuotaDialog ref="quotaRef" @success="reloadTable" />
    <PassageAutoCleanDialog
      ref="autoCleanRef"
      :message="AUTO_CLEAN_MESSAGE"
      @success="onAutoCleanSuccess"
    />
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
.inline-action-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
  min-width: 0;
}

.inline-action-cell :deep(.ant-btn) {
  flex-shrink: 0;
  white-space: nowrap;
}

.quota-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.quota-dot--on {
  background: #52c41a;
}

.quota-dot--off {
  background: #d9d9d9;
}
</style>

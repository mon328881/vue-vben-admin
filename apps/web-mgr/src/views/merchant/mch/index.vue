<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';
import type { Key } from 'ant-design-vue/es/table/interface';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import {
  Button,
  Card,
  Dropdown,
  Form,
  Input,
  Menu,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  message,
} from 'ant-design-vue';

import {
  allPrepaidResetApi,
  allSettleApi,
  deleteMchInfoApi,
  fetchAutoSettleInfoApi,
  fetchMchCashierApi,
  fetchMchListApi,
  fetchMchStatInfoApi,
  multiplePrepaidResetApi,
  multipleSettleApi,
  settleMchApi,
  type MchAutoSettleInfo,
} from '#/api';
import type { MchInfo, MchStatInfo } from '#/api/types/business';
import GoogleDangerConfirmDialog from '#/components/common/GoogleDangerConfirmDialog.vue';
import AsyncExportButtons from '#/components/export/AsyncExportButtons.vue';
import ExportReportListDialog from '#/components/export/ExportReportListDialog.vue';
import FilterActions from '#/components/list/FilterActions.vue';
import ListStatCards, {
  type ListStatCardItem,
} from '#/components/list/ListStatCards.vue';
import AgentSelector from '#/components/selectors/AgentSelector.vue';
import MchGroupSelector from '#/components/selectors/MchGroupSelector.vue';
import { useMchListExport } from '#/composables/use-async-export';
import { LOCKED_MCH_NO } from '#/constants/merchant';
import { hasEnt } from '#/utils/access';
import { formatDateTime, formatRateDecimal, formatYuan } from '#/utils/format';

import MchAutoSettleDialog from './components/MchAutoSettleDialog.vue';
import MchBalanceAdjustDialog from './components/MchBalanceAdjustDialog.vue';
import MchBatchDrawer from './components/MchBatchDrawer.vue';
import MchConnectInfoDrawer from './components/MchConnectInfoDrawer.vue';
import MchFeatureFlagsCell from './components/MchFeatureFlagsCell.vue';
import MchFormDrawer from './components/MchFormDrawer.vue';
import MchPassageConfigDrawer from './components/MchPassageConfigDrawer.vue';
import MchPassageTestDrawer from './components/MchPassageTestDrawer.vue';
import MchPrepaidAdjustDialog from './components/MchPrepaidAdjustDialog.vue';
import MchPrepaidHistoryDrawer from './components/MchPrepaidHistoryDrawer.vue';
import MchProductConfigDrawer from './components/MchProductConfigDrawer.vue';

defineOptions({ name: 'MchListPage' });

const loading = ref(false);
const dataSource = ref<MchInfo[]>([]);
const total = ref(0);
const pagination = reactive({ current: 1, pageSize: 20 });
const selectedRowKeys = ref<Key[]>([]);
const query = reactive({
  agentNo: '',
  mchGroup: '',
  mchName: '',
  mchNo: '',
  state: undefined as string | undefined,
});
const stat = ref<MchStatInfo>({});
const autoSettleOn = ref(false);
const autoSettleTime = ref('');
const allPrepaidVisible = ref(false);
const allPrepaidSaving = ref(false);
const allSettleVisible = ref(false);
const allSettleSaving = ref(false);

const formRef = ref<InstanceType<typeof MchFormDrawer>>();
const productRef = ref<InstanceType<typeof MchProductConfigDrawer>>();
const passageRef = ref<InstanceType<typeof MchPassageConfigDrawer>>();
const connectRef = ref<InstanceType<typeof MchConnectInfoDrawer>>();
const batchRef = ref<InstanceType<typeof MchBatchDrawer>>();
const historyRef = ref<InstanceType<typeof MchPrepaidHistoryDrawer>>();
const testRef = ref<InstanceType<typeof MchPassageTestDrawer>>();
const prepaidRef = ref<InstanceType<typeof MchPrepaidAdjustDialog>>();
const balanceRef = ref<InstanceType<typeof MchBalanceAdjustDialog>>();
const autoSettleRef = ref<InstanceType<typeof MchAutoSettleDialog>>();

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
} = useMchListExport();

const canAdd = computed(() => hasEnt('ENT_MCH_INFO_ADD'));
const canEdit = computed(() => hasEnt('ENT_MCH_INFO_EDIT'));

const listStatItems = computed<ListStatCardItem[]>(() => {
  const s = stat.value;
  return [
    {
      title: '商户总数',
      value: Number(s.mchNum ?? 0),
      icon: 'lucide:users',
    },
    {
      title: '预付汇总',
      value: Number(s.prepaid ?? 0) / 100,
      decimals: 2,
      prefix: '¥',
      icon: 'lucide:wallet',
    },
    {
      title: '余额汇总',
      value: Number(s.totalBalance ?? 0) / 100,
      decimals: 2,
      prefix: '¥',
      icon: 'lucide:circle-dollar-sign',
    },
    {
      title: '冻结汇总',
      value: Number(s.freezeBalance ?? 0) / 100,
      decimals: 2,
      prefix: '¥',
      icon: 'lucide:lock',
    },
  ];
});
const canView = computed(() => hasEnt('ENT_MCH_INFO_VIEW'));
const canDel = computed(() => hasEnt('ENT_MCH_INFO_DEL'));
const canConfig = computed(() => hasEnt('ENT_MCH_APP_CONFIG'));

const columns: TableColumnsType<MchInfo> = [
  { dataIndex: 'mchName', ellipsis: true, fixed: 'left', title: '商户名称', width: 160 },
  { dataIndex: 'mchNo', title: '商户号', width: 130 },
  { dataIndex: 'prepaid', title: '预付', width: 160 },
  { dataIndex: 'balance', title: '商户余额', width: 160 },
  { dataIndex: 'diff', title: '[预付-余额]差额', width: 170 },
  { dataIndex: 'successAmount', title: '今日跑量', width: 110 },
  { dataIndex: 'successRate', title: '今日成率', width: 100 },
  { dataIndex: 'state', title: '状态', width: 80 },
  { dataIndex: 'featureFlags', title: '功能开关', width: 100 },
  { dataIndex: 'agentNo', title: '代理商', width: 160 },
  { dataIndex: 'mchGroup', ellipsis: true, title: '所属分组', width: 120 },
  { dataIndex: 'orderCountLimit', title: '并发限制', width: 100 },
  { dataIndex: 'createdAt', title: '创建日期', width: 170 },
  { dataIndex: 'remark', ellipsis: true, title: '备注', width: 120 },
  { dataIndex: 'action', fixed: 'right', title: '操作', width: 300 },
];

const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: Key[]) => {
    selectedRowKeys.value = keys;
  },
}));

function limitText(value?: number | null) {
  if (value == null || value === -1) return '';
  return String(value);
}

function applyAutoSettle(info: MchAutoSettleInfo) {
  autoSettleOn.value = info.mchAutoSettle === 1;
  autoSettleTime.value = info.mchAutoSettleTime || '';
}

async function loadAutoSettle() {
  try {
    const info = await fetchAutoSettleInfoApi();
    if (info) applyAutoSettle(info);
  } catch {
    // ignore
  }
}

async function loadStat() {
  try {
    stat.value = (await fetchMchStatInfoApi({ ...query })) ?? {};
  } catch {
    // 统计失败不阻断列表
  }
}

async function loadData(resetPage = false) {
  if (resetPage) pagination.current = 1;
  loading.value = true;
  try {
    void loadStat();
    const page = await fetchMchListApi({
      ...query,
      pageNumber: pagination.current,
      pageSize: pagination.pageSize,
      state:
        query.state === undefined || query.state === '' ? undefined : query.state,
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
  query.mchName = '';
  query.mchNo = '';
  query.agentNo = '';
  query.mchGroup = '';
  query.state = undefined;
  selectedRowKeys.value = [];
  void loadData(true);
}

function onTableChange(pag: { current?: number; pageSize?: number }) {
  pagination.current = pag.current ?? 1;
  pagination.pageSize = pag.pageSize ?? 20;
  void loadData();
}

function confirmDelete(row: MchInfo) {
  Modal.confirm({
    title: '确认删除？',
    content: '该操作将删除商户下所有配置及用户信息',
    okText: '确定',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      await deleteMchInfoApi(row.mchNo);
      message.success('删除成功');
      void loadData();
    },
  });
}

function onCreate() {
  formRef.value?.show();
}

function onEdit(row: MchInfo) {
  formRef.value?.show(row.mchNo);
}

function onPayConfig(row: MchInfo) {
  productRef.value?.show(row);
}

function onBindPassage(row: MchInfo) {
  passageRef.value?.show(row);
}

function onConnect(row: MchInfo) {
  connectRef.value?.show(row);
}

function onPrepaidHistory(row: MchInfo) {
  historyRef.value?.show(row);
}

function onTest(row: MchInfo) {
  testRef.value?.show(row);
}

function openBatch() {
  if (!canEdit.value) return;
  if (!selectedRowKeys.value.length) {
    message.error('请先勾选需要进行批量操作的商户');
    return;
  }
  const ids = selectedRowKeys.value.map(String);
  const rows = dataSource.value.filter((row) => ids.includes(String(row.mchNo)));
  const labels = rows.length
    ? rows.map((row) => `[${row.mchNo}] ${row.mchName}`)
    : ids;
  batchRef.value?.show(ids, labels);
}

async function confirmSettle(row: MchInfo) {
  if (!row.balance || row.balance === 0) {
    message.error('商户余额等于 0，无需结算');
    return;
  }
  await settleMchApi(row.mchNo);
  message.success('结算成功');
  reloadTable();
}

async function confirmBatchPrepaid() {
  if (!canEdit.value) return;
  if (!selectedRowKeys.value.length) {
    message.error('请先选择要批量操作的商户');
    return;
  }
  await multiplePrepaidResetApi(selectedRowKeys.value.map(String));
  message.success('预付批量清零成功');
  reloadTable();
}

async function confirmBatchSettle() {
  if (!canEdit.value) return;
  if (!selectedRowKeys.value.length) {
    message.error('请先选择要批量操作的商户');
    return;
  }
  await multipleSettleApi(selectedRowKeys.value.map(String));
  message.success('商户批量结算成功');
  reloadTable();
}

async function submitAllPrepaid(googleCode: string) {
  allPrepaidSaving.value = true;
  try {
    await allPrepaidResetApi(googleCode);
    message.success('预付全部清零成功');
    allPrepaidVisible.value = false;
    onReset();
  } finally {
    allPrepaidSaving.value = false;
  }
}

async function submitAllSettle(googleCode: string) {
  allSettleSaving.value = true;
  try {
    await allSettleApi(googleCode);
    message.success('商户全部结算成功');
    allSettleVisible.value = false;
    onReset();
  } finally {
    allSettleSaving.value = false;
  }
}

async function copyCashier(row: MchInfo) {
  try {
    const url = await fetchMchCashierApi(row.mchNo);
    const text = typeof url === 'string' ? url : String(url ?? '');
    if (!text) {
      message.error('获取收银台地址失败');
      return;
    }
    await navigator.clipboard.writeText(text);
    message.success('已复制收银台地址！');
  } catch {
    message.error('获取收银台地址失败');
  }
}

function hasMoreOps(row: MchInfo) {
  if (canView.value) return true;
  if (canEdit.value && row.state === 1 && row.mchNo !== LOCKED_MCH_NO) return true;
  if (canEdit.value && row.mchNo !== LOCKED_MCH_NO) return true;
  if (canDel.value && row.mchNo !== LOCKED_MCH_NO) return true;
  return false;
}

function onMoreMenuClick(key: string, row: MchInfo) {
  if (key === 'prepaidHistory') onPrepaidHistory(row);
  else if (key === 'test') onTest(row);
  else if (key === 'connect') onConnect(row);
  else if (key === 'cashier') void copyCashier(row);
  else if (key === 'delete') confirmDelete(row);
}

async function onExport() {
  await submitExport({ ...query });
}

onMounted(async () => {
  await restoreRunningTask();
  await syncReportDownloadAvailability();
  void loadAutoSettle();
  void loadData(true);
});
</script>

<template>
  <Page auto-content-height title="商户列表">
    <div class="ap-page-stack">
    <Card class="ap-page-filter">
      <Form layout="inline" @finish="onSearch">
        <Form.Item>
          <Input
            v-model:value="query.mchName"
            allow-clear
            placeholder="商户名"
          />
        </Form.Item>
        <Form.Item>
          <Input v-model:value="query.mchNo" allow-clear placeholder="商户号" />
        </Form.Item>
        <Form.Item>
          <AgentSelector
            v-model="query.agentNo"
            placeholder="代理商"
          />
        </Form.Item>
        <Form.Item>
          <MchGroupSelector
            v-model="query.mchGroup"
            placeholder="商户分组"
            include-disabled
          />
        </Form.Item>
        <Form.Item>
          <Select
            v-model:value="query.state"
            allow-clear
            placeholder="商户状态"
            style="width: 120px"
            :options="[
              { label: '禁用', value: '0' },
              { label: '启用', value: '1' },
            ]"
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
        <Space wrap>
          <Button v-if="canAdd" type="primary" @click="onCreate">新建</Button>
          <Popconfirm
            v-if="canEdit"
            title="确认预付批量清零么?"
            @confirm="confirmBatchPrepaid"
          >
            <Button>预付批量清零</Button>
          </Popconfirm>
          <Popconfirm
            v-if="canEdit"
            title="确认批量结算么?"
            @confirm="confirmBatchSettle"
          >
            <Button>商户批量结算</Button>
          </Popconfirm>
          <Button
            v-if="canEdit"
            danger
            ghost
            @click="allPrepaidVisible = true"
          >
            预付全部清零
          </Button>
          <Button v-if="canEdit" danger ghost @click="autoSettleRef?.show()">
            自动结算设置
          </Button>
          <Button
            v-if="canEdit"
            danger
            ghost
            @click="allSettleVisible = true"
          >
            商户全部结算
          </Button>
          <Button v-if="canEdit" @click="openBatch">批量操作商户</Button>
          <AsyncExportButtons
            :loading="exportLoading"
            :progress="exportProgress"
            :has-report-downloads="hasReportDownloads"
            @export="onExport"
            @open-report-list="openReportList"
          />
        </Space>
        <Tag :color="autoSettleOn ? 'success' : 'default'">
          {{
            autoSettleOn
              ? `自动结算开启${autoSettleTime ? `（每日 ${autoSettleTime}）` : ''}`
              : '自动结算关闭'
          }}
        </Tag>
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
        :row-selection="rowSelection"
        row-key="mchNo"
        :scroll="{ x: 2100 }"
        size="middle"
        @change="onTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'prepaid'">
            <div class="inline-action-cell">
              <Button
                v-if="canEdit"
                size="small"
                type="primary"
                class="inline-action-cell__action"
                @click="prepaidRef?.show(record as MchInfo)"
              >
                调额
              </Button>
              <b class="inline-action-cell__value">{{
                formatYuan(record.prepaid)
              }}</b>
            </div>
          </template>
          <template v-else-if="column.dataIndex === 'balance'">
            <div class="inline-action-cell">
              <Button
                v-if="canEdit"
                size="small"
                type="primary"
                class="inline-action-cell__action"
                @click="balanceRef?.show(record as MchInfo)"
              >
                调额
              </Button>
              <b
                class="inline-action-cell__value"
                :class="
                  (record.balance ?? 0) > 0
                    ? 'amount-positive'
                    : 'amount-negative'
                "
              >
                {{ formatYuan(record.balance) }}
              </b>
            </div>
          </template>
          <template v-else-if="column.dataIndex === 'diff'">
            <div class="inline-action-cell">
              <Popconfirm
                v-if="canEdit && (record.balance ?? 0) !== 0"
                title="[结算]操作将清空余额并从预付中扣除，确认结算么?"
                @confirm="confirmSettle(record as MchInfo)"
              >
                <Button
                  size="small"
                  type="primary"
                  class="inline-action-cell__action"
                >
                  结算
                </Button>
              </Popconfirm>
              <span
                class="inline-action-cell__value"
                :class="
                  (record.diff ??
                    (record.prepaid ?? 0) - (record.balance ?? 0)) >= 0
                    ? ''
                    : 'text-error'
                "
              >
                {{
                  formatYuan(
                    record.diff ??
                      (record.prepaid ?? 0) - (record.balance ?? 0),
                  )
                }}
              </span>
            </div>
          </template>
          <template v-else-if="column.dataIndex === 'successAmount'">
            <span class="text-brand">
              {{
                record.successAmount != null
                  ? formatYuan(record.successAmount)
                  : '-'
              }}
            </span>
          </template>
          <template v-else-if="column.dataIndex === 'successRate'">
            {{ formatRateDecimal(record.successRate) }}
          </template>
          <template v-else-if="column.dataIndex === 'featureFlags'">
            <MchFeatureFlagsCell :row="record as MchInfo" />
          </template>
          <template v-else-if="column.dataIndex === 'agentNo'">
            <div>
              <div>{{ record.agentNo || '-' }}</div>
              <div class="text-muted-foreground text-xs">
                {{ record.agentName || '' }}
              </div>
            </div>
          </template>
          <template v-else-if="column.dataIndex === 'mchGroup'">
            {{ record.mchGroup || '' }}
          </template>
          <template v-else-if="column.dataIndex === 'orderCountLimit'">
            {{ limitText(record.orderCountLimit) }}
          </template>
          <template v-else-if="column.dataIndex === 'state'">
            <Tag :color="record.state === 1 ? 'success' : 'default'">
              {{ record.state === 1 ? '启用' : '禁用' }}
            </Tag>
          </template>
          <template v-else-if="column.dataIndex === 'createdAt'">
            {{ formatDateTime(record.createdAt) }}
          </template>
          <template v-else-if="column.dataIndex === 'remark'">
            {{ record.remark || '' }}
          </template>
          <template v-else-if="column.dataIndex === 'action'">
            <div class="ap-table-ops">
              <Button
                v-if="canConfig"
                size="small"
                type="link"
                class="ap-table-ops__link"
                @click="onPayConfig(record as MchInfo)"
              >
                支付配置
              </Button>
              <Button
                v-if="canConfig"
                size="small"
                type="link"
                class="ap-table-ops__link"
                @click="onBindPassage(record as MchInfo)"
              >
                通道绑定
              </Button>
              <Button
                v-if="canEdit"
                size="small"
                type="link"
                class="ap-table-ops__link"
                @click="onEdit(record as MchInfo)"
              >
                修改
              </Button>
              <Dropdown v-if="hasMoreOps(record as MchInfo)">
                <Button size="small" type="link" class="ap-table-ops__link">
                  更多
                </Button>
                <template #overlay>
                  <Menu
                    @click="
                      ({ key }: { key: string | number }) =>
                        onMoreMenuClick(String(key), record as MchInfo)
                    "
                  >
                    <Menu.Item v-if="canView" key="prepaidHistory">
                      预付记录
                    </Menu.Item>
                    <Menu.Item
                      v-if="
                        canEdit &&
                        record.state === 1 &&
                        record.mchNo !== LOCKED_MCH_NO
                      "
                      key="test"
                    >
                      下单测试
                    </Menu.Item>
                    <Menu.Item
                      v-if="canEdit && record.mchNo !== LOCKED_MCH_NO"
                      key="connect"
                    >
                      对接信息
                    </Menu.Item>
                    <Menu.Item
                      v-if="canEdit && record.mchNo !== LOCKED_MCH_NO"
                      key="cashier"
                    >
                      收银台地址
                    </Menu.Item>
                    <Menu.Item
                      v-if="canDel && record.mchNo !== LOCKED_MCH_NO"
                      key="delete"
                      danger
                    >
                      删除
                    </Menu.Item>
                  </Menu>
                </template>
              </Dropdown>
            </div>
          </template>
        </template>
      </Table>
    </Card>
    </div>

    <MchFormDrawer ref="formRef" @success="loadData()" />
    <MchProductConfigDrawer ref="productRef" />
    <MchPassageConfigDrawer ref="passageRef" />
    <MchConnectInfoDrawer ref="connectRef" />
    <MchBatchDrawer ref="batchRef" @success="reloadTable" />
    <MchPrepaidHistoryDrawer ref="historyRef" />
    <MchPassageTestDrawer ref="testRef" />
    <MchPrepaidAdjustDialog ref="prepaidRef" @success="reloadTable" />
    <MchBalanceAdjustDialog ref="balanceRef" @success="reloadTable" />
    <MchAutoSettleDialog ref="autoSettleRef" @success="applyAutoSettle" />
    <GoogleDangerConfirmDialog
      v-model:open="allPrepaidVisible"
      header="预付全部清零"
      warning="该操作将清零所有商户预付，请谨慎操作。"
      :saving="allPrepaidSaving"
      @confirm="submitAllPrepaid"
    />
    <GoogleDangerConfirmDialog
      v-model:open="allSettleVisible"
      header="商户全部结算"
      warning="该操作将对所有商户进行结算，请谨慎操作。"
      :saving="allSettleSaving"
      @confirm="submitAllSettle"
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

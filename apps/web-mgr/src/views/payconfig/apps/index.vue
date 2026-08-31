<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  message,
} from 'ant-design-vue';

import {
  closeAllMchAppsApi,
  deleteMchAppApi,
  fetchMchAppsApi,
  fetchPassageRealTimeStatApi,
  openRecentlyMchAppsApi,
  resetAllMchAppBalanceApi,
  updateMchAppApi,
  type PassageStatInfo,
  type PayPassage,
} from '#/api';
import GoogleDangerConfirmDialog from '#/components/common/GoogleDangerConfirmDialog.vue';
import FilterActions from '#/components/list/FilterActions.vue';
import ListStatCards, {
  type ListStatCardItem,
} from '#/components/list/ListStatCards.vue';
import AssetsIcon from '#/components/payconfig/AssetsIcon.vue';
import PassageGroupSelector from '#/components/selectors/PassageGroupSelector.vue';
import ProductSelector from '#/components/selectors/ProductSelector.vue';
import { hasEnt } from '#/utils/access';
import { formatRateDecimal, formatYuan } from '#/utils/format';

import PassageAgentConfigDialog from './components/PassageAgentConfigDialog.vue';
import PassageAutoCleanDialog from './components/PassageAutoCleanDialog.vue';
import PassageBalanceAdjustDialog from './components/PassageBalanceAdjustDialog.vue';
import PassageBatchCopyDialog from './components/PassageBatchCopyDialog.vue';
import PassageBatchDrawer from './components/PassageBatchDrawer.vue';
import PassageCopyDialog from './components/PassageCopyDialog.vue';
import PassageDetailDrawer from './components/PassageDetailDrawer.vue';
import PassageFormDrawer from './components/PassageFormDrawer.vue';
import PassageHourlyRateDrawer from './components/PassageHourlyRateDrawer.vue';
import PassageHourlyRateReportDialog from './components/PassageHourlyRateReportDialog.vue';
import PassageMchConfigDrawer from './components/PassageMchConfigDrawer.vue';
import PassagePayParamConfigDrawer from './components/PassagePayParamConfigDrawer.vue';
import PassagePayTestDrawer from './components/PassagePayTestDrawer.vue';
import PassageRateAdjustDialog from './components/PassageRateAdjustDialog.vue';
import PassageTimeLimitDialog from './components/PassageTimeLimitDialog.vue';
import PassageWeightsDialog from './components/PassageWeightsDialog.vue';

defineOptions({ name: 'MchAppPage' });

const STATE_OPTIONS = [
  { value: '0', label: '禁用' },
  { value: '1', label: '启用' },
];

const loading = ref(false);
const dataSource = ref<PayPassage[]>([]);
const total = ref(0);
const pagination = reactive({ current: 1, pageSize: 20 });
const selectedIds = ref<(string | number)[]>([]);
const enabledFirst = ref(true);
const query = reactive({
  payInterfaceConfig: '',
  payPassageId: '',
  payPassageName: '',
  productId: '',
  passageGroup: '',
  state: undefined as string | undefined,
});
const stat = ref<PassageStatInfo>({
  totalBalance: 0,
  passageNum: 0,
  openPassageNum: 0,
  closedPassageNum: 0,
  payPassageAutoClean: 0,
  payPassageAutoCleanTime: '--:--',
});
const stateBusy = ref<Record<string, boolean>>({});
const resetVisible = ref(false);
const resetSaving = ref(false);
const closeAllVisible = ref(false);
const closeAllSaving = ref(false);

const formRef = ref<InstanceType<typeof PassageFormDrawer>>();
const detailRef = ref<InstanceType<typeof PassageDetailDrawer>>();
const mchBindRef = ref<InstanceType<typeof PassageMchConfigDrawer>>();
const payParamRef = ref<InstanceType<typeof PassagePayParamConfigDrawer>>();
const copyRef = ref<InstanceType<typeof PassageCopyDialog>>();
const testRef = ref<InstanceType<typeof PassagePayTestDrawer>>();
const batchRef = ref<InstanceType<typeof PassageBatchDrawer>>();
const batchCopyRef = ref<InstanceType<typeof PassageBatchCopyDialog>>();
const balanceRef = ref<InstanceType<typeof PassageBalanceAdjustDialog>>();
const rateRef = ref<InstanceType<typeof PassageRateAdjustDialog>>();
const agentRef = ref<InstanceType<typeof PassageAgentConfigDialog>>();
const weightsRef = ref<InstanceType<typeof PassageWeightsDialog>>();
const timeLimitRef = ref<InstanceType<typeof PassageTimeLimitDialog>>();
const hourlyRef = ref<InstanceType<typeof PassageHourlyRateDrawer>>();
const hourlyReportRef =
  ref<InstanceType<typeof PassageHourlyRateReportDialog>>();
const autoCleanRef = ref<InstanceType<typeof PassageAutoCleanDialog>>();

const canAdd = computed(() => hasEnt('ENT_MCH_APP_ADD'));
const canEdit = computed(() => hasEnt('ENT_MCH_APP_EDIT'));

const listStatItems = computed<ListStatCardItem[]>(() => {
  const s = stat.value;
  return [
    {
      title: '通道数量',
      value: Number(s.passageNum ?? 0),
      icon: 'lucide:layers',
    },
    {
      title: '总余额',
      value: Number(s.totalBalance ?? 0) / 100,
      decimals: 2,
      prefix: '¥',
      icon: 'lucide:wallet',
    },
    {
      title: '已开启通道',
      value: Number(s.openPassageNum ?? 0),
      icon: 'lucide:circle-check',
    },
    {
      title: '已关闭通道',
      value: Number(s.closedPassageNum ?? 0),
      icon: 'lucide:circle-x',
    },
  ];
});
const canConfig = computed(() => hasEnt('ENT_MCH_PAY_PASSAGE_CONFIG'));

const autoCleanTagText = computed(() => {
  if (stat.value.payPassageAutoClean === 1) {
    const time = stat.value.payPassageAutoCleanTime;
    const suffix =
      time && time !== '--:--' ? `（每日 ${time}）` : '';
    return `自动日切开启${suffix}`;
  }
  return '自动日切关闭';
});

const columns: TableColumnsType<PayPassage> = [
  {
    dataIndex: 'payPassageId',
    fixed: 'left',
    title: '通道/所属产品 (点击查看)',
    width: 260,
  },
  { dataIndex: 'state', title: '状态', width: 90 },
  { dataIndex: 'balance', title: '通道余额', width: 150 },
  { dataIndex: 'weights', title: '轮询权重', width: 100 },
  { dataIndex: 'timeLimitState', title: '通道定时设置', width: 160 },
  { dataIndex: 'rate', title: '通道费率', width: 110 },
  { dataIndex: 'successRate', title: '成率(天)', width: 110 },
  { dataIndex: 'passageGroup', ellipsis: true, title: '供应商', width: 140 },
  { dataIndex: 'payRules', ellipsis: true, title: '收款规则', width: 120 },
  { dataIndex: 'agentRate', title: '代理费率', width: 110 },
  {
    dataIndex: 'payInterfaceConfig',
    ellipsis: true,
    title: '三方用户/通道标识',
    width: 160,
  },
  { dataIndex: 'action', fixed: 'right', title: '操作', width: 280 },
];

function parseConfig(row: PayPassage) {
  const raw = row.payInterfaceConfig;
  if (raw == null || String(raw).trim() === '') return { mchNo: '-', payType: '-' };
  try {
    const parsed = JSON.parse(String(raw));
    if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { mchNo: '-', payType: '-' };
    }
    return {
      mchNo:
        parsed.mchNo != null && String(parsed.mchNo).trim() !== ''
          ? String(parsed.mchNo)
          : '-',
      payType:
        parsed.payType != null && String(parsed.payType).trim() !== ''
          ? String(parsed.payType)
          : '-',
    };
  } catch {
    return { mchNo: '-', payType: '-' };
  }
}

function timeLimitText(row: PayPassage) {
  if (row.timeLimit !== 1) return '未启用';
  const rules = String(row.timeRules ?? '').trim();
  if (!rules || rules === '|' || !rules.includes('|')) {
    return '已启用（未设置时段）';
  }
  const [start, end] = rules.split('|');
  return `已启用 ${start?.trim() || '--'} ~ ${end?.trim() || '--'}`;
}

async function loadStat() {
  try {
    const data = await fetchPassageRealTimeStatApi({ ...query });
    if (data) stat.value = data;
  } catch {
    // ignore
  }
}

async function loadData(resetPage = false) {
  if (resetPage) pagination.current = 1;
  loading.value = true;
  try {
    void loadStat();
    const page = await fetchMchAppsApi({
      ...query,
      pageNumber: pagination.current,
      pageSize: pagination.pageSize,
      payPassageId: query.payPassageId || undefined,
      productId: query.productId || undefined,
      enabledFirst: enabledFirst.value ? 1 : 0,
    });
    dataSource.value = page?.records ?? [];
    total.value = page?.total ?? 0;
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  selectedIds.value = [];
  void loadData(true);
}

function onReset() {
  query.payPassageId = '';
  query.payPassageName = '';
  query.productId = '';
  query.passageGroup = '';
  query.state = undefined;
  query.payInterfaceConfig = '';
  selectedIds.value = [];
  void loadData(true);
}

function onTableChange(pag: { current?: number; pageSize?: number }) {
  pagination.current = pag.current ?? 1;
  pagination.pageSize = pag.pageSize ?? 20;
  void loadData();
}

function onFormSuccess() {
  void loadData(true);
}

async function toggleState(row: PayPassage, checked: boolean | string | number) {
  const next = checked ? 1 : 0;
  const ok = await new Promise<boolean>((resolve) => {
    Modal.confirm({
      title: '二次确认',
      content:
        next === 1
          ? '确认【开启】该通道？启用后请检查额度限制、通道绑定、定时任务等，确保通道正常拉起。'
          : '确认【关闭】该通道？关闭后将立即停止通道定时任务！',
      okText: '确认',
      cancelText: '取消',
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
  if (!ok) return;
  const key = String(row.payPassageId);
  stateBusy.value[key] = true;
  try {
    const payload: Record<string, unknown> = { state: next };
    if (next === 0) payload.timeLimit = 0;
    else payload.openLimit = 1;
    await updateMchAppApi(row.payPassageId, payload);
    row.state = next;
    message.success('操作成功');
    void loadStat();
  } catch {
    message.error('操作失败');
  } finally {
    stateBusy.value[key] = false;
  }
}

function confirmDelete(row: PayPassage) {
  Modal.confirm({
    title: '确认删除通道？',
    content: `确定删除 [${row.payPassageId}] ${row.payPassageName} 吗？此操作不可恢复。`,
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      await deleteMchAppApi(row.payPassageId);
      message.success('删除成功');
      void loadData(true);
    },
  });
}

function openBatch() {
  if (selectedIds.value.length === 0) {
    message.error('请先勾选需要进行批量操作的通道');
    return;
  }
  const rows = dataSource.value.filter((r) =>
    selectedIds.value.includes(r.payPassageId),
  );
  const names = rows.length
    ? rows.map((row) => `[${row.payPassageId}] ${row.payPassageName}`)
    : selectedIds.value.map((id) => String(id));
  batchRef.value?.show(selectedIds.value, names);
}

function onBatchCopy() {
  const rows = dataSource.value.filter((r) =>
    selectedIds.value.includes(r.payPassageId),
  );
  batchCopyRef.value?.open(rows);
}

function onBatchDeleted() {
  selectedIds.value = [];
  void loadData(true);
}

async function submitResetAll(googleCode: string) {
  resetSaving.value = true;
  try {
    await resetAllMchAppBalanceApi(googleCode);
    message.success('通道清空成功');
    resetVisible.value = false;
    void loadData(true);
  } finally {
    resetSaving.value = false;
  }
}

async function submitCloseAll(googleCode: string) {
  closeAllSaving.value = true;
  try {
    await closeAllMchAppsApi(googleCode);
    message.success('关闭全部通道成功');
    closeAllVisible.value = false;
    void loadData(true);
  } finally {
    closeAllSaving.value = false;
  }
}

function confirmOpenRecently() {
  Modal.confirm({
    title: '打开最近启用通道',
    content:
      '将所有通道恢复到「关闭全部通道」前的状态（含定时任务）。有效时间约 3 小时，过期无效。',
    okText: '确定',
    cancelText: '取消',
    async onOk() {
      await openRecentlyMchAppsApi();
      message.success('恢复最近关闭通道状态成功');
      void loadData(true);
    },
  });
}

onMounted(() => {
  void loadData(true);
});
</script>

<template>
  <Page auto-content-height title="通道列表">
    <div class="ap-page-stack">
      <Card class="ap-page-filter">
        <Form layout="inline" @finish="onSearch">
          <Form.Item>
            <Input
              v-model:value="query.payPassageId"
              allow-clear
              placeholder="通道ID"
            />
          </Form.Item>
          <Form.Item>
            <Input
              v-model:value="query.payPassageName"
              allow-clear
              placeholder="通道名称"
            />
          </Form.Item>
          <Form.Item>
            <ProductSelector
              v-model="query.productId"
              placeholder="对应产品"
            />
          </Form.Item>
          <Form.Item>
            <PassageGroupSelector
              v-model="query.passageGroup"
              placeholder="通道供应商"
            />
          </Form.Item>
          <Form.Item>
            <Select
              v-model:value="query.state"
              allow-clear
              placeholder="状态"
              style="width: 120px"
              :options="STATE_OPTIONS"
            />
          </Form.Item>
          <Form.Item>
            <Input
              v-model:value="query.payInterfaceConfig"
              allow-clear
              placeholder="支付接口配置"
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
            <Button v-if="canAdd" type="primary" @click="formRef?.show()">
              新建
            </Button>
            <Button
              v-if="canEdit"
              danger
              ghost
              @click="resetVisible = true"
            >
              余额清空
            </Button>
            <Button
              v-if="canEdit"
              danger
              ghost
              @click="autoCleanRef?.show(stat)"
            >
              通道自动日切设置
            </Button>
            <Button
              v-if="canEdit"
              danger
              ghost
              @click="closeAllVisible = true"
            >
              关闭全部通道
            </Button>
            <Button v-if="canEdit" @click="confirmOpenRecently">
              打开最近启用通道
            </Button>
            <Button v-if="canEdit" @click="openBatch">批量操作通道</Button>
          </Space>
          <Space wrap>
            <Button size="small" @click="hourlyReportRef?.open()">
              成率报表
            </Button>
            <Tooltip
              title="打开后，会先按当前排序规则排序，再将已启用通道优先排列到前面。"
            >
              <span class="inline-flex items-center gap-2">
                <span class="text-muted-foreground text-sm">启用优先</span>
                <Switch
                  v-model:checked="enabledFirst"
                  @change="() => loadData(true)"
                />
              </span>
            </Tooltip>
            <Tag :color="stat.payPassageAutoClean === 1 ? 'success' : 'default'">
              {{ autoCleanTagText }}
            </Tag>
          </Space>
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
          row-key="payPassageId"
          :row-selection="{
            selectedRowKeys: selectedIds,
            onChange: (keys: (string | number)[]) => (selectedIds = keys),
          }"
          :scroll="{ x: 1900 }"
          size="middle"
          @change="onTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'payPassageId'">
              <div
                class="passage-cell"
                @click="detailRef?.show(record as PayPassage)"
              >
                <div class="passage-cell__name">
                  [{{ record.payPassageId }}] {{ record.payPassageName }}
                </div>
                <div class="passage-cell__product">
                  <AssetsIcon
                    :filename="String(record.productIcon ?? '')"
                    :size="16"
                  />
                  <span class="text-muted-foreground text-xs">
                    [{{ record.productId }}] {{ record.productName || '' }}
                  </span>
                </div>
              </div>
            </template>
            <template v-else-if="column.dataIndex === 'state'">
              <Switch
                :checked="record.state === 1"
                :disabled="!canEdit"
                :loading="!!stateBusy[String(record.payPassageId)]"
                @change="(c) => toggleState(record as PayPassage, c)"
              />
            </template>
            <template v-else-if="column.dataIndex === 'balance'">
              <div class="inline-action-cell">
                <Button
                  v-if="canEdit"
                  size="small"
                  type="primary"
                  class="inline-action-cell__action"
                  @click="balanceRef?.show(record as PayPassage)"
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
            <template v-else-if="column.dataIndex === 'weights'">
              <Button
                v-if="canEdit"
                type="link"
                class="!px-0"
                @click="weightsRef?.show(record as PayPassage)"
              >
                {{ record.weights ?? '--' }}
              </Button>
              <span v-else>{{ record.weights ?? '--' }}</span>
            </template>
            <template v-else-if="column.dataIndex === 'timeLimitState'">
              <Button
                type="link"
                class="!px-0"
                @click="timeLimitRef?.show(record as PayPassage)"
              >
                {{ timeLimitText(record as PayPassage) }}
              </Button>
            </template>
            <template v-else-if="column.dataIndex === 'rate'">
              <Button
                type="link"
                class="!px-0"
                @click="rateRef?.show(record as PayPassage)"
              >
                {{ formatRateDecimal(record.rate) }}
              </Button>
            </template>
            <template v-else-if="column.dataIndex === 'successRate'">
              <Button
                type="link"
                class="!px-0"
                @click="hourlyRef?.show(record as PayPassage)"
              >
                {{ formatRateDecimal(record.successRate) }}
              </Button>
            </template>
            <template v-else-if="column.dataIndex === 'passageGroup'">
              {{ record.passageGroupName || record.passageGroup || '' }}
            </template>
            <template v-else-if="column.dataIndex === 'agentRate'">
              <Button
                type="link"
                class="!px-0"
                @click="agentRef?.open(record as PayPassage)"
              >
                {{
                  record.agentNo ? formatRateDecimal(record.agentRate) : '--'
                }}
              </Button>
            </template>
            <template v-else-if="column.dataIndex === 'payInterfaceConfig'">
              <div class="text-xs">
                <div>{{ parseConfig(record as PayPassage).mchNo }}</div>
                <div>{{ parseConfig(record as PayPassage).payType }}</div>
              </div>
            </template>
            <template v-else-if="column.dataIndex === 'action'">
              <div class="ap-table-ops">
                <Button
                  v-if="canEdit"
                  size="small"
                  type="link"
                  class="ap-table-ops__link"
                  @click="formRef?.show(record.payPassageId)"
                >
                  修改
                </Button>
                <Button
                  v-if="canEdit"
                  size="small"
                  type="link"
                  class="ap-table-ops__link"
                  @click="mchBindRef?.show(record as PayPassage)"
                >
                  通道绑定
                </Button>
                <Button
                  v-if="canConfig && record.ifCode"
                  size="small"
                  type="link"
                  class="ap-table-ops__link"
                  @click="payParamRef?.show(record as PayPassage)"
                >
                  接口配置
                </Button>
                <Button
                  v-if="canEdit"
                  size="small"
                  type="link"
                  class="ap-table-ops__link"
                  @click="copyRef?.show(record as PayPassage)"
                >
                  一键复制
                </Button>
                <Button
                  v-if="canEdit"
                  size="small"
                  type="link"
                  class="ap-table-ops__link"
                  @click="testRef?.show(record as PayPassage)"
                >
                  通道测试
                </Button>
                <Button
                  v-if="canEdit"
                  danger
                  size="small"
                  type="link"
                  class="ap-table-ops__link"
                  @click="confirmDelete(record as PayPassage)"
                >
                  删除
                </Button>
              </div>
            </template>
          </template>
        </Table>
      </Card>
    </div>

    <PassageFormDrawer ref="formRef" @success="onFormSuccess" />
    <PassageDetailDrawer ref="detailRef" />
    <PassageMchConfigDrawer ref="mchBindRef" />
    <PassagePayParamConfigDrawer ref="payParamRef" @success="onFormSuccess" />
    <PassageCopyDialog ref="copyRef" @success="onFormSuccess" />
    <PassagePayTestDrawer ref="testRef" />
    <PassageBatchDrawer
      ref="batchRef"
      @success="onFormSuccess"
      @batch-copy="onBatchCopy"
      @deleted="onBatchDeleted"
    />
    <PassageBatchCopyDialog ref="batchCopyRef" @copied="onFormSuccess" />
    <PassageBalanceAdjustDialog ref="balanceRef" @success="onFormSuccess" />
    <PassageRateAdjustDialog ref="rateRef" @success="onFormSuccess" />
    <PassageAgentConfigDialog ref="agentRef" @success="onFormSuccess" />
    <PassageWeightsDialog ref="weightsRef" @success="onFormSuccess" />
    <PassageTimeLimitDialog ref="timeLimitRef" @success="onFormSuccess" />
    <PassageHourlyRateDrawer ref="hourlyRef" />
    <PassageHourlyRateReportDialog ref="hourlyReportRef" />
    <PassageAutoCleanDialog
      ref="autoCleanRef"
      @success="(info) => (stat = info)"
    />
    <GoogleDangerConfirmDialog
      v-model:open="resetVisible"
      header="一键清空通道余额"
      warning="此操作后将清空通道余额，请谨慎操作"
      :saving="resetSaving"
      @confirm="submitResetAll"
    />
    <GoogleDangerConfirmDialog
      v-model:open="closeAllVisible"
      header="关闭全部通道"
      warning="该操作将关闭全部通道并停止定时任务，请谨慎操作。状态仅保存约 3 小时。"
      :saving="closeAllSaving"
      @confirm="submitCloseAll"
    />
  </Page>
</template>

<style scoped>
.passage-cell {
  cursor: pointer;
  min-width: 0;
}

.passage-cell:hover .passage-cell__name {
  color: hsl(var(--primary));
}

.passage-cell__name {
  font-weight: 500;
  line-height: 1.4;
  word-break: break-all;
}

.passage-cell__product {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
  min-width: 0;
}
</style>

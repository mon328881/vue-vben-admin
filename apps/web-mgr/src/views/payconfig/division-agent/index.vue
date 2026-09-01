<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import {
  Button,
  Card,
  Descriptions,
  Drawer,
  Form,
  Input,
  Modal,
  RangePicker,
  Select,
  Space,
  Table,
  Tag,
  message,
} from 'ant-design-vue';

import {
  fetchAgentDivisionConfigApi,
  fetchAgentDivisionCountApi,
  fetchAgentDivisionListApi,
  reviewAgentDivisionOkApi,
  reviewAgentDivisionRefuseApi,
  setAgentDivisionConfigApi,
} from '#/api';
import type { DivisionRecord } from '#/api/modules/division';
import FilterActions from '#/components/list/FilterActions.vue';
import ListStatCards, {
  type ListStatCardItem,
} from '#/components/list/ListStatCards.vue';
import {
  DIVISION_STATE_OPTIONS,
  divisionStateColor,
  divisionStateLabel,
} from '#/constants/merchant';
import { hasEnt } from '#/utils/access';
import { formatDateTime, formatYuan } from '#/utils/format';

defineOptions({ name: 'DivisionAgentPage' });

const loading = ref(false);
const reviewLoading = ref(false);
const dataSource = ref<DivisionRecord[]>([]);
const total = ref(0);
const pagination = reactive({ current: 1, pageSize: 20 });
const dateRange = ref<[string, string] | undefined>();
const query = reactive({
  recordId: '',
  userNo: '',
  state: '1' as string | undefined,
});
const countStat = reactive({ count: 0, totalAmount: 0 });
const config = reactive({
  agentFee: 0,
  agentFeeRate: 0,
  agentMinWithdraw: 0,
});
const configDialogVisible = ref(false);
const configSaving = ref(false);
const configForm = reactive({
  agentFee: '',
  agentFeeRate: '',
  agentMinWithdraw: '',
});
const drawerVisible = ref(false);
const detail = ref<DivisionRecord | null>(null);

const canReview = computed(() => hasEnt('ENT_DIVISION_AGENT'));

const listStatItems = computed<ListStatCardItem[]>(() => [
  {
    title: '待审核申请（条）',
    value: Number(countStat.count ?? 0),
    icon: 'lucide:list-ordered',
  },
  {
    title: '待审核总金额',
    value: Number(countStat.totalAmount ?? 0) / 100,
    decimals: 2,
    prefix: '¥',
    icon: 'lucide:wallet',
  },
  {
    title: '最小结算',
    value: Number(config.agentMinWithdraw ?? 0) / 100,
    decimals: 2,
    prefix: '¥',
    icon: 'lucide:settings',
    sub: `手续费 ${formatYuan(config.agentFee)} · 费率 ${((config.agentFeeRate || 0) * 100).toFixed(2)}%`,
  },
]);

const columns: TableColumnsType = [
  { dataIndex: 'recordId', fixed: 'left', title: '流水单号', width: 160 },
  { dataIndex: 'userNo', title: '代理商', width: 180 },
  { dataIndex: 'createdAt', title: '申请时间', width: 170 },
  { dataIndex: 'applyAmount', title: '申请金额', width: 110 },
  { dataIndex: 'amount', title: '到账金额', width: 110 },
  { dataIndex: 'feeAmount', title: '服务费', width: 100 },
  { dataIndex: 'state', title: '状态', width: 100 },
  { dataIndex: 'remark', ellipsis: true, title: '备注', width: 140 },
  { dataIndex: 'action', fixed: 'right', title: '操作', width: 100 },
];

function applyAmountOf(row: Record<string, unknown>) {
  return (row.applyAmount ?? row.amount) as number | undefined;
}

function receiveAmountOf(row: Record<string, unknown>) {
  return (row.divisionAmount ?? row.receiveAmount) as number | undefined;
}

function feeAmountOf(row: Record<string, unknown>) {
  return (row.divisionAmountFee ?? row.feeAmount) as number | undefined;
}

function buildParams() {
  const [createdStart, createdEnd] = dateRange.value ?? [];
  const params: Record<string, unknown> = {
    ...query,
    pageNumber: pagination.current,
    pageSize: pagination.pageSize,
  };
  if (createdStart) params.createdStart = createdStart;
  if (createdEnd) params.createdEnd = createdEnd;
  return params;
}

async function loadConfig() {
  try {
    const data = (await fetchAgentDivisionConfigApi()) ?? {};
    config.agentFee = Number(data.agentFee ?? 0);
    config.agentFeeRate = Number(data.agentFeeRate ?? 0);
    config.agentMinWithdraw = Number(data.agentMinWithdraw ?? 0);
  } catch {
    // ignore
  }
}

async function loadCount() {
  try {
    const data =
      ((await fetchAgentDivisionCountApi({})) as {
        count?: number;
        totalAmount?: number;
      }) ?? {};
    countStat.count = data.count ?? 0;
    countStat.totalAmount = data.totalAmount ?? 0;
  } catch {
    // ignore
  }
}

async function loadData(resetPage = false) {
  if (resetPage) pagination.current = 1;
  loading.value = true;
  try {
    void loadCount();
    const page = await fetchAgentDivisionListApi(buildParams());
    dataSource.value = page?.records ?? [];
    total.value = page?.total ?? 0;
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  void loadData(true);
}

function onReset() {
  query.recordId = '';
  query.userNo = '';
  query.state = '1';
  dateRange.value = undefined;
  void loadData(true);
}

function onTableChange(pag: { current?: number; pageSize?: number }) {
  pagination.current = pag.current ?? 1;
  pagination.pageSize = pag.pageSize ?? 20;
  void loadData();
}

function openDetail(row: DivisionRecord) {
  detail.value = { ...row };
  drawerVisible.value = true;
}

function closeDetail() {
  drawerVisible.value = false;
  detail.value = null;
}

async function onReviewOk() {
  if (!detail.value?.recordId) return;
  reviewLoading.value = true;
  try {
    await reviewAgentDivisionOkApi(detail.value.recordId);
    message.success('操作成功');
    closeDetail();
    void loadData();
  } catch {
    // request 拦截器已提示业务错误，这里仅避免未捕获的 [object Object]
  } finally {
    reviewLoading.value = false;
  }
}

async function onReviewRefuse() {
  if (!detail.value?.recordId) return;
  reviewLoading.value = true;
  try {
    await reviewAgentDivisionRefuseApi(detail.value.recordId);
    message.success('操作成功');
    closeDetail();
    void loadData();
  } catch {
    // request 拦截器已提示业务错误，这里仅避免未捕获的 [object Object]
  } finally {
    reviewLoading.value = false;
  }
}

function openConfig() {
  configForm.agentFee = String((config.agentFee || 0) / 100);
  configForm.agentFeeRate = String((config.agentFeeRate || 0) * 100);
  configForm.agentMinWithdraw = String((config.agentMinWithdraw || 0) / 100);
  configDialogVisible.value = true;
}

async function saveConfig() {
  const fee = Number(configForm.agentFee);
  const feeRate = Number(configForm.agentFeeRate);
  const minWithdraw = Number(configForm.agentMinWithdraw);
  if (
    !Number.isFinite(fee) ||
    !Number.isFinite(feeRate) ||
    !Number.isFinite(minWithdraw)
  ) {
    message.error('设置的格式有误，只能输入数字');
    return false;
  }
  if (minWithdraw <= fee) {
    message.error('提现手续费不能大于最小提现金额');
    return false;
  }
  if (fee < 0) {
    message.error('提现手续费需大于等于0');
    return false;
  }
  await setAgentDivisionConfigApi({
    agentFee: fee * 100,
    agentFeeRate: feeRate / 100,
    agentMinWithdraw: minWithdraw * 100,
  });
  config.agentFee = fee * 100;
  config.agentFeeRate = feeRate / 100;
  config.agentMinWithdraw = minWithdraw * 100;
  message.success('修改结算设置成功');
  await loadConfig();
  return true;
}

async function onConfirmConfig() {
  if (configSaving.value) return;
  configSaving.value = true;
  try {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    if (await saveConfig()) {
      configDialogVisible.value = false;
    }
  } finally {
    configSaving.value = false;
  }
}

onMounted(async () => {
  await loadConfig();
  void loadData(true);
});
</script>

<template>
  <Page auto-content-height title="代理结算管理">
    <div class="ap-page-stack">
      <Card class="ap-page-filter">
        <Form layout="inline" @finish="onSearch">
          <Form.Item>
            <RangePicker
              v-model:value="dateRange"
              show-time
              value-format="YYYY-MM-DD HH:mm:ss"
              :placeholder="['创建时间开始', '创建时间结束']"
            />
          </Form.Item>
          <Form.Item>
            <Input
              v-model:value="query.recordId"
              allow-clear
              placeholder="流水单号"
            />
          </Form.Item>
          <Form.Item>
            <Input
              v-model:value="query.userNo"
              allow-clear
              placeholder="代理商号"
            />
          </Form.Item>
          <Form.Item>
            <Select
              v-model:value="query.state"
              allow-clear
              placeholder="状态"
              style="width: 140px"
              :options="DIVISION_STATE_OPTIONS"
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
          <Button type="primary" @click="openConfig">代理结算设置</Button>
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
          row-key="recordId"
          :scroll="{ x: 1300 }"
          size="middle"
          @change="onTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'userNo'">
              <div>
                <div>{{ record.userNo }}</div>
                <div class="text-muted-foreground text-xs">
                  {{ record.userName || '' }}
                </div>
              </div>
            </template>
            <template v-else-if="column.dataIndex === 'createdAt'">
              {{ formatDateTime(record.createdAt) }}
            </template>
            <template v-else-if="column.dataIndex === 'applyAmount'">
              {{ formatYuan(applyAmountOf(record as any)) }}
            </template>
            <template v-else-if="column.dataIndex === 'amount'">
              {{ formatYuan(receiveAmountOf(record as any)) }}
            </template>
            <template v-else-if="column.dataIndex === 'feeAmount'">
              {{ formatYuan(feeAmountOf(record as any)) }}
            </template>
            <template v-else-if="column.dataIndex === 'state'">
              <Tag :color="divisionStateColor(record.state)">
                {{ divisionStateLabel(record.state) }}
              </Tag>
            </template>
            <template v-else-if="column.dataIndex === 'action'">
              <Button
                v-if="canReview && Number(record.state) === 1"
                size="small"
                type="link"
                @click="openDetail(record as DivisionRecord)"
              >
                审核
              </Button>
            </template>
          </template>
        </Table>
      </Card>
    </div>

    <Drawer
      v-model:open="drawerVisible"
      title="订单详情"
      width="560"
      destroy-on-close
      @close="closeDetail"
    >
      <template v-if="detail" #footer>
        <Space>
          <Button type="primary" :loading="reviewLoading" @click="onReviewOk">
            已汇款
          </Button>
          <Button danger :loading="reviewLoading" @click="onReviewRefuse">
            驳回
          </Button>
          <Button @click="closeDetail">关闭</Button>
        </Space>
      </template>
      <template v-if="detail">
        <Descriptions :column="1" size="small" class="mb-4">
          <Descriptions.Item label="代理商号">
            <b>{{ detail.userNo || '--' }}</b>
          </Descriptions.Item>
          <Descriptions.Item label="代理商名称">
            {{ detail.userName || '--' }}
          </Descriptions.Item>
          <Descriptions.Item label="申请时间">
            {{ formatDateTime(detail.createdAt) }}
          </Descriptions.Item>
          <Descriptions.Item label="过期时间">
            {{ formatDateTime(detail.expiredTime) }}
          </Descriptions.Item>
          <Descriptions.Item label="订单状态">
            <Tag :color="divisionStateColor(detail.state)">
              {{ divisionStateLabel(detail.state) }}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
        <Descriptions :column="1" size="small" class="mb-4">
          <Descriptions.Item label="申请金额">
            {{ formatYuan(applyAmountOf(detail as any)) }}
          </Descriptions.Item>
          <Descriptions.Item label="到账金额">
            <Tag color="success">
              {{ formatYuan(receiveAmountOf(detail as any)) }}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="手续费">
            <b>{{ formatYuan(feeAmountOf(detail as any)) }}</b>
          </Descriptions.Item>
        </Descriptions>
        <div class="text-muted-foreground mb-1 text-sm">备注</div>
        <div class="rounded border p-3 text-sm whitespace-pre-wrap">
          {{ detail.remark || '--' }}
        </div>
      </template>
    </Drawer>

    <Modal
      v-model:open="configDialogVisible"
      title="代理结算设置"
      :confirm-loading="configSaving"
      ok-text="确定"
      cancel-text="取消"
      @ok="onConfirmConfig"
    >
      <div class="mb-3 text-sm">
        代理结算手续费 = 结算金额 * 比例手续费 + 固定手续费
      </div>
      <Form :label-col="{ span: 8 }" :wrapper-col="{ span: 14 }">
        <Form.Item label="最小结算金额设置">
          <Input
            v-model:value="configForm.agentMinWithdraw"
            placeholder="请输入"
          />
        </Form.Item>
        <Form.Item label="单笔[固定]手续费">
          <Input v-model:value="configForm.agentFee" placeholder="请输入" />
        </Form.Item>
        <Form.Item label="单笔[比例]手续费">
          <Input v-model:value="configForm.agentFeeRate" placeholder="请输入" />
        </Form.Item>
      </Form>
    </Modal>
  </Page>
</template>

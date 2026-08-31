<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import {
  Button,
  Card,
  Form,
  Input,
  RangePicker,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  fetchForceOrderStatApi,
  fetchPayOrderDetailApi,
  fetchPayOrderForceListApi,
} from '#/api';
import type { PayOrder, PayRealTimeStat } from '#/api/types/business';
import FilterActions from '#/components/list/FilterActions.vue';
import ListStatCards, {
  type ListStatCardItem,
} from '#/components/list/ListStatCards.vue';
import PassageSelector from '#/components/selectors/PassageSelector.vue';
import CellCopyStack from '#/components/table/CellCopyStack.vue';
import {
  notifyStateColor,
  notifyStateLabel,
  payOrderStateColor,
  payOrderStateLabel,
} from '#/constants/order';
import { defaultTodayRange } from '#/utils/date-range';
import { formatDateTime, formatYuan } from '#/utils/format';
import PayOrderDetailDrawer from '../pay/components/PayOrderDetailDrawer.vue';

defineOptions({ name: 'OrderForceListPage' });

const loading = ref(false);
const dataSource = ref<PayOrder[]>([]);
const total = ref(0);
const pagination = reactive({ current: 1, pageSize: 20 });
const successRange = ref<[string, string] | undefined>(defaultTodayRange());
const query = reactive({
  payOrderId: '',
  mchOrderNo: '',
  passageOrderNo: '',
  mchNo: '',
  passageId: '' as string | number,
});
const stat = ref<PayRealTimeStat>({});
const detailOpen = ref(false);
const detailLoading = ref(false);
const detail = ref<PayOrder | null>(null);

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
  ];
});

const columns: TableColumnsType = [
  { dataIndex: 'mchNo', fixed: 'left', title: '商户号/商户', width: 160 },
  { dataIndex: 'orderNo', title: '订单号（点击复制）', width: 310 },
  { dataIndex: 'amount', title: '支付金额', width: 110 },
  { dataIndex: 'forceChangeBeforeState', title: '补单前', width: 100 },
  { dataIndex: 'state', title: '当前状态', width: 100 },
  { dataIndex: 'forceChangeLoginName', title: '操作员', width: 100 },
  { dataIndex: 'notifyState', title: '回调状态', width: 100 },
  { dataIndex: 'updatedAt', title: '更新时间', width: 170 },
  { dataIndex: 'passageName', ellipsis: true, title: '支付通道', width: 140 },
  { dataIndex: 'action', fixed: 'right', title: '操作', width: 90 },
];

function buildParams() {
  const [successTimeStart, successTimeEnd] = successRange.value ?? [];
  return {
    ...query,
    passageId: query.passageId === '' ? undefined : query.passageId,
    successTimeStart,
    successTimeEnd,
    pageNumber: pagination.current,
    pageSize: pagination.pageSize,
  };
}

async function loadStat() {
  try {
    stat.value = (await fetchForceOrderStatApi(buildParams())) ?? {};
  } catch {
    // ignore
  }
}

async function loadData(resetPage = false) {
  if (resetPage) pagination.current = 1;
  loading.value = true;
  try {
    void loadStat();
    const page = await fetchPayOrderForceListApi(buildParams());
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
  query.payOrderId = '';
  query.mchOrderNo = '';
  query.passageOrderNo = '';
  query.mchNo = '';
  query.passageId = '';
  successRange.value = defaultTodayRange();
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
  } catch {
    detail.value = row;
  } finally {
    detailLoading.value = false;
  }
}

onMounted(() => {
  void loadData(true);
});
</script>

<template>
  <Page auto-content-height title="补单列表">
    <div class="ap-page-stack">
      <Card class="ap-page-filter">
      <Form layout="inline" @finish="onSearch">
        <Form.Item>
          <RangePicker
            v-model:value="successRange"
            show-time
            value-format="YYYY-MM-DD HH:mm:ss"
            :placeholder="['成功时间开始', '成功时间结束']"
          />
        </Form.Item>
        <Form.Item>
          <Input
            v-model:value="query.payOrderId"
            allow-clear
            placeholder="支付订单号"
          />
        </Form.Item>
        <Form.Item>
          <Input
            v-model:value="query.mchOrderNo"
            allow-clear
            placeholder="商户订单号"
          />
        </Form.Item>
        <Form.Item>
          <Input
            v-model:value="query.passageOrderNo"
            allow-clear
            placeholder="通道订单号"
          />
        </Form.Item>
        <Form.Item>
          <Input v-model:value="query.mchNo" allow-clear placeholder="商户号" />
        </Form.Item>
        <Form.Item>
          <PassageSelector
            v-model="query.passageId"
            placeholder="对应通道"
          />
        </Form.Item>
        <Form.Item class="ap-filter-actions">
          <FilterActions @reset="onReset" />
        </Form.Item>
      </Form>
    </Card>

    <ListStatCards :items="listStatItems" />

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
        row-key="payOrderId"
        :scroll="{ x: 1400 }"
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
          <template v-else-if="column.dataIndex === 'orderNo'">
            <CellCopyStack
              :pay-order-id="record.payOrderId as string"
              :mch-order-no="record.mchOrderNo as string"
            />
          </template>
          <template v-else-if="column.dataIndex === 'amount'">
            <b class="text-brand">{{ formatYuan(record.amount as number) }}</b>
          </template>
          <template v-else-if="column.dataIndex === 'forceChangeBeforeState'">
            <Tag :color="payOrderStateColor(record.forceChangeBeforeState as number)">
              {{ payOrderStateLabel(record.forceChangeBeforeState as number) }}
            </Tag>
          </template>
          <template v-else-if="column.dataIndex === 'state'">
            <Tag :color="payOrderStateColor(record.state as number)">
              {{ payOrderStateLabel(record.state as number) }}
            </Tag>
          </template>
          <template v-else-if="column.dataIndex === 'notifyState'">
            <Tag :color="notifyStateColor(record.notifyState as number)">
              {{ notifyStateLabel(record.notifyState as number) }}
            </Tag>
          </template>
          <template v-else-if="column.dataIndex === 'updatedAt'">
            {{ formatDateTime(record.updatedAt as string) }}
          </template>
          <template v-else-if="column.dataIndex === 'action'">
            <div class="ap-table-ops">
              <Button
                size="small"
                type="link"
                class="ap-table-ops__link"
                @click="openDetail(record as PayOrder)"
              >
                订单详情
              </Button>
            </div>
          </template>
        </template>
      </Table>
    </Card>

    <PayOrderDetailDrawer
      v-model:open="detailOpen"
      :detail="detail"
      :loading="detailLoading"
    />
    </div>
  </Page>
</template>

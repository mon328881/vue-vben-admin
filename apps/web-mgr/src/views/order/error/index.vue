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
  RangePicker,
  Table,
  Tag,
  message,
} from 'ant-design-vue';

import {
  fetchErrorOrderDetailApi,
  fetchErrorOrderListApi,
  fetchErrorOrderStatApi,
} from '#/api';
import FilterActions from '#/components/list/FilterActions.vue';
import ListStatCards, {
  type ListStatCardItem,
} from '#/components/list/ListStatCards.vue';
import CellCopyStack from '#/components/table/CellCopyStack.vue';
import {
  payOrderStateColor,
  payOrderStateLabel,
} from '#/constants/order';
import { hasEnt } from '#/utils/access';
import { formatDateTime, formatYuan } from '#/utils/format';
import { defaultTodayRange } from '#/utils/date-range';

defineOptions({ name: 'OrderErrorListPage' });

const loading = ref(false);
const dataSource = ref<Record<string, unknown>[]>([]);
const total = ref(0);
const pagination = reactive({ current: 1, pageSize: 20 });
const dateRange = ref<[string, string] | undefined>(defaultTodayRange());
const query = reactive({
  mchName: '',
  mchNo: '',
  mchOrderNo: '',
});
const stat = ref<{ totalAmount?: number; totalCount?: number }>({});
const detailOpen = ref(false);

const listStatItems = computed<ListStatCardItem[]>(() => {
  const s = stat.value;
  return [
    {
      title: '订单总金额',
      value: Number(s.totalAmount ?? 0) / 100,
      decimals: 2,
      prefix: '¥',
      icon: 'lucide:wallet',
    },
    {
      title: '订单总数',
      value: Number(s.totalCount ?? 0),
      icon: 'lucide:list-ordered',
    },
  ];
});

const detailLoading = ref(false);
const detail = ref<Record<string, unknown> | null>(null);

const canView = computed(() => hasEnt('ENT_PAY_ORDER_VIEW'));

const columns: TableColumnsType = [
  { dataIndex: 'mchNo', fixed: 'left', title: '商户号/商户', width: 160 },
  { dataIndex: 'orderNo', title: '商户订单号（点击复制）', width: 200 },
  { dataIndex: 'amount', title: '支付金额', width: 110 },
  { dataIndex: 'productName', ellipsis: true, title: '支付产品', width: 140 },
  { dataIndex: 'state', title: '支付状态', width: 100 },
  { dataIndex: 'createdAt', title: '创建时间', width: 170 },
  { dataIndex: 'action', fixed: 'right', title: '操作', width: 100 },
];

function buildParams() {
  const [createdStart, createdEnd] = dateRange.value ?? [];
  return {
    ...query,
    createdStart,
    createdEnd,
    pageNumber: pagination.current,
    pageSize: pagination.pageSize,
  };
}

async function loadStat() {
  try {
    stat.value = (await fetchErrorOrderStatApi(buildParams())) ?? {};
  } catch {
    // ignore
  }
}

async function loadData(resetPage = false) {
  if (resetPage) pagination.current = 1;
  loading.value = true;
  try {
    void loadStat();
    const page = await fetchErrorOrderListApi(buildParams());
    dataSource.value = (page?.records as Record<string, unknown>[]) ?? [];
    total.value = page?.total ?? 0;
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  void loadData(true);
}

function onReset() {
  query.mchName = '';
  query.mchNo = '';
  query.mchOrderNo = '';
  dateRange.value = defaultTodayRange();
  void loadData(true);
}

function onTableChange(pag: { current?: number; pageSize?: number }) {
  pagination.current = pag.current ?? 1;
  pagination.pageSize = pag.pageSize ?? 20;
  void loadData();
}

async function openDetail(row: Record<string, unknown>) {
  const id = row.errorOrderId;
  if (id == null) {
    message.error('异常订单 ID 无效');
    return;
  }
  detailOpen.value = true;
  detailLoading.value = true;
  try {
    detail.value = (await fetchErrorOrderDetailApi(String(id))) ?? row;
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
  <Page auto-content-height title="异常订单">
    <div class="ap-page-stack">
      <Card class="ap-page-filter">
      <Form layout="inline" @submit="onSearch">
        <Form.Item>
          <RangePicker
            v-model:value="dateRange"
            show-time
            value-format="YYYY-MM-DD HH:mm:ss"
            :placeholder="['创建时间开始', '创建时间结束']"
          />
        </Form.Item>
        <Form.Item>
          <Input v-model:value="query.mchName" allow-clear placeholder="商户名" />
        </Form.Item>
        <Form.Item>
          <Input v-model:value="query.mchNo" allow-clear placeholder="商户号" />
        </Form.Item>
        <Form.Item>
          <Input
            v-model:value="query.mchOrderNo"
            allow-clear
            placeholder="商户订单号"
          />
        </Form.Item>
        <Form.Item class="ap-filter-actions">
          <FilterActions @search="onSearch" @reset="onReset" />
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
        :row-key="(r: any, i?: number) => String(r.errorOrderId ?? r.mchOrderNo ?? i ?? 0)"
        :scroll="{ x: 1100 }"
        size="middle"
        @change="onTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'mchNo'">
            <div>
              <div>{{ record.mchNo }}</div>
              <div class="text-muted-foreground text-xs">
                {{ record.mchName || '' }}
              </div>
            </div>
          </template>
          <template v-else-if="column.dataIndex === 'orderNo'">
            <CellCopyStack :mch-order-no="record.mchOrderNo as string" />
          </template>
          <template v-else-if="column.dataIndex === 'amount'">
            {{ formatYuan(record.amount as number) }}
          </template>
          <template v-else-if="column.dataIndex === 'productName'">
            {{ record.productName || '-' }}
          </template>
          <template v-else-if="column.dataIndex === 'state'">
            <Tag :color="payOrderStateColor(record.state as number)">
              {{ payOrderStateLabel(record.state as number) }}
            </Tag>
          </template>
          <template v-else-if="column.dataIndex === 'createdAt'">
            {{ formatDateTime(record.createdAt as string) }}
          </template>
          <template v-else-if="column.dataIndex === 'action'">
            <Button
              v-if="canView"
              size="small"
              type="link"
              @click="openDetail(record as Record<string, unknown>)"
            >
              查看详情
            </Button>
          </template>
        </template>
      </Table>
    </Card>

    <Drawer
      v-model:open="detailOpen"
      title="异常订单详情"
      width="680"
      :loading="detailLoading"
    >
      <Descriptions v-if="detail" :column="1" bordered size="small">
        <Descriptions.Item label="商户号">
          {{ detail.mchNo }}
        </Descriptions.Item>
        <Descriptions.Item label="商户名称">
          {{ detail.mchName || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="支付金额">
          {{ formatYuan(detail.amount as number) }}
        </Descriptions.Item>
        <Descriptions.Item label="商户订单号">
          {{ detail.mchOrderNo }}
        </Descriptions.Item>
        <Descriptions.Item label="支付产品">
          {{ detail.productName || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="支付状态">
          <Tag :color="payOrderStateColor(detail.state as number)">
            {{ payOrderStateLabel(detail.state as number) }}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="创建时间">
          {{ formatDateTime(detail.createdAt as string) }}
        </Descriptions.Item>
        <Descriptions.Item label="商户请求参数">
          <pre class="m-0 max-h-48 overflow-auto whitespace-pre-wrap text-xs">{{
            detail.mchReq || '-'
          }}</pre>
        </Descriptions.Item>
        <Descriptions.Item label="错误信息">
          <pre class="m-0 max-h-48 overflow-auto whitespace-pre-wrap text-xs">{{
            detail.mchResp || '-'
          }}</pre>
        </Descriptions.Item>
      </Descriptions>
    </Drawer>
    </div>
  </Page>
</template>

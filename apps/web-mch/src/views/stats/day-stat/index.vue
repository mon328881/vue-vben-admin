<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import {
  Card,
  Col,
  DatePicker,
  Form,
  Row,
  Table,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchDayStatCountApi, fetchDayStatListApi } from '#/api';
import type { MchStat } from '#/api/types/business';
import FilterActions from '#/components/list/FilterActions.vue';
import ListStatCards, {
  type ListStatCardItem,
} from '#/components/list/ListStatCards.vue';
import {
  defaultWeekRange,
  formatDayEnd,
  formatDayStart,
} from '#/utils/date-range';
import { formatDateTime, formatSuccessRate, formatYuan } from '#/utils/format';

defineOptions({ name: 'DayStatPage' });

const query = reactive({
  pageNumber: 1,
  pageSize: 20,
  createdStart: '',
  createdEnd: '',
});
const createdRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>();
const list = ref<MchStat[]>([]);
const total = ref(0);
const loading = ref(false);
const searchLoading = ref(false);
const summary = reactive({
  totalMchCost: 0,
  totalSuccessAmount: 0,
  totalSuccessCount: 0,
});

const listStatItems = computed<ListStatCardItem[]>(() => [
  {
    title: '成交订单金额',
    value: Number(summary.totalSuccessAmount ?? 0) / 100,
    decimals: 2,
    prefix: '¥',
    icon: 'lucide:wallet',
  },
  {
    title: '成交订单数',
    value: Number(summary.totalSuccessCount ?? 0),
    icon: 'lucide:list-ordered',
  },
  {
    title: '服务费',
    value: Number(summary.totalMchCost ?? 0) / 100,
    decimals: 2,
    prefix: '¥',
    icon: 'lucide:percent',
  },
]);

const columns: TableColumnsType<MchStat> = [
  { dataIndex: 'statisticsDate', title: '日期', width: 140 },
  { dataIndex: 'mchNo', title: '商户号', width: 160 },
  { dataIndex: 'totalSuccessAmount', title: '成交额' },
  { dataIndex: 'totalMchCost', title: '服务费' },
  { dataIndex: 'successRate', title: '支付成功率' },
  { dataIndex: 'totalOrderCount', title: '订单总笔数' },
  { dataIndex: 'orderSuccessCount', title: '成交笔数' },
  { dataIndex: 'createdAt', title: '创建日期' },
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
    createdEnd: query.createdEnd || undefined,
    createdStart: query.createdStart || undefined,
  };
}

async function loadSummary() {
  try {
    const data = await fetchDayStatCountApi(filters());
    summary.totalMchCost = data?.totalMchCost ?? 0;
    summary.totalSuccessAmount = data?.totalSuccessAmount ?? 0;
    summary.totalSuccessCount = data?.totalSuccessCount ?? 0;
  } catch (error) {
    console.error(error);
  }
}

async function load() {
  loading.value = true;
  try {
    const data = await fetchDayStatListApi({
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
    searchLoading.value = false;
  }
}

async function onSearch() {
  query.pageNumber = 1;
  searchLoading.value = true;
  await loadSummary();
  await load();
}

function applyDefaultRange() {
  const [start, end] = defaultWeekRange();
  createdRange.value = [dayjs(start), dayjs(end)];
  query.createdStart = start;
  query.createdEnd = end;
}

function onReset() {
  applyDefaultRange();
  query.pageNumber = 1;
  searchLoading.value = true;
  loadSummary();
  load();
}

onMounted(async () => {
  applyDefaultRange();
  searchLoading.value = true;
  await loadSummary();
  await load();
});
</script>

<template>
  <Page auto-content-height title="日终统计">
    <div class="ap-page-stack">
      <Card class="ap-page-filter">
        <Form class="ap-pay-order-filter" @finish="onSearch">
          <Row :gutter="[16, 16]">
            <Col :lg="8" :md="12" :span="24">
              <Form.Item>
                <DatePicker.RangePicker
                  v-model:value="createdRange"
                  show-time
                  style="width: 100%"
                  :placeholder="['统计日期开始', '统计日期结束']"
                />
              </Form.Item>
            </Col>
            <Col :lg="16" :md="12" :span="24" class="ap-filter-actions">
              <FilterActions
                submit-text="搜索"
                :loading="searchLoading"
                @reset="onReset"
              />
            </Col>
          </Row>
        </Form>
      </Card>

      <ListStatCards :items="listStatItems" />

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
          row-key="statisticsMchId"
          @change="
            (p) => {
              query.pageNumber = p.current ?? 1;
              query.pageSize = p.pageSize ?? 20;
              load();
            }
          "
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'statisticsDate'">
              <b>{{
                String(
                  (record as MchStat).statisticsDate ||
                    (record as MchStat).createdAt ||
                    '',
                ).slice(0, 10) || '—'
              }}</b>
            </template>
            <template v-else-if="column.dataIndex === 'totalSuccessAmount'">
              <b class="amount-positive">{{
                formatYuan(record.totalSuccessAmount)
              }}</b>
            </template>
            <template v-else-if="column.dataIndex === 'totalMchCost'">
              <b>{{ formatYuan(record.totalMchCost) }}</b>
            </template>
            <template v-else-if="column.dataIndex === 'successRate'">
              <b>{{
                formatSuccessRate(
                  record.orderSuccessCount,
                  record.totalOrderCount,
                )
              }}</b>
            </template>
            <template v-else-if="column.dataIndex === 'totalOrderCount'">
              {{ record.totalOrderCount || 0 }}
            </template>
            <template v-else-if="column.dataIndex === 'orderSuccessCount'">
              {{ record.orderSuccessCount || 0 }}
            </template>
            <template v-else-if="column.dataIndex === 'createdAt'">
              {{ formatDateTime(record.createdAt) }}
            </template>
          </template>
        </Table>
      </Card>
    </div>
  </Page>
</template>


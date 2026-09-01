<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';
import { computed, ref } from 'vue';

import {
  Drawer,
  Empty,
  Spin,
  Table,
  Tag,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  fetchPassageRateDetailApi,
  type PassageRateDetail,
  type PassageRateRow,
} from '#/api';
import {
  formatFeeRate,
  formatSuccessRate,
  formatYuan,
} from '#/utils/format';

defineOptions({ name: 'PassageRateDetailDrawer' });

interface ShowParams {
  statisticsDate?: string;
  payPassageId: number;
  payPassageName?: string;
}

const visible = ref(false);
const loading = ref(false);
const meta = ref<{
  statisticsDate: string;
  payPassageId: null | number;
  payPassageName?: string;
}>({
  statisticsDate: '',
  payPassageId: null,
});
const detail = ref<null | PassageRateDetail>(null);
let reqCounter = 0;

const rates = computed(() =>
  [...(detail.value?.rates ?? [])].sort(
    (a, b) => Number(a.passageRate) - Number(b.passageRate),
  ),
);

const summaryItems = computed(() => {
  const d = detail.value;
  return [
    { label: '总订单金额', value: formatYuan(d?.totalAmount) },
    { label: '成功金额', value: formatYuan(d?.totalSuccessAmount) },
    { label: '订单数', value: String(d?.totalOrderCount ?? 0) },
    { label: '成功订单数', value: String(d?.orderSuccessCount ?? 0) },
    {
      label: '成功率',
      value: formatSuccessRate(d?.orderSuccessCount, d?.totalOrderCount),
      className: 'text-brand',
    },
  ];
});

const columns: TableColumnsType<PassageRateRow> = [
  { dataIndex: 'passageRate', title: '通道费率', width: 140 },
  { dataIndex: 'totalAmount', title: '订单金额', align: 'right', width: 120 },
  {
    dataIndex: 'totalSuccessAmount',
    title: '成功金额',
    align: 'right',
    width: 120,
  },
  { dataIndex: 'totalOrderCount', title: '订单数', align: 'right', width: 90 },
  {
    dataIndex: 'orderSuccessCount',
    title: '成功数',
    align: 'right',
    width: 90,
  },
  { dataIndex: 'successRate', title: '成功率', align: 'right', width: 100 },
];

async function load() {
  const token = ++reqCounter;
  loading.value = true;
  detail.value = null;
  try {
    const data = await fetchPassageRateDetailApi({
      statisticsDate: meta.value.statisticsDate,
      payPassageId: meta.value.payPassageId as number,
    });
    if (token === reqCounter) detail.value = data ?? null;
  } catch {
    if (token === reqCounter) {
      detail.value = null;
      message.error('加载通道费率明细失败');
    }
  } finally {
    if (token === reqCounter) loading.value = false;
  }
}

function show(params: ShowParams) {
  meta.value = {
    ...params,
    statisticsDate: params.statisticsDate || dayjs().format('YYYY-MM-DD'),
  };
  visible.value = true;
  void load();
}

function onClose() {
  reqCounter += 1;
  visible.value = false;
  loading.value = false;
  detail.value = null;
}

defineExpose({ show });
</script>

<template>
  <Drawer
    v-model:open="visible"
    :width="1000"
    placement="right"
    destroy-on-close
    :footer="null"
    @close="onClose"
  >
    <template #title>
      <div class="detail-header">
        <strong>通道费率明细</strong>
        <span class="detail-header__meta">
          {{ meta.statisticsDate || '--' }} · [{{ meta.payPassageId ?? '--' }}]
          {{ meta.payPassageName || '--' }}
        </span>
      </div>
    </template>

    <Spin :spinning="loading">
      <div v-if="detail" class="rate-detail-body">
        <div class="summary-grid">
          <div v-for="item in summaryItems" :key="item.label" class="summary-item">
            <span class="summary-item__label">{{ item.label }}</span>
            <strong :class="item.className">{{ item.value }}</strong>
          </div>
        </div>
        <Table
          v-if="rates.length"
          class="rate-detail-table"
          row-key="passageRate"
          size="small"
          bordered
          :pagination="false"
          :columns="columns"
          :data-source="rates"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'passageRate'">
              <Tag color="processing">{{ formatFeeRate(record.passageRate) }}</Tag>
            </template>
            <template v-else-if="column.dataIndex === 'totalAmount'">
              {{ formatYuan(record.totalAmount) }}
            </template>
            <template v-else-if="column.dataIndex === 'totalSuccessAmount'">
              {{ formatYuan(record.totalSuccessAmount) }}
            </template>
            <template v-else-if="column.dataIndex === 'successRate'">
              {{
                formatSuccessRate(
                  record.orderSuccessCount,
                  record.totalOrderCount,
                )
              }}
            </template>
          </template>
        </Table>
        <Empty v-else description="当日暂无不同通道费率统计明细" />
      </div>
      <Empty v-else-if="!loading" description="暂无通道费率统计" />
    </Spin>
  </Drawer>
</template>

<style scoped>
.detail-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.detail-header__meta {
  color: hsl(var(--muted-foreground));
  font-size: 12px;
  font-weight: 400;
}

.rate-detail-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 200px;
  overflow: hidden;
}

.rate-detail-table {
  width: 100%;
}

.rate-detail-table :deep(.ant-table) {
  overflow: hidden;
}

.rate-detail-table :deep(.ant-table-thead > tr > th),
.rate-detail-table :deep(.ant-table-tbody > tr > td) {
  white-space: nowrap;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 16px;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  background: hsl(var(--muted) / 40%);
}

.summary-item__label {
  color: hsl(var(--muted-foreground));
  font-size: 12px;
}

.summary-item strong {
  font-size: 18px;
}

.text-brand {
  color: hsl(var(--primary));
}

@media (max-width: 900px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>

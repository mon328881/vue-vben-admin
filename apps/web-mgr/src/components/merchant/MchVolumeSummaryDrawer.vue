<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import type {
  MchVolumeProduct,
  MchVolumeRateRow,
  MchVolumeSummary,
} from '#/api';

import { computed, ref } from 'vue';

import { Drawer, Empty, message, Spin, Table, Tabs, Tag } from 'ant-design-vue';

import { fetchMchVolumeSummaryApi } from '#/api';
import {
  amountSignedClass,
  formatFeeRate,
  formatRateDecimal,
  formatSuccessRate,
  formatYuan,
} from '#/utils/format';

defineOptions({ name: 'MchVolumeSummaryDrawer' });

type TabKey = 'today' | 'yesterday';

const visible = ref(false);
const loading = ref(false);
const tab = ref<TabKey>('today');
const mch = ref<{ mchName?: string; mchNo: string; }>({ mchNo: '' });
const summary = ref<MchVolumeSummary | null>(null);
const requestedDate = ref('');
let loadSeq = 0;

function statisticsDateOf(which: TabKey) {
  const date = new Date();
  if (which === 'yesterday') date.setDate(date.getDate() - 1);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function rateText(
  row?: null | {
    orderSuccessCount?: number;
    successRate?: number;
    totalOrderCount?: number;
  },
) {
  if (
    row?.successRate !== null &&
    row?.successRate !== undefined &&
    Number.isFinite(Number(row.successRate))
  ) {
    // BE：successRate = 成功数/总数，0~1 小数
    return formatRateDecimal(row.successRate);
  }
  return formatSuccessRate(row?.orderSuccessCount, row?.totalOrderCount);
}

function sortedRates(rates?: MchVolumeRateRow[]) {
  return [...(rates ?? [])].toSorted(
    (a, b) => Number(a.mchFeeRate) - Number(b.mchFeeRate),
  );
}

const products = computed(() =>
  [...(summary.value?.products ?? [])].toSorted(
    (a, b) => Number(a.productId) - Number(b.productId),
  ),
);

const cards = computed(() => {
  const data = summary.value;
  return [
    {
      label: tab.value === 'today' ? '今日跑量' : '昨日跑量',
      value: formatYuan(data?.totalSuccessAmount),
      className: 'text-brand',
    },
    { label: '总订单金额', value: formatYuan(data?.totalAmount) },
    { label: '订单数', value: String(data?.totalOrderCount ?? 0) },
    { label: '成功单数', value: String(data?.orderSuccessCount ?? 0) },
    {
      label: '成功率',
      value: rateText(data),
      className: 'text-brand',
    },
    { label: '总服务费', value: formatYuan(data?.totalCost) },
    {
      label: '平台收入',
      value: formatYuan(data?.platTotalIncome),
      className: amountSignedClass(data?.platTotalIncome),
    },
  ];
});

const rateColumns: TableColumnsType<MchVolumeRateRow> = [
  { dataIndex: 'mchFeeRate', title: '产品费率', width: 120 },
  { align: 'right', dataIndex: 'totalAmount', title: '订单金额', width: 120 },
  {
    align: 'right',
    dataIndex: 'totalSuccessAmount',
    title: '成功金额',
    width: 120,
  },
  {
    align: 'right',
    dataIndex: 'totalOrderCount',
    title: '订单数',
    width: 90,
  },
  {
    align: 'right',
    dataIndex: 'orderSuccessCount',
    title: '成功数',
    width: 90,
  },
  { align: 'right', dataIndex: 'successRate', title: '成功率', width: 100 },
  {
    align: 'right',
    dataIndex: 'platTotalIncome',
    title: '平台收入',
    width: 120,
  },
];

async function load() {
  if (!mch.value.mchNo) return;
  const seq = ++loadSeq;
  const date = statisticsDateOf(tab.value);
  requestedDate.value = date;
  loading.value = true;
  summary.value = null;
  try {
    const data = await fetchMchVolumeSummaryApi({
      mchNo: mch.value.mchNo,
      statisticsDate: date,
    });
    if (seq === loadSeq) summary.value = data ?? null;
  } catch {
    if (seq === loadSeq) {
      summary.value = null;
      message.error('加载商户跑量摘要失败');
    }
  } finally {
    if (seq === loadSeq) loading.value = false;
  }
}

function onTabChange(key: number | string) {
  tab.value = key === 'yesterday' ? 'yesterday' : 'today';
  void load();
}

function show(row: { mchName?: string; mchNo: string }) {
  mch.value = { mchNo: row.mchNo, mchName: row.mchName };
  tab.value = 'today';
  visible.value = true;
  void load();
}

function onClose() {
  loadSeq += 1;
  visible.value = false;
  loading.value = false;
  summary.value = null;
}

function productKey(row: MchVolumeProduct) {
  return String(row.productId ?? '');
}

defineExpose({ show });
</script>

<template>
  <Drawer
    v-model:open="visible"
    :width="1250"
    placement="right"
    destroy-on-close
    :footer="null"
    @close="onClose"
  >
    <template #title>
      <div class="volume-header">
        <strong>商户跑量摘要</strong>
        <span class="volume-header__merchant">
          [{{ mch.mchNo || '--' }}] {{ mch.mchName || '--' }}
        </span>
      </div>
    </template>

    <Tabs :active-key="tab" @change="onTabChange">
      <Tabs.TabPane key="today" tab="今日摘要" />
      <Tabs.TabPane key="yesterday" tab="昨日摘要" />
    </Tabs>

    <Spin :spinning="loading">
      <div v-if="summary" class="volume-body">
        <div class="statistics-date">
          统计日期：{{ summary.statisticsDate || requestedDate }}
        </div>
        <div class="summary-grid">
          <div v-for="item in cards" :key="item.label" class="summary-item">
            <span class="summary-item__label">{{ item.label }}</span>
            <strong :class="item.className">{{ item.value }}</strong>
          </div>
        </div>
        <div class="product-title">当日跑量产品（按产品编号排列）</div>
        <div v-if="products.length" class="product-list">
          <section
            v-for="product in products"
            :key="productKey(product)"
            class="product-section"
          >
            <div class="product-header">
              <div class="product-name">
                <span class="product-id">[{{ product.productId ?? '--' }}]</span>
                <strong>{{ product.productName || '--' }}</strong>
              </div>
              <div class="product-summary">
                <span>
                  订单金额 <b>{{ formatYuan(product.totalAmount) }}</b>
                </span>
                <span>
                  成功金额 <b>{{ formatYuan(product.totalSuccessAmount) }}</b>
                </span>
                <span>
                  订单 <b>{{ product.totalOrderCount ?? 0 }}</b>
                </span>
                <span>
                  成功 <b>{{ product.orderSuccessCount ?? 0 }}</b>
                </span>
                <span>
                  成功率 <b class="text-brand">{{ rateText(product) }}</b>
                </span>
                <span>
                  手续费 <b>{{ formatYuan(product.totalCost) }}</b>
                </span>
                <span>
                  平台收入
                  <b :class="amountSignedClass(product.platTotalIncome)">
                    {{ formatYuan(product.platTotalIncome) }}
                  </b>
                </span>
              </div>
            </div>
            <Table
              size="small"
              bordered
              :pagination="false"
              :row-key="(r) => String(r.mchFeeRate ?? '')"
              :columns="rateColumns"
              :data-source="sortedRates(product.rates)"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'mchFeeRate'">
                  <Tag color="processing">
                    {{ formatFeeRate(record.mchFeeRate) }}
                  </Tag>
                </template>
                <template v-else-if="column.dataIndex === 'totalAmount'">
                  {{ formatYuan(record.totalAmount) }}
                </template>
                <template v-else-if="column.dataIndex === 'totalSuccessAmount'">
                  {{ formatYuan(record.totalSuccessAmount) }}
                </template>
                <template v-else-if="column.dataIndex === 'successRate'">
                  {{ rateText(record) }}
                </template>
                <template v-else-if="column.dataIndex === 'platTotalIncome'">
                  <b :class="amountSignedClass(record.platTotalIncome)">
                    {{ formatYuan(record.platTotalIncome) }}
                  </b>
                </template>
              </template>
            </Table>
          </section>
        </div>
        <Empty v-else description="该商户当日暂无跑量统计" />
      </div>
      <Empty v-else-if="!loading" description="暂无商户跑量摘要" />
    </Spin>
  </Drawer>
</template>

<style scoped>
.volume-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.volume-header__merchant,
.statistics-date {
  font-size: 12px;
  font-weight: 400;
  color: hsl(var(--muted-foreground));
}

.volume-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 240px;
  padding-top: 8px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 16px;
  background: hsl(var(--muted) / 40%);
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
}

.summary-item__label {
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.summary-item strong {
  font-size: 18px;
}

.product-title {
  padding-bottom: 8px;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid hsl(var(--border));
}

.product-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.product-section {
  overflow: hidden;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
}

.product-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px;
  background: hsl(var(--muted) / 40%);
}

.product-name {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 15px;
}

.product-id,
.text-brand {
  color: hsl(var(--primary));
}

.product-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 22px;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.product-summary b {
  margin-left: 4px;
  color: hsl(var(--foreground));
}

@media (max-width: 900px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>

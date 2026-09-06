<script lang="ts" setup>
/**
 * 参考 Words 主页「分析 / 统计 / 周期汇总」：
 * 进单状态（与顶栏实时同步）+ 今昨对比图 + 订单结构 + 周期汇总表
 */
import type { EchartsUIType } from '@vben/plugins/echarts';

import {
  computed,
  nextTick,
  onActivated,
  onDeactivated,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import { Button, Skeleton } from 'ant-design-vue';

import { fetchOpenStateApi, fetchTwoDayCountApi } from '#/api';
import type { DayCount } from '#/api/types/business';
import { useIntakeOpenState } from '#/composables/use-intake-open-state';
import { formatYuan, rateValue } from '#/utils/format';

defineOptions({ name: 'DashboardTodayInsight' });

const POLL_MS = 30 * 1000;

const loading = ref(true);
const refreshed = ref('');
const today = ref<DayCount>({});
const yesterday = ref<DayCount>({});
const mchNum = ref(0);
const agentNum = ref(0);

const { openState, label: openLabel, setIntakeOpen } = useIntakeOpenState();

const compareRef = ref<EchartsUIType>();
const pieRef = ref<EchartsUIType>();
const { renderEcharts: renderCompare } = useEcharts(compareRef);
const { renderEcharts: renderPie } = useEcharts(pieRef);

function fen(n?: number | null) {
  return Number(n ?? 0);
}

function periodCells(s?: DayCount) {
  const amount = fen(s?.totalAmount);
  const success = fen(s?.totalSuccessAmount);
  const fail = Math.max(amount - success, 0);
  const rate = rateValue(fen(s?.orderSuccessCount), fen(s?.totalOrderCount));
  return [
    { title: '总金额', value: formatYuan(amount), tone: 'hsl(var(--foreground))' },
    { title: '成功金额', value: formatYuan(success), tone: '#4bd884' },
    { title: '未成功金额', value: formatYuan(fail), tone: 'hsl(var(--destructive))' },
    { title: '成功率', value: `${rate.toFixed(2)}%`, tone: '#fa9d2a' },
  ];
}

const periodBlocks = computed(() => [
  { title: '今日', stat: today.value },
  { title: '昨日', stat: yesterday.value },
]);

async function loadCounts() {
  const count = await fetchTwoDayCountApi();
  today.value = count?.todayCount ?? {};
  yesterday.value = count?.yesterdayCount ?? {};
  mchNum.value = Number(count?.mchNum ?? 0);
  agentNum.value = Number(count?.agentNum ?? 0);
  refreshed.value = new Date().toLocaleString();
}

async function loadOpenState() {
  try {
    const state = await fetchOpenStateApi();
    setIntakeOpen(Number(state) === 1);
  } catch {
    // 顶栏可能已写入共享状态；失败时不覆盖
  }
}

async function load() {
  loading.value = true;
  try {
    await Promise.all([loadCounts(), loadOpenState()]);
    await nextTick();
    drawCharts();
  } catch (error) {
    console.error('加载今日分析失败:', error);
  } finally {
    loading.value = false;
  }
}

function drawCharts() {
  const t = today.value;
  const y = yesterday.value;
  const tSuccessAmount = fen(t.totalSuccessAmount) / 100;
  const ySuccessAmount = fen(y.totalSuccessAmount) / 100;
  const tOrders = fen(t.totalOrderCount);
  const yOrders = fen(y.totalOrderCount);
  const tSuccess = fen(t.orderSuccessCount);
  const tPending = Math.max(tOrders - tSuccess, 0);

  void renderCompare({
    tooltip: { trigger: 'axis' },
    legend: { top: 0, data: ['成功金额', '进单量'] },
    grid: { left: 8, right: 12, top: 44, bottom: 8, containLabel: true },
    xAxis: { type: 'category', data: ['昨日', '今日'] },
    yAxis: [
      { type: 'value', splitNumber: 4 },
      { type: 'value', splitNumber: 4 },
    ],
    series: [
      {
        name: '成功金额',
        type: 'bar',
        barMaxWidth: 36,
        itemStyle: { color: '#006be6', borderRadius: [6, 6, 0, 0] },
        data: [ySuccessAmount.toFixed(2), tSuccessAmount.toFixed(2)],
      },
      {
        name: '进单量',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        itemStyle: { color: '#fa9d2a' },
        data: [yOrders, tOrders],
      },
    ],
  });

  void renderPie({
    tooltip: { trigger: 'item' },
    legend: { bottom: 4, itemGap: 16 },
    series: [
      {
        type: 'pie',
        radius: ['42%', '64%'],
        center: ['50%', '46%'],
        avoidLabelOverlap: true,
        label: { formatter: '{b} {d}%' },
        data: [
          {
            name: '成功',
            value: tSuccess,
            itemStyle: { color: '#4bd884' },
          },
          {
            name: '未成功',
            value: tPending,
            itemStyle: { color: '#ff3860' },
          },
        ],
      },
    ],
  });
}

let timer: null | ReturnType<typeof setInterval> = null;
let active = true;

function clearPoll() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function startPoll() {
  clearPoll();
  if (active && !document.hidden) {
    timer = setInterval(() => void load(), POLL_MS);
  }
}

function onVisibility() {
  if (document.hidden) {
    clearPoll();
    return;
  }
  if (active) {
    void load();
    startPoll();
  }
}

watch([today, yesterday], () => {
  void nextTick(drawCharts);
});

onMounted(() => {
  document.addEventListener('visibilitychange', onVisibility);
  void load();
  startPoll();
});

onActivated(() => {
  active = true;
  if (!document.hidden) {
    void load();
    startPoll();
  }
});

onDeactivated(() => {
  active = false;
  clearPoll();
});

onUnmounted(() => {
  active = false;
  clearPoll();
  document.removeEventListener('visibilitychange', onVisibility);
});
</script>

<template>
  <section class="insight">
    <div class="insight__toolbar">
      <div>
        <h3 class="insight__section-title">分析</h3>
        <p class="insight__meta">
          最近刷新 {{ refreshed || '—' }} · 进单状态与顶栏实时同步
        </p>
      </div>
      <div class="insight__toolbar-actions">
        <div
          class="intake-pill"
          :class="{
            'intake-pill--on': openState === true,
            'intake-pill--off': openState === false,
          }"
        >
          <span class="intake-pill__dot" />
          <span>{{ openLabel }}</span>
        </div>
        <Button size="small" :loading="loading" @click="load">刷新</Button>
      </div>
    </div>

    <Skeleton v-if="loading && !refreshed" active :paragraph="{ rows: 6 }" />

    <template v-else>
      <div class="insight__charts">
        <div class="insight__card">
          <div class="insight__card-title">今日 vs 昨日</div>
          <EchartsUI ref="compareRef" class="insight__chart" height="260px" />
        </div>
        <div class="insight__card">
          <div class="insight__card-title">今日订单结构</div>
          <EchartsUI ref="pieRef" class="insight__chart" height="260px" />
        </div>
      </div>

      <div class="insight__stats">
        <div class="insight__card insight__period-card">
          <div class="insight__card-title">周期汇总</div>
          <div class="insight__period-table" role="table">
            <div class="insight__period-head" role="row">
              <div role="columnheader"></div>
              <div
                v-for="cell in periodCells()"
                :key="cell.title"
                role="columnheader"
              >
                {{ cell.title }}
              </div>
            </div>
            <div
              v-for="block in periodBlocks"
              :key="block.title"
              class="insight__period-row"
              role="row"
            >
              <div class="insight__row-label" role="rowheader">
                {{ block.title }}
              </div>
              <div
                v-for="cell in periodCells(block.stat)"
                :key="cell.title"
                class="insight__metric"
                role="cell"
                :style="{ color: cell.tone }"
              >
                {{ cell.value }}
              </div>
            </div>
          </div>
        </div>

        <div class="insight__card">
          <div class="insight__card-title">主体规模</div>
          <div class="insight__scale">
            <div>
              <div class="insight__kpi-title">商户数量</div>
              <div class="insight__metric is-brand">{{ mchNum }}</div>
            </div>
            <div>
              <div class="insight__kpi-title">代理数量</div>
              <div class="insight__metric is-brand">{{ agentNum }}</div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.insight {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.insight__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
}

.insight__section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
  color: hsl(var(--foreground));
}

.insight__section-title::before {
  content: '';
  width: 3px;
  height: 14px;
  border-radius: 2px;
  background: hsl(var(--primary));
}

.insight__meta {
  margin: 0;
  font-size: 13px;
  color: hsl(var(--muted-foreground));
}

.insight__toolbar-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.intake-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid hsl(var(--border));
  background: hsl(var(--card));
  font-size: 12px;
  font-weight: 600;
  color: hsl(var(--foreground));
}

.intake-pill__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: hsl(var(--muted-foreground));
}

.intake-pill--on {
  border-color: hsl(142 71% 40% / 35%);
  background: hsl(142 71% 40% / 8%);
  color: hsl(142 71% 32%);
}

.intake-pill--on .intake-pill__dot {
  background: hsl(142 71% 40%);
}

.intake-pill--off {
  border-color: hsl(var(--destructive) / 35%);
  background: hsl(var(--destructive) / 8%);
  color: hsl(var(--destructive));
}

.intake-pill--off .intake-pill__dot {
  background: hsl(var(--destructive));
}

.insight__charts,
.insight__stats {
  display: grid;
  gap: 12px;
}

.insight__charts {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.insight__stats {
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
}

.insight__card {
  min-width: 0;
  padding: 16px 18px;
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
  background: hsl(var(--card));
}

.insight__card-title {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: hsl(var(--foreground));
}

.insight__chart {
  width: 100%;
}

.insight__period-table {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.insight__period-head,
.insight__period-row {
  display: grid;
  grid-template-columns: 56px repeat(4, minmax(0, 1fr));
  gap: 8px;
  align-items: center;
}

.insight__period-head {
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.insight__row-label {
  font-size: 13px;
  font-weight: 600;
  color: hsl(var(--foreground));
}

.insight__metric {
  font-size: 15px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1.3;
}

.insight__metric.is-brand {
  color: hsl(var(--primary));
}

.insight__kpi-title {
  margin-bottom: 6px;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.insight__scale {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  min-height: 88px;
  align-content: center;
}

@media (max-width: 1100px) {
  .insight__charts,
  .insight__stats {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .insight__period-head,
  .insight__period-row {
    grid-template-columns: 48px repeat(2, minmax(0, 1fr));
  }

  .insight__period-head > :nth-child(n + 4),
  .insight__period-row > :nth-child(n + 4) {
    display: none;
  }
}
</style>

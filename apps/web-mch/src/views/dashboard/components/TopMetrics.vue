<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';

import { CountTo } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { fetchTwoDayCountApi } from '#/api';
import { formatYuan, rateValue } from '#/utils/format';

import TrendTag from './TrendTag.vue';

defineOptions({ name: 'MchTopMetrics' });

const POLL_MS = 30_000;

const todayAmount = ref(0);
const yesterdayAmount = ref(0);
const todayOrders = ref(0);
const yesterdayOrders = ref(0);
const todayTotal = ref(0);
const yesterdayTotal = ref(0);
const todayCost = ref(0);
const yesterdayCost = ref(0);
const todayRate = ref(0);
const yesterdayRate = ref(0);

function percentTrend(current: number, previous: number) {
  if (current === previous) return { type: 'up', describe: '0%' };
  if (previous === 0) {
    return { type: 'up', describe: current === 0 ? '0%' : '新增' };
  }
  const pct = Math.round(((current - previous) / previous) * 1000) / 10;
  return {
    type: current > previous ? 'up' : 'down',
    describe: `${pct > 0 ? '+' : ''}${pct}%`,
  };
}

const amountTrend = computed(() =>
  percentTrend(todayAmount.value, yesterdayAmount.value),
);
const orderTrend = computed(() =>
  percentTrend(todayOrders.value, yesterdayOrders.value),
);

async function load() {
  try {
    const data = await fetchTwoDayCountApi();
    const today = data?.todayCount ?? {};
    const yesterday = data?.yesterdayCount ?? {};
    todayAmount.value = Number(today.totalSuccessAmount ?? 0);
    todayOrders.value = Number(today.orderSuccessCount ?? 0);
    todayTotal.value = Number(today.totalOrderCount ?? 0);
    todayCost.value = Number(today.totalMchCost ?? 0);
    yesterdayAmount.value = Number(yesterday.totalSuccessAmount ?? 0);
    yesterdayOrders.value = Number(yesterday.orderSuccessCount ?? 0);
    yesterdayTotal.value = Number(yesterday.totalOrderCount ?? 0);
    yesterdayCost.value = Number(yesterday.totalMchCost ?? 0);
    todayRate.value = Number(data?.todaySuccessRate ?? 0);
    yesterdayRate.value = Number(data?.yesterdaySuccessRate ?? 0);
  } catch (error) {
    console.error('加载统计数据失败', error);
  }
}

let timer: ReturnType<typeof setInterval> | null = null;

function startPoll() {
  stopPoll();
  timer = setInterval(() => {
    if (!document.hidden) void load();
  }, POLL_MS);
}

function stopPoll() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function onVisibility() {
  if (document.hidden) stopPoll();
  else {
    void load();
    startPoll();
  }
}

onMounted(() => {
  void load();
  startPoll();
  document.addEventListener('visibilitychange', onVisibility);
});

onUnmounted(() => {
  stopPoll();
  document.removeEventListener('visibilitychange', onVisibility);
});
</script>

<template>
  <div class="metrics-grid">
    <div class="metric-card metric-card--featured">
      <span class="metric-card__icon" aria-hidden="true">
        <IconifyIcon icon="lucide:trending-up" class="size-5" />
      </span>
      <div class="metric-card__main">
        <span class="metric-card__label">今日成交金额</span>
        <span class="metric-card__value">
          <CountTo
            :end-val="todayAmount / 100"
            :decimals="2"
            :duration="1200"
            prefix="¥"
          />
        </span>
        <span class="metric-card__sub">
          昨日 {{ formatYuan(yesterdayAmount) }}
          <TrendTag
            :describe="amountTrend.describe"
            :type="amountTrend.type"
            is-reverse-color
          />
        </span>
      </div>
    </div>

    <div class="metric-card">
      <span class="metric-card__icon metric-card__icon--muted" aria-hidden="true">
        <IconifyIcon icon="lucide:shopping-cart" class="size-5" />
      </span>
      <div class="metric-card__main">
        <span class="metric-card__label">今日成交订单</span>
        <span class="metric-card__value is-brand">
          <CountTo :end-val="todayOrders" :duration="1200" />
        </span>
        <span class="metric-card__sub">
          昨日 {{ yesterdayOrders }}
          <TrendTag
            :describe="orderTrend.describe"
            :type="orderTrend.type"
            positive-metric
          />
        </span>
      </div>
    </div>

    <div class="metric-card">
      <span class="metric-card__icon metric-card__icon--muted" aria-hidden="true">
        <IconifyIcon icon="lucide:percent" class="size-5" />
      </span>
      <div class="metric-card__main">
        <span class="metric-card__label">今日成功率</span>
        <span class="metric-card__value is-positive">
          <CountTo
            :end-val="rateValue(todayOrders, todayTotal)"
            :decimals="2"
            :duration="1200"
            suffix="%"
          />
        </span>
        <span class="metric-card__sub">
          昨日 {{ rateValue(yesterdayOrders, yesterdayTotal).toFixed(2) }}%
        </span>
      </div>
    </div>

    <div class="metric-card">
      <span class="metric-card__icon metric-card__icon--muted" aria-hidden="true">
        <IconifyIcon icon="lucide:file-stack" class="size-5" />
      </span>
      <div class="metric-card__main">
        <span class="metric-card__label">今日订单量</span>
        <span class="metric-card__value">
          <CountTo :end-val="todayTotal" :duration="1200" />
        </span>
        <span class="metric-card__sub">昨日 {{ yesterdayTotal }}</span>
      </div>
    </div>

    <div class="metric-card">
      <span class="metric-card__icon metric-card__icon--muted" aria-hidden="true">
        <IconifyIcon icon="lucide:wallet" class="size-5" />
      </span>
      <div class="metric-card__main">
        <span class="metric-card__label">今日服务费</span>
        <span class="metric-card__value is-warning">
          <CountTo
            :end-val="todayCost / 100"
            :decimals="2"
            :duration="1200"
            prefix="¥"
          />
        </span>
        <span class="metric-card__sub">昨日 {{ formatYuan(yesterdayCost) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.metrics-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.metric-card {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
  min-height: 120px;
  padding: 16px;
  position: relative;
  overflow: hidden;
}

.metric-card--featured {
  background: linear-gradient(
    145deg,
    hsl(var(--primary) / 90%) 0%,
    hsl(var(--primary)) 100%
  );
  border-color: hsl(var(--primary) / 40%);
  color: #fff;
  grid-column: span 2;
}

.metric-card__icon {
  position: absolute;
  right: 14px;
  top: 14px;
  opacity: 0.85;
}

.metric-card__icon--muted {
  color: hsl(var(--muted-foreground));
  opacity: 0.55;
}

.metric-card__label {
  color: hsl(var(--muted-foreground));
  display: block;
  font-size: 13px;
  margin-bottom: 8px;
}

.metric-card--featured .metric-card__label {
  color: rgb(255 255 255 / 85%);
}

.metric-card__value {
  display: block;
  font-size: 26px;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  line-height: 1.2;
}

.metric-card__value.is-brand {
  color: hsl(var(--primary));
}

.metric-card__value.is-positive {
  color: #4bd884;
}

.metric-card__value.is-warning {
  color: #fa9d2a;
}

.metric-card__value.is-negative {
  color: #db4b4b;
}

.metric-card__value :deep(.count-to) {
  display: inline-flex;
  font-size: inherit;
  font-weight: inherit;
  color: inherit;
}

.metric-card__sub {
  align-items: center;
  color: hsl(var(--muted-foreground));
  display: flex;
  flex-wrap: wrap;
  font-size: 12px;
  gap: 6px;
  margin-top: 8px;
}

.metric-card--featured .metric-card__sub {
  color: rgb(255 255 255 / 75%);
}

@media (max-width: 768px) {
  .metric-card--featured {
    grid-column: span 1;
  }
}
</style>

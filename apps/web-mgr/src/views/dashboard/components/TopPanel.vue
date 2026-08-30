<script lang="ts" setup>
/**
 * 对齐旧端 TopPanel：六张 KPI 卡
 * 第一张 featured（品牌渐变），其余 surface + 顶部彩条
 */
import {
  computed,
  onActivated,
  onDeactivated,
  onMounted,
  onUnmounted,
  ref,
} from 'vue';

import { fetchTwoDayCountApi } from '#/api';
import { formatYuan, rateValue } from '#/utils/format';

import TrendTag from './TrendTag.vue';

defineOptions({ name: 'DashboardTopPanel' });

const POLL_MS = 30 * 1000;

const todayAmount = ref(0);
const yesterdayAmount = ref(0);
const todayOrders = ref(0);
const yesterdayOrders = ref(0);
const todayTotal = ref(0);
const yesterdayTotal = ref(0);
const todayIncome = ref(0);
const yesterdayIncome = ref(0);
const mchNum = ref(0);
const agentNum = ref(0);

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
const totalTrend = computed(() =>
  percentTrend(todayTotal.value, yesterdayTotal.value),
);
const incomeTrend = computed(() =>
  percentTrend(todayIncome.value, yesterdayIncome.value),
);
const rateTrend = computed(() => {
  const diff =
    rateValue(todayOrders.value, todayTotal.value) -
    rateValue(yesterdayOrders.value, yesterdayTotal.value);
  if (Math.abs(diff) < 0.05) return { type: 'up', describe: '0%' };
  return {
    type: diff > 0 ? 'up' : 'down',
    describe: `${diff > 0 ? '+' : ''}${Math.round(diff * 10) / 10}%`,
  };
});

async function load() {
  try {
    const data = await fetchTwoDayCountApi();
    const today = data?.todayCount ?? {};
    const yesterday = data?.yesterdayCount ?? {};
    todayAmount.value = Number(today.totalSuccessAmount ?? 0);
    todayIncome.value = Number(today.platTotalIncome ?? 0);
    todayTotal.value = Number(today.totalOrderCount ?? 0);
    todayOrders.value = Number(today.orderSuccessCount ?? 0);
    yesterdayAmount.value = Number(yesterday.totalSuccessAmount ?? 0);
    yesterdayIncome.value = Number(yesterday.platTotalIncome ?? 0);
    yesterdayTotal.value = Number(yesterday.totalOrderCount ?? 0);
    yesterdayOrders.value = Number(yesterday.orderSuccessCount ?? 0);
    mchNum.value = Number(data?.mchNum ?? 0);
    agentNum.value = Number(data?.agentNum ?? 0);
  } catch (error) {
    console.error('获取统计数据失败:', error);
  }
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
    timer = setInterval(load, POLL_MS);
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
  <div class="dashboard-panel">
    <div class="left-card-content">
      <div class="left-card-item left-card-item--featured">
        <span class="item-bg-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
            <path
              d="M3 17l6-6 4 4 7-8"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
        <div class="item-main">
          <span class="item-title">今日成交金额</span>
          <span class="item-number">{{ formatYuan(todayAmount) }}</span>
          <span class="item-yesterday item-yesterday--stack">
            <span class="item-yesterday__label">
              昨日: {{ formatYuan(yesterdayAmount) }}
            </span>
            <TrendTag
              class="item-yesterday__trend"
              :type="amountTrend.type"
              :describe="amountTrend.describe"
              is-reverse-color
            />
          </span>
        </div>
      </div>

      <div class="left-card-item left-card-item--surface">
        <span
          class="item-bg-icon item-bg-icon--accent-balance"
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
            <path
              d="M4 19V5M4 19h16M8 15v-4M12 15V8M16 15v-6"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
            />
          </svg>
        </span>
        <div class="item-main">
          <span class="item-title">今日成交订单</span>
          <span class="item-number">{{ todayOrders }}</span>
          <span class="item-yesterday item-yesterday--stack">
            <span class="item-yesterday__label">昨日: {{ yesterdayOrders }}</span>
            <TrendTag
              class="item-yesterday__trend"
              :type="orderTrend.type"
              :describe="orderTrend.describe"
              positive-metric
            />
          </span>
        </div>
      </div>

      <div class="left-card-item left-card-item--surface">
        <span
          class="item-bg-icon item-bg-icon--accent-stat-warning"
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
            <path
              d="M6 4h9l3 3v13H6V4Z"
              stroke="currentColor"
              stroke-width="1.8"
            />
            <path
              d="M9 12h6M9 16h4"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
            />
          </svg>
        </span>
        <div class="item-main">
          <span class="item-title">今日订单总数</span>
          <span class="item-number">{{ todayTotal }}</span>
          <span class="item-yesterday item-yesterday--stack">
            <span class="item-yesterday__label">昨日: {{ yesterdayTotal }}</span>
            <TrendTag
              class="item-yesterday__trend"
              :type="totalTrend.type"
              :describe="totalTrend.describe"
              positive-metric
            />
          </span>
        </div>
      </div>

      <div class="left-card-item left-card-item--surface">
        <span
          class="item-bg-icon item-bg-icon--accent-profit"
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
            <circle
              cx="12"
              cy="12"
              r="8"
              stroke="currentColor"
              stroke-width="1.8"
            />
            <path
              d="M12 7v10M9.5 9.5c.6-1 1.5-1.5 2.5-1.5 1.4 0 2.5.8 2.5 2s-1.1 2-2.5 2h-1c-1.4 0-2.5.8-2.5 2s1.1 2 2.5 2c1 0 1.9-.5 2.5-1.5"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
            />
          </svg>
        </span>
        <div class="item-main">
          <span class="item-title">今日平台利润</span>
          <span class="item-number">{{ formatYuan(todayIncome) }}</span>
          <span class="item-yesterday item-yesterday--stack">
            <span class="item-yesterday__label">
              昨日: {{ formatYuan(yesterdayIncome) }}
            </span>
            <TrendTag
              class="item-yesterday__trend"
              :type="incomeTrend.type"
              :describe="incomeTrend.describe"
              positive-metric
            />
          </span>
        </div>
      </div>

      <div class="left-card-item left-card-item--surface">
        <span
          class="item-bg-icon item-bg-icon--accent-geekblue"
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
            <path
              d="M4 16l5-5 3 3 7-7"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M15 7h4v4"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
            />
          </svg>
        </span>
        <div class="item-main">
          <span class="item-title">今日成功率</span>
          <span class="item-number">
            {{ rateValue(todayOrders, todayTotal) }}%
          </span>
          <span class="item-yesterday item-yesterday--stack">
            <span class="item-yesterday__label">
              昨日: {{ rateValue(yesterdayOrders, yesterdayTotal) }}%
            </span>
            <TrendTag
              class="item-yesterday__trend"
              :type="rateTrend.type"
              :describe="rateTrend.describe"
              positive-metric
            />
          </span>
        </div>
      </div>

      <div class="left-card-item left-card-item--surface">
        <span
          class="item-bg-icon item-bg-icon--accent-slate"
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
            <circle
              cx="9"
              cy="8"
              r="3"
              stroke="currentColor"
              stroke-width="1.8"
            />
            <circle
              cx="16.5"
              cy="9.5"
              r="2.5"
              stroke="currentColor"
              stroke-width="1.8"
            />
            <path
              d="M3.5 18c.8-2.4 2.8-3.5 5.5-3.5s4.7 1.1 5.5 3.5M14 14.2c1.7-.2 3.2.4 4 1.8"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
            />
          </svg>
        </span>
        <div class="item-main item-main--stacked-pair">
          <div class="stacked-metric">
            <span class="stacked-metric__label">商户数量</span>
            <span class="stacked-metric__value">{{ mchNum }}</span>
          </div>
          <div class="stacked-metric">
            <span class="stacked-metric__label">代理数量</span>
            <span class="stacked-metric__value">{{ agentNum }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-panel {
  width: 100%;
}

.left-card-content {
  display: flex;
  gap: 16px;
}

.left-card-item {
  flex: 1 1 0;
  min-width: 160px;
  min-height: 176px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 16px 14px;
  border-radius: 10px;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  transition:
    box-shadow 0.22s ease,
    border-color 0.22s ease,
    transform 0.22s ease;
}

.left-card-item--featured {
  background:
    radial-gradient(
      120% 80% at 100% 0%,
      color-mix(in srgb, #fff 22%, transparent) 0%,
      transparent 55%
    ),
    linear-gradient(
      145deg,
      hsl(var(--primary)) 0%,
      hsl(var(--primary) / 88%) 48%,
      hsl(var(--primary) / 72%) 100%
    );
  box-shadow:
    0 1px color-mix(in srgb, #fff 16%, transparent) inset,
    0 8px 28px hsl(var(--primary) / 28%),
    0 2px 8px rgb(0 0 0 / 8%);
  border: 1px solid hsl(var(--primary) / 38%);
}

.left-card-item--featured .item-title {
  color: rgb(255 255 255 / 78%);
  font-weight: 500;
}

.left-card-item--featured .item-number {
  color: #fff;
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

.left-card-item--featured .item-yesterday {
  color: rgb(255 255 255 / 66%);
}

.left-card-item--featured .item-bg-icon {
  top: 12px;
  right: 12px;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(255 255 255 / 16%);
  color: #fff;
}

.left-card-item--featured .item-main {
  max-width: calc(100% - 56px);
}

.left-card-item--surface {
  background-color: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  box-shadow:
    0 1px 2px rgb(0 0 0 / 5%),
    0 6px 20px rgb(0 0 0 / 4%);
}

.left-card-item--surface::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  border-radius: 10px 10px 0 0;
  background: hsl(var(--border));
  opacity: 0.35;
}

.left-card-item--surface:has(.item-bg-icon--accent-balance)::before {
  background: #13c2c2;
  opacity: 1;
}

.left-card-item--surface:has(.item-bg-icon--accent-stat-warning)::before {
  background: #faad14;
  opacity: 1;
}

.left-card-item--surface:has(.item-bg-icon--accent-profit)::before {
  background: #722ed1;
  opacity: 1;
}

.left-card-item--surface:has(.item-bg-icon--accent-geekblue)::before {
  background: #2f54eb;
  opacity: 1;
}

.left-card-item--surface:has(.item-bg-icon--accent-slate)::before {
  background: #5b6f7f;
  opacity: 1;
}

.left-card-item--surface .item-title {
  color: hsl(var(--muted-foreground));
}

.left-card-item--surface .item-number {
  color: hsl(var(--foreground));
  font-variant-numeric: tabular-nums;
}

.left-card-item--surface .item-yesterday {
  color: hsl(var(--muted-foreground));
}

.left-card-item--surface .item-main:not(.item-main--stacked-pair) {
  max-width: calc(100% - 56px);
}

.left-card-item--surface .item-bg-icon {
  top: 14px;
  right: 12px;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: hsl(var(--muted));
}

.item-bg-icon--accent-balance {
  color: #13c2c2;
  background: color-mix(in srgb, #13c2c2 16%, transparent) !important;
}

.item-bg-icon--accent-stat-warning {
  color: #faad14;
  background: color-mix(in srgb, #faad14 18%, transparent) !important;
}

.item-bg-icon--accent-profit {
  color: #722ed1;
  background: color-mix(in srgb, #722ed1 16%, transparent) !important;
}

.item-bg-icon--accent-geekblue {
  color: #2f54eb;
  background: color-mix(in srgb, #2f54eb 14%, transparent) !important;
}

.item-bg-icon--accent-slate {
  color: #5b6f7f;
  background: color-mix(in srgb, #5b6f7f 14%, transparent) !important;
}

.item-bg-icon {
  position: absolute;
  right: 12px;
  pointer-events: none;
}

.item-main {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  min-width: 0;
  flex: 1;
}

.item-title {
  font-size: 14px;
  margin-bottom: 8px;
  font-weight: 600;
}

.item-number {
  font-size: 26px;
  font-weight: 600;
  line-height: 1.2;
  margin-bottom: auto;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

.item-yesterday {
  font-size: 15px;
  line-height: 1.45;
  margin-top: 8px;
}

.item-yesterday--stack {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.item-main--stacked-pair {
  justify-content: center;
  gap: 14px;
  padding-top: 2px;
}

.stacked-metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.stacked-metric__label {
  font-size: 13px;
  font-weight: 600;
  color: hsl(var(--muted-foreground));
  line-height: 1.3;
}

.stacked-metric__value {
  font-size: 22px;
  font-weight: 600;
  color: hsl(var(--foreground));
  line-height: 1.2;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 1000px) {
  .left-card-content {
    flex-wrap: wrap;
  }

  .left-card-item {
    flex: 1 1 calc(50% - 8px);
  }
}

@media (max-width: 600px) {
  .left-card-item {
    flex: 1 1 100%;
  }
}

@media (hover: hover) and (pointer: fine) {
  .left-card-item:hover {
    transform: translateY(-1px);
  }
}
</style>

<script lang="ts" setup>
import { computed } from 'vue';

import { CountTo } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import type { AgentInfo } from '#/api/types/business';
import { formatYuan } from '#/utils/format';

import TrendTag from './TrendTag.vue';

defineOptions({ name: 'AgentTopMetrics' });

const props = withDefaults(
  defineProps<{
    info?: AgentInfo | null;
    todayAmount?: number;
    yesterdayAmount?: number;
  }>(),
  {
    info: null,
    todayAmount: 0,
    yesterdayAmount: 0,
  },
);

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
  percentTrend(props.todayAmount ?? 0, props.yesterdayAmount ?? 0),
);
</script>

<template>
  <div class="metrics-grid">
    <div class="metric-card metric-card--featured">
      <span class="metric-card__icon" aria-hidden="true">
        <IconifyIcon icon="lucide:wallet" class="size-5" />
      </span>
      <div class="metric-card__main">
        <span class="metric-card__label">账户余额</span>
        <span class="metric-card__value">
          <CountTo
            :end-val="(info?.balance ?? 0) / 100"
            :decimals="2"
            :duration="1200"
            prefix="¥"
          />
        </span>
        <span class="metric-card__sub">
          {{ info?.agentName || info?.agentNo || '代理账户' }}
        </span>
      </div>
    </div>

    <div class="metric-card">
      <span class="metric-card__icon metric-card__icon--muted" aria-hidden="true">
        <IconifyIcon icon="lucide:lock" class="size-5" />
      </span>
      <div class="metric-card__main">
        <span class="metric-card__label">冻结金额</span>
        <span class="metric-card__value is-warning">
          <CountTo
            :end-val="(info?.freezeBalance ?? 0) / 100"
            :decimals="2"
            :duration="1200"
            prefix="¥"
          />
        </span>
        <span class="metric-card__sub">
          可用 {{ formatYuan((info?.balance ?? 0) - (info?.freezeBalance ?? 0)) }}
        </span>
      </div>
    </div>

    <div class="metric-card">
      <span class="metric-card__icon metric-card__icon--muted" aria-hidden="true">
        <IconifyIcon icon="lucide:users" class="size-5" />
      </span>
      <div class="metric-card__main">
        <span class="metric-card__label">商户数</span>
        <span class="metric-card__value">
          <CountTo :end-val="info?.mchCount ?? 0" :duration="1200" />
        </span>
        <span class="metric-card__sub">下属商户</span>
      </div>
    </div>

    <div class="metric-card">
      <span class="metric-card__icon metric-card__icon--muted" aria-hidden="true">
        <IconifyIcon icon="lucide:layers" class="size-5" />
      </span>
      <div class="metric-card__main">
        <span class="metric-card__label">通道数</span>
        <span class="metric-card__value">
          <CountTo :end-val="info?.passageCount ?? 0" :duration="1200" />
        </span>
        <span class="metric-card__sub">可用通道</span>
      </div>
    </div>

    <div class="metric-card">
      <span class="metric-card__icon metric-card__icon--muted" aria-hidden="true">
        <IconifyIcon icon="lucide:trending-up" class="size-5" />
      </span>
      <div class="metric-card__main">
        <span class="metric-card__label">今日跑量</span>
        <span class="metric-card__value is-brand">
          <CountTo
            :end-val="(todayAmount ?? 0) / 100"
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
            positive-metric
          />
        </span>
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
  overflow: hidden;
  padding: 16px;
  position: relative;
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
  opacity: 0.85;
  position: absolute;
  right: 14px;
  top: 14px;
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

<script lang="ts" setup>
import { computed } from 'vue';

import { CountTo } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

export type ListStatTone =
  | 'brand'
  | 'positive'
  | 'negative'
  | 'warning'
  | 'default'
  | 'signed';

export interface ListStatCardItem {
  title: string;
  /** 参与 CountTo 动画的数值；与 display 二选一 */
  value?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  /** 非数字/已格式化文案（不做动画） */
  display?: string;
  sub?: string;
  icon?: string;
  /** 数值高亮色；不传则按标题关键词推断 */
  tone?: ListStatTone;
}

const props = defineProps<{
  items: ListStatCardItem[];
  /** @deprecated 已改为等分网格，保留以免调用方报错 */
  md?: number;
}>();

/** 桌面端一行等分列数（最多 6） */
const cols = computed(() => Math.min(Math.max(props.items.length || 1, 1), 6));

function inferTone(title: string): ListStatTone {
  if (/冻结|失败|异常|亏损/.test(title)) return 'negative';
  if (/成交.*金额|订单金额|变更金额|汇总金额/.test(title)) return 'negative';
  if (/成本|手续费|服务费/.test(title)) return 'warning';
  if (/利润|收入|分润/.test(title)) return 'positive';
  if (/订单数|笔数|条数|记录/.test(title)) return 'warning';
  if (/金额|余额|跑量|预付|提现/.test(title)) return 'brand';
  if (/成功/.test(title)) return 'positive';
  return 'default';
}

function resolveTone(item: ListStatCardItem): string {
  const tone = item.tone ?? inferTone(item.title);
  if (tone === 'signed') {
    const n = Number(item.value ?? 0);
    if (n > 0) return 'positive';
    if (n < 0) return 'negative';
    return 'positive';
  }
  return tone;
}
</script>

<template>
  <div
    class="ap-page-stats ap-list-stat-cards"
    :style="{ '--stat-cols': String(cols) }"
  >
    <div
      v-for="(item, index) in items"
      :key="`${item.title}-${index}`"
      class="ap-list-stat-card"
    >
      <span
        v-if="item.icon"
        class="ap-list-stat-card__icon"
        :class="`is-${resolveTone(item)}`"
        aria-hidden="true"
      >
        <IconifyIcon :icon="item.icon" class="size-4" />
      </span>
      <div class="ap-list-stat-card__title">{{ item.title }}</div>
      <div
        class="ap-list-stat-card__value"
        :class="`is-${resolveTone(item)}`"
      >
        <template v-if="item.display != null">
          {{ item.display }}
        </template>
        <CountTo
          v-else
          :end-val="Number(item.value ?? 0)"
          :decimals="item.decimals ?? 0"
          :duration="1000"
          :prefix="item.prefix"
          :suffix="item.suffix"
        />
      </div>
      <!-- 预留副文案行，保证有/无 sub 时卡片等高 -->
      <div class="ap-list-stat-card__sub">
        {{ item.sub || '\u00a0' }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.ap-list-stat-cards {
  display: grid;
  gap: 12px;
  width: 100%;
  grid-template-columns: repeat(var(--stat-cols, 4), minmax(0, 1fr));
}

@media (max-width: 1200px) {
  .ap-list-stat-cards {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  }
}

@media (max-width: 576px) {
  .ap-list-stat-cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.ap-list-stat-card {
  position: relative;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  min-height: 100px;
  height: 100%;
  padding: 14px 16px;
  overflow: hidden;
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
  background: hsl(var(--card));
}

.ap-list-stat-card__icon {
  position: absolute;
  top: 12px;
  right: 12px;
  color: hsl(var(--muted-foreground));
  opacity: 0.55;
}

.ap-list-stat-card__icon.is-brand {
  color: hsl(var(--primary));
  opacity: 0.7;
}

.ap-list-stat-card__icon.is-positive {
  color: hsl(142 71% 40%);
  opacity: 0.75;
}

.ap-list-stat-card__icon.is-negative {
  color: hsl(var(--destructive));
  opacity: 0.75;
}

.ap-list-stat-card__icon.is-warning {
  color: hsl(38 92% 50%);
  opacity: 0.8;
}

.ap-list-stat-card__title {
  margin-bottom: 8px;
  padding-right: 22px;
  font-size: 12px;
  line-height: 1.3;
  color: hsl(var(--muted-foreground));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ap-list-stat-card__value {
  flex: 1 1 auto;
  font-size: 20px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1.25;
  color: hsl(var(--foreground));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ap-list-stat-card__value.is-brand {
  color: hsl(var(--primary));
}

.ap-list-stat-card__value.is-positive {
  color: hsl(142 71% 40%);
}

.ap-list-stat-card__value.is-negative {
  color: hsl(var(--destructive));
}

.ap-list-stat-card__value.is-warning {
  color: hsl(38 92% 50%);
}

.ap-list-stat-card__value :deep(.count-to) {
  display: inline-flex;
  max-width: 100%;
  font-size: inherit;
  font-weight: inherit;
  color: inherit;
}

.ap-list-stat-card__sub {
  margin-top: 6px;
  min-height: 18px;
  font-size: 12px;
  line-height: 18px;
  color: hsl(var(--muted-foreground));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

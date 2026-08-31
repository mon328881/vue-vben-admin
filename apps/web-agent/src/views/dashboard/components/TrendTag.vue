<script lang="ts" setup>
import { computed } from 'vue';

defineOptions({ name: 'TrendTag' });

const props = withDefaults(
  defineProps<{
    type?: string;
    describe?: number | string;
    isReverseColor?: boolean;
    positiveMetric?: boolean;
  }>(),
  {
    type: '',
    describe: undefined,
    isReverseColor: false,
    positiveMetric: false,
  },
);

const rootClass = computed(() => {
  const positive = props.positiveMetric;
  return [
    'trend-container',
    {
      'trend-container__reverse': props.isReverseColor,
      'trend-container__up':
        !props.isReverseColor && !positive && props.type === 'up',
      'trend-container__down':
        !props.isReverseColor && !positive && props.type === 'down',
      'trend-container__up-good':
        !props.isReverseColor && positive && props.type === 'up',
      'trend-container__down-bad':
        !props.isReverseColor && positive && props.type === 'down',
    },
  ];
});
</script>

<template>
  <span :class="rootClass">
    <span class="trend-icon-container">
      <svg
        v-if="type === 'down'"
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M11.5 8L8 11.5L4.5 8"
          stroke="currentColor"
          stroke-width="1.5"
        />
        <path d="M8 11L8 4" stroke="currentColor" stroke-width="1.5" />
      </svg>
      <svg
        v-else
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4.5 8L8 4.5L11.5 8"
          stroke="currentColor"
          stroke-width="1.5"
        />
        <path d="M8 5V12" stroke="currentColor" stroke-width="1.5" />
      </svg>
    </span>
    <span>{{ describe }}</span>
  </span>
</template>

<style scoped>
.trend-container {
  font-size: 12px;
  line-height: 1.35;
}

.trend-icon-container {
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  margin-right: 6px;
}

.trend-container__up {
  color: hsl(var(--destructive));
  display: inline-flex;
  align-items: center;
}

.trend-container__up .trend-icon-container {
  background: hsl(var(--destructive) / 18%);
}

.trend-container__down {
  color: hsl(142 71% 40%);
  display: inline-flex;
  align-items: center;
}

.trend-container__down .trend-icon-container {
  background: hsl(142 71% 40% / 16%);
}

.trend-container__up-good {
  color: hsl(142 71% 40%);
  display: inline-flex;
  align-items: center;
}

.trend-container__up-good .trend-icon-container {
  background: hsl(142 71% 40% / 16%);
}

.trend-container__down-bad {
  color: hsl(var(--destructive));
  display: inline-flex;
  align-items: center;
}

.trend-container__down-bad .trend-icon-container {
  background: hsl(var(--destructive) / 18%);
}

.trend-container__reverse {
  color: #fff;
  display: inline-flex;
  align-items: center;
}

.trend-container__reverse .trend-icon-container {
  background: hsl(var(--primary) / 45%);
}
</style>

<script lang="ts" setup>
/**
 * 列表筛选区查询 / 重置（Vben 按钮）
 * 放在 Form 内时查询按钮 type=submit；额外操作放默认插槽。
 */
import { VbenButton } from '@vben/common-ui';

defineOptions({ name: 'FilterActions' });

withDefaults(
  defineProps<{
    submitText?: string;
    resetText?: string;
    /** false 时查询按钮不作为 submit（自行 @search） */
    nativeSubmit?: boolean;
    loading?: boolean;
  }>(),
  {
    submitText: '查询',
    resetText: '重置',
    nativeSubmit: true,
    loading: false,
  },
);

const emit = defineEmits<{
  search: [];
  reset: [];
}>();
</script>

<template>
  <div class="ap-filter-actions-inner">
    <VbenButton
      v-if="nativeSubmit"
      type="submit"
      :loading="loading"
    >
      {{ submitText }}
    </VbenButton>
    <VbenButton
      v-else
      type="button"
      :loading="loading"
      @click="emit('search')"
    >
      {{ submitText }}
    </VbenButton>
    <VbenButton type="button" variant="outline" @click="emit('reset')">
      {{ resetText }}
    </VbenButton>
    <slot />
  </div>
</template>

<style scoped>
.ap-filter-actions-inner {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}
</style>

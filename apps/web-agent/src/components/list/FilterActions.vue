<script lang="ts" setup>
/**
 * 列表筛选区查询 / 重置。
 *
 * ant-design-vue Form 未绑 :model 时 @finish 不会触发，筛选 Form 需用 @submit="onSearch"。
 * 查询按钮 html-type=submit：点击与输入框回车都会触发表单 submit。
 */
import { Button } from 'ant-design-vue';

defineOptions({ name: 'FilterActions' });

const props = withDefaults(
  defineProps<{
    submitText?: string;
    resetText?: string;
    /** false 时改为 emit('search')，不提交表单 */
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

function onSearchClick(event: MouseEvent) {
  if (!props.nativeSubmit) {
    event.preventDefault();
    emit('search');
  }
}
</script>

<template>
  <div class="ap-filter-actions-inner">
    <Button
      :html-type="nativeSubmit ? 'submit' : 'button'"
      type="primary"
      :loading="loading"
      @click="onSearchClick"
    >
      {{ submitText }}
    </Button>
    <Button html-type="button" @click="emit('reset')">
      {{ resetText }}
    </Button>
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

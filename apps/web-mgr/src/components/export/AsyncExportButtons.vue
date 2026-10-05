<script setup lang="ts">
import { computed, inject, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Badge, Button, Space } from 'ant-design-vue';

import {
  EXPORT_UI_KEY,
  useExportControl,
} from '#/composables/use-async-export';

const props = withDefaults(
  defineProps<{
    danger?: boolean;
    hasReportDownloads?: boolean;
    loading?: boolean;
    progress?: number;
    unreadCount?: number;
  }>(),
  {
    loading: false,
    progress: 0,
    hasReportDownloads: false,
    unreadCount: undefined,
    danger: false,
  },
);

const emit = defineEmits<{
  export: [];
  openReportList: [];
}>();

const control = useExportControl();
const exportUi = inject(EXPORT_UI_KEY, null);
const hoverAbort = ref(false);

const showAbort = computed(
  () =>
    !!control &&
    props.loading &&
    control.cancellationRequested.value !== true &&
    control.cancellable.value === true &&
    (hoverAbort.value || control.cancelling.value === true),
);

const buttonLoading = computed(() =>
  showAbort.value ? control?.cancelling.value === false : props.loading,
);

const buttonText = computed(() => {
  if (control?.cancellationRequested.value) return '中止中';
  if (showAbort.value) return control?.cancelling.value ? '中止中' : '中止导出';
  if (props.loading) return `导出中 ${props.progress}%`;
  return '导出';
});

const unread = computed(() => {
  if (typeof props.unreadCount === 'number') return props.unreadCount;
  return exportUi?.unreadCount.value ?? 0;
});

const showReportList = computed(
  () => props.hasReportDownloads || props.loading,
);

function onClick() {
  if (showAbort.value) {
    control?.confirmCancel();
    return;
  }
  if (!props.loading) emit('export');
}
</script>

<template>
  <Space class="async-export-buttons" :size="8">
    <span
      class="async-export-action"
      @mouseenter="hoverAbort = true"
      @mouseleave="hoverAbort = false"
    >
      <Button
        :danger="showAbort || danger"
        :disabled="loading && !showAbort"
        :loading="buttonLoading"
        @click="onClick"
      >
        <template #icon>
          <IconifyIcon v-if="showAbort" icon="ant-design:stop-outlined" />
          <IconifyIcon v-else icon="ant-design:download-outlined" />
        </template>
        {{ buttonText }}
      </Button>
    </span>
    <Badge v-if="showReportList" :count="unread" :offset="[-4, 2]">
      <Button
        :type="unread > 0 || loading ? 'primary' : 'default'"
        :class="{ 'report-list-attention': unread > 0 || loading }"
        @click="emit('openReportList')"
      >
        报表下载列表
      </Button>
    </Badge>
  </Space>
</template>

<style scoped>
.report-list-attention {
  animation: report-list-pulse 1.4s ease-in-out 4;
}

@keyframes report-list-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 hsl(var(--primary) / 45%);
  }

  50% {
    box-shadow: 0 0 0 6px hsl(var(--primary) / 0%);
  }
}
</style>

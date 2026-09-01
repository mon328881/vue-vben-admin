<script setup lang="ts">
import { computed, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { Button, Space } from 'ant-design-vue';

import { useExportControl } from '#/composables/use-async-export';

const props = withDefaults(
  defineProps<{
    loading?: boolean;
    progress?: number;
    hasReportDownloads?: boolean;
    danger?: boolean;
  }>(),
  {
    loading: false,
    progress: 0,
    hasReportDownloads: false,
    danger: false,
  },
);

const emit = defineEmits<{
  export: [];
  'open-report-list': [];
}>();

const control = useExportControl();
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
        :loading="buttonLoading"
        @click="onClick"
      >
        <template #icon>
          <IconifyIcon
            v-if="showAbort"
            icon="ant-design:stop-outlined"
          />
          <IconifyIcon v-else icon="ant-design:download-outlined" />
        </template>
        {{ buttonText }}
      </Button>
    </span>
    <Button
      v-if="hasReportDownloads || loading"
      @click="emit('open-report-list')"
    >
      报表下载列表
    </Button>
  </Space>
</template>

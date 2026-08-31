<script lang="ts" setup>
import { computed } from 'vue';

import { Button, Input, Tooltip, message } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';

const props = withDefaults(
  defineProps<{
    value?: string | number | null;
    rows?: number;
    minRows?: number;
    maxRows?: number;
    emptyText?: string;
  }>(),
  {
    emptyText: '—',
    minRows: 4,
    maxRows: 12,
    rows: 6,
  },
);

const display = computed(() => {
  if (props.value === undefined || props.value === null || props.value === '') {
    return props.emptyText;
  }
  return String(props.value);
});

async function copyText() {
  if (!display.value || display.value === props.emptyText) return;
  try {
    await navigator.clipboard.writeText(display.value);
    message.success('复制成功');
  } catch {
    message.error('复制失败，请手动复制');
  }
}
</script>

<template>
  <div class="log-display-field">
    <Tooltip title="复制内容">
      <Button
        class="log-display-field__copy"
        size="small"
        type="text"
        @click="copyText"
      >
        <IconifyIcon icon="ant-design:copy-outlined" />
      </Button>
    </Tooltip>
    <Input.TextArea
      :value="display"
      readonly
      class="log-display-field__control"
      :auto-size="{ minRows, maxRows }"
    />
  </div>
</template>

<style scoped>
.log-display-field {
  position: relative;
  width: 100%;
}

.log-display-field__copy {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 1;
}

.log-display-field__control {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
}

.log-display-field__control :deep(textarea) {
  background: hsl(var(--muted));
  cursor: default;
  padding-right: 32px;
}
</style>

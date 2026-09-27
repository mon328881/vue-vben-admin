<script lang="ts" setup>
import type { PayPassage } from '#/api';

import { ref } from 'vue';

import { Alert, Input, message, Modal, Table, Tag } from 'ant-design-vue';

import { batchCopyMchAppsApi } from '#/api';
import {
  stripCopyName,
  uniqueCopyNames,
  validateCopyBatch,
} from '#/utils/passage-copy-name';

const emit = defineEmits<{ copied: [] }>();

const COLUMNS = [
  {
    key: 'source',
    title: '原通道',
    dataIndex: 'source',
    width: 240,
    ellipsis: true,
  },
  { key: 'newName', title: '新通道名称', dataIndex: 'newName' },
];

const visible = ref(false);
const saving = ref(false);
const rows = ref<
  Array<{ newName: string; payPassageId: number; sourceName: string }>
>([]);

function open(passages: PayPassage[]) {
  if (passages.length === 0) {
    message.error('请先勾选需要复制的通道');
    return;
  }
  const names = uniqueCopyNames(
    passages.map((row) => String(row.payPassageName ?? '')),
  );
  rows.value = passages.map((row, index) => ({
    payPassageId: Number(row.payPassageId),
    sourceName: String(row.payPassageName ?? ''),
    newName: names[index] ?? '',
  }));
  visible.value = true;
}

async function submit() {
  const check = validateCopyBatch(
    rows.value.map((row) => ({
      newName: row.newName,
      sourceName: row.sourceName,
      label: `[${row.payPassageId}]`,
    })),
  );
  if (!check.valid) {
    message.error(check.message ?? '请检查新通道名称');
    return;
  }
  saving.value = true;
  try {
    const result = await batchCopyMchAppsApi(
      rows.value.map((row) => ({
        sourcePayPassageId: row.payPassageId,
        payPassageName: stripCopyName(row.newName),
      })),
    );
    const successCount = Number(result?.successCount ?? 0);
    const failItems = result?.failItems ?? [];
    if (successCount <= 0) {
      const reason = failItems[0]?.reason;
      message.error(reason ? `复制失败：${reason}` : '复制失败，请稍后再试');
      return;
    }
    if (failItems.length === 0) {
      message.success(`已成功复制 ${successCount} 条通道`);
    } else {
      const preview = failItems
        .slice(0, 3)
        .map(
          (item) =>
            `[${item.sourcePayPassageId}] ${item.sourcePayPassageName ?? ''}`,
        )
        .join('、');
      message.warning(
        `成功复制 ${successCount} 条，失败 ${failItems.length} 条${
          preview ? `：${preview}${failItems.length > 3 ? '…' : ''}` : ''
        }`,
      );
    }
    rows.value = [];
    visible.value = false;
    emit('copied');
  } finally {
    saving.value = false;
  }
}

defineExpose({ open });
</script>

<template>
  <Modal
    v-model:open="visible"
    title="批量一键复制"
    :width="720"
    ok-text="确定复制"
    cancel-text="取消"
    :confirm-loading="saving"
    destroy-on-close
    @ok="submit"
  >
    <div class="batch-copy-dialog">
      <Alert type="info" show-icon class="batch-copy-dialog__alert">
        <template #message>
          <div>
            将为所选 {{ rows.length }} 条通道各创建一个副本；新通道余额为
            <b>0</b>，状态为 <b>启用</b>。
          </div>
          <div class="batch-copy-dialog__alert-sub">
            配置从原通道继承；商户绑定、机器人绑定不会复制。
          </div>
        </template>
      </Alert>
      <section class="batch-copy-dialog__name-panel">
        <div class="batch-copy-dialog__name-panel-head">
          <span class="batch-copy-dialog__name-panel-label">新通道名称</span>
          <Tag color="orange">可逐条修改</Tag>
        </div>
        <p class="batch-copy-dialog__hint">
          默认按「原名称-一键复制-HH:mm」生成，建议便于区分的命名
        </p>
      </section>
      <div class="batch-copy-dialog__table-wrap">
        <Table
          row-key="payPassageId"
          size="small"
          bordered
          :pagination="false"
          :scroll="{ y: 360 }"
          :columns="COLUMNS"
          :data-source="rows"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'source'">
              <span
                class="batch-copy-dialog__source"
                :title="`[${record.payPassageId}] ${record.sourceName}`"
              >
                [{{ record.payPassageId }}] {{ record.sourceName }}
              </span>
            </template>
            <template v-else-if="column.key === 'newName'">
              <Input
                v-model:value="record.newName"
                allow-clear
                placeholder="请输入新通道名称"
              />
            </template>
          </template>
        </Table>
      </div>
    </div>
  </Modal>
</template>

<style scoped>
.batch-copy-dialog__alert {
  margin-bottom: 8px;
}

.batch-copy-dialog__alert-sub {
  margin-top: 2px;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.batch-copy-dialog__name-panel {
  padding: 10px 12px 8px;
  margin-bottom: 10px;
  background: linear-gradient(
    135deg,
    hsl(var(--primary) / 8%) 0%,
    hsl(var(--background)) 100%
  );
  border: 1px solid hsl(var(--primary) / 20%);
  border-left: 3px solid hsl(var(--primary));
  border-radius: var(--radius);
}

.batch-copy-dialog__name-panel-head {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
}

.batch-copy-dialog__name-panel-label {
  font-size: 15px;
  font-weight: 600;
  color: hsl(var(--foreground));
}

.batch-copy-dialog__hint {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: hsl(var(--muted-foreground));
}

.batch-copy-dialog__table-wrap :deep(.ant-table) {
  font-size: 13px;
}

.batch-copy-dialog__source {
  display: block;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
  color: hsl(var(--primary));
  white-space: nowrap;
}
</style>

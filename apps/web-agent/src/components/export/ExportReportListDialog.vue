<script setup lang="ts">
import type { TableColumnsType } from 'ant-design-vue';

import { Empty, Modal, Popconfirm, Space, Table } from 'ant-design-vue';

import type { AgentExportTask } from '#/api/modules/export-task';

defineProps<{
  visible: boolean;
  loading?: boolean;
  title?: string;
  data: AgentExportTask[];
  emptyHint?: string;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'download', row: AgentExportTask): void;
  (e: 'remove', row: AgentExportTask): void;
}>();

const columns: TableColumnsType<AgentExportTask> = [
  { dataIndex: 'startedAt', title: '开始时间', width: 170 },
  { dataIndex: 'operator', title: '操作人', width: 100 },
  { dataIndex: 'finishedAt', title: '完成时间', width: 170 },
  { dataIndex: 'fileName', ellipsis: true, title: '文件名' },
  { dataIndex: 'totalRows', title: '行数', width: 80 },
  { dataIndex: 'action', title: '操作', width: 120 },
];
</script>

<template>
  <Modal
    :open="visible"
    :title="title"
    :footer="null"
    width="860px"
    destroy-on-close
    @update:open="emit('update:visible', $event)"
  >
    <Table
      v-if="loading || data.length > 0"
      :columns="columns"
      :data-source="data"
      :loading="loading"
      :pagination="false"
      row-key="rowKey"
      size="small"
      bordered
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'action'">
          <Space :size="8">
            <a @click="emit('download', record as AgentExportTask)">下载</a>
            <Popconfirm
              title="确认删除该报表？删除后不可恢复"
              ok-text="确认"
              cancel-text="取消"
              @confirm="emit('remove', record as AgentExportTask)"
            >
              <a class="text-red-500">删除</a>
            </Popconfirm>
          </Space>
        </template>
      </template>
    </Table>
    <Empty
      v-else
      :description="
        emptyHint ||
        '暂无已完成报表。若导出刚提交，请稍候关闭后重新打开；若导出失败，请重新导出。'
      "
    />
  </Modal>
</template>

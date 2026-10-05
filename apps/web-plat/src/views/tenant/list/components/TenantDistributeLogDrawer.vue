<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import type { DistributeRecord, PlatTenant } from '#/api';

import { ref } from 'vue';

import { Drawer, Table, Tag } from 'ant-design-vue';

import { fetchDistributeRecordsApi } from '#/api';

const visible = ref(false);
const loading = ref(false);
const tenant = ref<PlatTenant | null>(null);
const dataSource = ref<DistributeRecord[]>([]);

const statusColor: Record<string, string> = {
  success: 'success',
  partial: 'warning',
  failed: 'error',
  pending: 'processing',
};

const statusText: Record<string, string> = {
  success: '成功',
  partial: '部分成功',
  failed: '失败',
  pending: '进行中',
};

const columns: TableColumnsType = [
  { dataIndex: 'createdAt', title: '时间', width: 170 },
  { dataIndex: 'ifCode', title: '接口', ellipsis: true },
  { dataIndex: 'version', title: '版本', width: 90 },
  { dataIndex: 'status', title: '状态', width: 100 },
  { dataIndex: 'operator', title: '操作人', width: 100 },
  { dataIndex: 'message', title: '说明', ellipsis: true },
];

async function show(row: PlatTenant) {
  tenant.value = row;
  visible.value = true;
  loading.value = true;
  try {
    const page = await fetchDistributeRecordsApi({ tenantId: row.tenantId });
    dataSource.value = page.records;
  } finally {
    loading.value = false;
  }
}

defineExpose({ show });
</script>

<template>
  <Drawer
    v-model:open="visible"
    :title="tenant ? `下发记录 · ${tenant.tenantName}` : '下发记录'"
    :width="760"
    destroy-on-close
  >
    <Table
      :columns="columns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="{ pageSize: 10 }"
      row-key="id"
      size="middle"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'ifCode'">
          {{ record.ifName }}（{{ record.ifCode }}）
        </template>
        <template v-else-if="column.dataIndex === 'status'">
          <Tag :color="statusColor[record.status] || 'default'">
            {{ statusText[record.status] || record.status }}
          </Tag>
        </template>
      </template>
    </Table>
  </Drawer>
</template>

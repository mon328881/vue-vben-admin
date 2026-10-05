<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import type { DistributeRecord } from '#/api';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Form, Input, Select, Table, Tag } from 'ant-design-vue';

import { fetchDistributeRecordsApi } from '#/api';
import FilterActions from '#/components/list/FilterActions.vue';

defineOptions({ name: 'PayIfDistributeLogPage' });

const loading = ref(false);
const dataSource = ref<DistributeRecord[]>([]);
const total = ref(0);
const query = reactive({ ifCode: '', status: '' });

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
  { dataIndex: 'ifCode', title: '接口', width: 200 },
  { dataIndex: 'version', title: '版本', width: 100 },
  { dataIndex: 'tenantNames', title: '目标运营端', ellipsis: true },
  { dataIndex: 'status', title: '状态', width: 110 },
  { dataIndex: 'operator', title: '操作人', width: 120 },
  { dataIndex: 'message', title: '结果说明', ellipsis: true },
];

async function loadData() {
  loading.value = true;
  try {
    const page = await fetchDistributeRecordsApi(query);
    dataSource.value = page.records;
    total.value = page.total;
  } finally {
    loading.value = false;
  }
}

function onReset() {
  query.ifCode = '';
  query.status = '';
  void loadData();
}

onMounted(loadData);
</script>

<template>
  <Page auto-content-height title="下发记录">
    <div class="ap-page-stack">
      <Card :bordered="false" class="ap-page-filter">
        <Form layout="inline" @submit.prevent="loadData">
          <Form.Item label="接口代码">
            <Input
              v-model:value="query.ifCode"
              allow-clear
              placeholder="接口代码"
              style="width: 160px"
            />
          </Form.Item>
          <Form.Item label="状态">
            <Select
              v-model:value="query.status"
              allow-clear
              placeholder="全部"
              style="width: 140px"
              :options="[
                { label: '成功', value: 'success' },
                { label: '部分成功', value: 'partial' },
                { label: '失败', value: 'failed' },
              ]"
            />
          </Form.Item>
          <Form.Item class="ap-filter-actions">
            <FilterActions @reset="onReset" />
          </Form.Item>
        </Form>
      </Card>

      <Card :bordered="false">
        <Table
          :columns="columns"
          :data-source="dataSource"
          :loading="loading"
          :pagination="{ total, showSizeChanger: true }"
          row-key="id"
          size="middle"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'ifCode'">
              {{ record.ifName }}（{{ record.ifCode }}）
            </template>
            <template v-else-if="column.dataIndex === 'tenantNames'">
              {{ record.tenantNames.join('、') }}
            </template>
            <template v-else-if="column.dataIndex === 'status'">
              <Tag :color="statusColor[record.status] || 'default'">
                {{ statusText[record.status] || record.status }}
              </Tag>
            </template>
          </template>
        </Table>
      </Card>
    </div>
  </Page>
</template>

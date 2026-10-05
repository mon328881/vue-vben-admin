<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import type { PlatAuditLog, PlatAuditModule } from '#/api';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Form, Input, Select, Table, Tag } from 'ant-design-vue';

import { fetchPlatAuditLogsApi } from '#/api';
import FilterActions from '#/components/list/FilterActions.vue';

defineOptions({ name: 'PlatAuditLogPage' });

const loading = ref(false);
const dataSource = ref<PlatAuditLog[]>([]);
const total = ref(0);
const query = reactive<{ keyword: string; module: PlatAuditModule | '' }>({
  keyword: '',
  module: '',
});

const moduleText: Record<PlatAuditModule, string> = {
  tenant: '运营租户',
  'pay-if': '支付接口',
  distribute: '接口下发',
  'plat-user': '管理账号',
  config: '平台配置',
};

const columns: TableColumnsType = [
  { dataIndex: 'createdAt', title: '时间', width: 170 },
  { dataIndex: 'operator', title: '操作人', width: 120 },
  { dataIndex: 'module', title: '模块', width: 120 },
  { dataIndex: 'action', title: '操作', width: 140 },
  { dataIndex: 'target', title: '对象', ellipsis: true },
  { dataIndex: 'result', title: '结果', width: 90 },
  { dataIndex: 'remark', title: '说明', ellipsis: true },
];

async function loadData() {
  loading.value = true;
  try {
    const page = await fetchPlatAuditLogsApi(query);
    dataSource.value = page.records;
    total.value = page.total;
  } finally {
    loading.value = false;
  }
}

function onReset() {
  query.keyword = '';
  query.module = '';
  void loadData();
}

onMounted(loadData);
</script>

<template>
  <Page auto-content-height title="操作日志">
    <div class="ap-page-stack">
      <Card :bordered="false" class="ap-page-filter">
        <Form layout="inline" @submit.prevent="loadData">
          <Form.Item label="关键词">
            <Input
              v-model:value="query.keyword"
              allow-clear
              placeholder="操作人/动作/对象"
              style="width: 200px"
            />
          </Form.Item>
          <Form.Item label="模块">
            <Select
              v-model:value="query.module"
              allow-clear
              placeholder="全部"
              style="width: 160px"
              :options="[
                { label: '运营租户', value: 'tenant' },
                { label: '支付接口', value: 'pay-if' },
                { label: '接口下发', value: 'distribute' },
                { label: '管理账号', value: 'plat-user' },
                { label: '平台配置', value: 'config' },
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
            <template v-if="column.dataIndex === 'module'">
              {{ moduleText[record.module as PlatAuditModule] || record.module }}
            </template>
            <template v-else-if="column.dataIndex === 'result'">
              <Tag :color="record.result === 'success' ? 'success' : 'error'">
                {{ record.result === 'success' ? '成功' : '失败' }}
              </Tag>
            </template>
          </template>
        </Table>
      </Card>
    </div>
  </Page>
</template>

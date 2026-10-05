<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import type { PlatPayIfDefine } from '#/api';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Form,
  Input,
  message,
  Popconfirm,
  Table,
  Tag,
} from 'ant-design-vue';

import { deletePayIfDefineApi, fetchPayIfDefinesApi } from '#/api';
import FilterActions from '#/components/list/FilterActions.vue';
import { PLAT_ENT } from '#/constants/entitlements';
import { hasEnt } from '#/utils/access';

import PayIfFormDrawer from './components/PayIfFormDrawer.vue';

defineOptions({ name: 'PayIfListPage' });

const loading = ref(false);
const dataSource = ref<PlatPayIfDefine[]>([]);
const total = ref(0);
const query = reactive({ ifCode: '', ifName: '' });
const drawerRef = ref<InstanceType<typeof PayIfFormDrawer>>();
const canEdit = computed(() => hasEnt(PLAT_ENT.IF_EDIT));

const columns: TableColumnsType = [
  { dataIndex: 'ifCode', title: '接口代码', width: 140 },
  { dataIndex: 'ifName', title: '接口名称', ellipsis: true },
  { dataIndex: 'version', title: 'Schema 版本', width: 120 },
  { dataIndex: 'fieldCount', title: '字段数', width: 90 },
  { dataIndex: 'state', title: '状态', width: 90 },
  { dataIndex: 'updatedAt', title: '更新时间', width: 170 },
  { dataIndex: 'action', fixed: 'right', title: '操作', width: 160 },
];

async function loadData() {
  loading.value = true;
  try {
    const page = await fetchPayIfDefinesApi(query);
    dataSource.value = page.records;
    total.value = page.total;
  } finally {
    loading.value = false;
  }
}

function onReset() {
  query.ifCode = '';
  query.ifName = '';
  void loadData();
}

function onDeleteRow(row: Record<string, any>) {
  void onDelete(row as PlatPayIfDefine);
}

async function onDelete(row: PlatPayIfDefine) {
  await deletePayIfDefineApi(row.ifCode);
  message.success('已删除');
  await loadData();
}

onMounted(loadData);
</script>

<template>
  <Page auto-content-height title="接口定义">
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
          <Form.Item label="接口名称">
            <Input
              v-model:value="query.ifName"
              allow-clear
              placeholder="接口名称"
              style="width: 160px"
            />
          </Form.Item>
          <Form.Item class="ap-filter-actions">
            <FilterActions @reset="onReset" />
          </Form.Item>
        </Form>
      </Card>

      <Card :bordered="false">
        <div v-if="canEdit" class="ap-table-toolbar">
          <Button type="primary" @click="drawerRef?.showCreate()">
            新建接口
          </Button>
        </div>
        <Table
          :columns="columns"
          :data-source="dataSource"
          :loading="loading"
          :pagination="{ total, showSizeChanger: true }"
          row-key="ifCode"
          size="middle"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'fieldCount'">
              {{ record.ifParams?.length ?? 0 }}
            </template>
            <template v-else-if="column.dataIndex === 'state'">
              <Tag :color="record.state === 1 ? 'success' : 'default'">
                {{ record.state === 1 ? '启用' : '停用' }}
              </Tag>
            </template>
            <template v-else-if="column.dataIndex === 'action'">
              <div class="ap-table-ops">
                <Button
                  type="link"
                  size="small"
                  @click="drawerRef?.showEdit(record.ifCode, { readonly: !canEdit })"
                >
                  Schema
                </Button>
                <Popconfirm
                  v-if="canEdit"
                  title="确认删除该支付接口？"
                  @confirm="onDeleteRow(record)"
                >
                  <Button type="link" danger size="small">删除</Button>
                </Popconfirm>
              </div>
            </template>
          </template>
        </Table>
      </Card>
    </div>

    <PayIfFormDrawer ref="drawerRef" @success="loadData" />
  </Page>
</template>

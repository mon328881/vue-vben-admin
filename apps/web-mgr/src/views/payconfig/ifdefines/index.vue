<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import {
  Button,
  Card,
  Form,
  Input,
  Popconfirm,
  Space,
  Table,
  message,
} from 'ant-design-vue';

import { deletePayIfDefineApi, fetchPayIfDefinesApi } from '#/api';
import type { PayIfDefine } from '#/api/modules/pay-if';
import { hasEnt } from '#/utils/access';
import { formatDateTime } from '#/utils/format';

import IfDefineFormDrawer from './components/IfDefineFormDrawer.vue';

defineOptions({ name: 'IfDefinePage' });

const loading = ref(false);
const dataSource = ref<PayIfDefine[]>([]);
const total = ref(0);
const pagination = reactive({ current: 1, pageSize: 20 });
const query = reactive({ ifCode: '', ifName: '' });

const formRef = ref<InstanceType<typeof IfDefineFormDrawer>>();

const canAdd = computed(() => hasEnt('ENT_PC_IF_DEFINE_ADD'));
const canEdit = computed(() => hasEnt('ENT_PC_IF_DEFINE_EDIT'));
const canDel = computed(() => hasEnt('ENT_PC_IF_DEFINE_DEL'));

const columns: TableColumnsType = [
  { dataIndex: 'ifCode', title: '接口代码', width: 220 },
  { dataIndex: 'ifName', ellipsis: true, title: '接口名称' },
  { dataIndex: 'createdAt', title: '创建时间', width: 180 },
  { dataIndex: 'action', fixed: 'right', title: '操作', width: 140 },
];

async function loadData(resetPage = false) {
  if (resetPage) pagination.current = 1;
  loading.value = true;
  try {
    const page = await fetchPayIfDefinesApi({
      ...query,
      pageNumber: pagination.current,
      pageSize: pagination.pageSize,
    });
    dataSource.value = page?.records ?? [];
    total.value = page?.total ?? 0;
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  void loadData(true);
}

function onReset() {
  query.ifCode = '';
  query.ifName = '';
  void loadData(true);
}

function onTableChange(pag: { current?: number; pageSize?: number }) {
  pagination.current = pag.current ?? 1;
  pagination.pageSize = pag.pageSize ?? 20;
  void loadData();
}

async function onDelete(row: PayIfDefine) {
  await deletePayIfDefineApi(row.ifCode);
  message.success('删除成功');
  void loadData();
}

function onFormSuccess(toFirstPage: boolean) {
  void loadData(toFirstPage);
}

onMounted(() => {
  void loadData(true);
});
</script>

<template>
  <Page auto-content-height title="支付接口">
    <div class="ap-page-stack">
      <Card class="ap-page-filter">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Space>
          <Button v-if="canAdd" type="primary" @click="formRef?.showCreate()">
            新建接口
          </Button>
          <Button :loading="loading" @click="() => loadData()">刷新</Button>
        </Space>
        <span class="text-sm text-muted-foreground">共 {{ total }} 个接口</span>
      </div>
      <Form layout="inline" @finish="onSearch">
        <Form.Item>
          <Input
            v-model:value="query.ifCode"
            allow-clear
            placeholder="接口代码"
          />
        </Form.Item>
        <Form.Item>
          <Input
            v-model:value="query.ifName"
            allow-clear
            placeholder="接口名称"
          />
        </Form.Item>
        <Form.Item class="ap-filter-actions">
          <Space>
            <Button html-type="submit" type="primary">查询</Button>
            <Button @click="onReset">重置</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>

    <Card>
      <Table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="{
          current: pagination.current,
          pageSize: pagination.pageSize,
          showSizeChanger: true,
          showTotal: (t: number) => `共 ${t} 条`,
          total,
        }"
        row-key="ifCode"
        size="middle"
        @change="onTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'ifCode'">
            [{{ record.ifCode }}]
          </template>
          <template v-else-if="column.dataIndex === 'createdAt'">
            {{ formatDateTime(record.createdAt) }}
          </template>
          <template v-else-if="column.dataIndex === 'action'">
            <Space>
              <Button
                v-if="canEdit"
                size="small"
                type="link"
                @click="formRef?.showEdit(record.ifCode)"
              >
                编辑
              </Button>
              <Popconfirm
                v-if="canDel"
                :title="`确定删除支付接口「${record.ifName || record.ifCode}」（${record.ifCode}）？删除后不可恢复。`"
                @confirm="onDelete(record as PayIfDefine)"
              >
                <Button danger size="small" type="link">删除</Button>
              </Popconfirm>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <IfDefineFormDrawer ref="formRef" @success="onFormSuccess" />
    </div>
  </Page>
</template>

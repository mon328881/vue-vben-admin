<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { nextTick, reactive, ref } from 'vue';

import {
  Button,
  Card,
  Drawer,
  Form,
  RangePicker,
  Select,
  Space,
  Statistic,
  Table,
} from 'ant-design-vue';

import {
  fetchPassagePrepaidHistoryByGroupApi,
  fetchPassagePrepaidHistoryByGroupStatApi,
} from '#/api';
import { FUND_DIRECTION_OPTIONS } from '#/constants/merchant';
import { formatDateTime, formatYuan } from '#/utils/format';

const visible = ref(false);
const loading = ref(false);
const dataSource = ref<Record<string, unknown>[]>([]);
const total = ref(0);
const totalAmount = ref(0);
const pagination = reactive({ current: 1, pageSize: 20 });
const dateRange = ref<[string, string] | undefined>();
const query = reactive({
  passageGroupName: '',
  fundDirection: undefined as string | undefined,
});

const columns: TableColumnsType = [
  { dataIndex: 'createdAt', title: '创建日期', width: 180 },
  { dataIndex: 'beforeBalance', title: '变更前余额', width: 130 },
  { dataIndex: 'amount', title: '变更金额', width: 130 },
  { dataIndex: 'afterBalance', title: '变更后余额', width: 130 },
  { dataIndex: 'operator', ellipsis: true, title: '操作员', width: 140 },
  { dataIndex: 'remark', ellipsis: true, title: '备注', width: 200 },
];

function buildParams() {
  const [createdStart, createdEnd] = dateRange.value ?? [];
  return {
    passageGroupName: query.passageGroupName,
    fundDirection: query.fundDirection,
    createdStart,
    createdEnd,
    pageNumber: pagination.current,
    pageSize: pagination.pageSize,
  };
}

async function loadStat() {
  try {
    const data = await fetchPassagePrepaidHistoryByGroupStatApi(buildParams());
    totalAmount.value = data?.totalAmount ?? 0;
  } catch {
    totalAmount.value = 0;
  }
}

async function loadData(resetPage = false) {
  if (!query.passageGroupName) return;
  if (resetPage) pagination.current = 1;
  loading.value = true;
  try {
    void loadStat();
    const page = await fetchPassagePrepaidHistoryByGroupApi(buildParams());
    dataSource.value = (page?.records as Record<string, unknown>[]) ?? [];
    total.value = page?.total ?? 0;
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  void loadData(true);
}

function onReset() {
  query.fundDirection = undefined;
  dateRange.value = undefined;
  void loadData(true);
}

function onTableChange(pag: { current?: number; pageSize?: number }) {
  pagination.current = pag.current ?? 1;
  pagination.pageSize = pag.pageSize ?? 20;
  void loadData();
}

function show(passageGroupName: string) {
  query.passageGroupName = passageGroupName;
  query.fundDirection = undefined;
  dateRange.value = undefined;
  visible.value = true;
  void nextTick(() => loadData(true));
}

defineExpose({ show });
</script>

<template>
  <Drawer
    v-model:open="visible"
    :title="`预付记录 — ${query.passageGroupName}`"
    :width="900"
    :footer="false"
    destroy-on-close
  >
    <div class="ap-drawer-stack">
      <Form class="ap-drawer-filter" layout="inline" @finish="onSearch">
        <Form.Item>
          <RangePicker
            v-model:value="dateRange"
            show-time
            value-format="YYYY-MM-DD HH:mm:ss"
            :placeholder="['创建时间开始', '创建时间结束']"
          />
        </Form.Item>
        <Form.Item>
          <Select
            v-model:value="query.fundDirection"
            allow-clear
            placeholder="资金方向"
            style="width: 120px"
            :options="FUND_DIRECTION_OPTIONS"
          />
        </Form.Item>
        <Form.Item class="ap-filter-actions">
          <Space>
            <Button html-type="submit" type="primary">查询</Button>
            <Button @click="onReset">重置</Button>
          </Space>
        </Form.Item>
      </Form>

      <Card size="small">
        <Statistic title="变更金额合计" :value="formatYuan(totalAmount)" />
      </Card>

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
        :row-key="
          (r: any, i?: number) =>
            String(r.passageGroupPrepaidHistoryId ?? r.id ?? i ?? 0)
        "
        size="middle"
        :scroll="{ x: 900 }"
        @change="onTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'createdAt'">
            {{ formatDateTime(record.createdAt as string) }}
          </template>
          <template v-else-if="column.dataIndex === 'beforeBalance'">
            {{ formatYuan(record.beforeBalance as number) }}
          </template>
          <template v-else-if="column.dataIndex === 'amount'">
            {{ formatYuan(record.amount as number) }}
          </template>
          <template v-else-if="column.dataIndex === 'afterBalance'">
            {{ formatYuan(record.afterBalance as number) }}
          </template>
          <template v-else-if="column.dataIndex === 'operator'">
            {{ record.createdLoginName || record.operator || '-' }}
          </template>
        </template>
      </Table>
    </div>
  </Drawer>
</template>

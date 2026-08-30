<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { reactive, ref } from 'vue';

import {
  Button,
  Drawer,
  Form,
  RangePicker,
  Select,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  fetchMchPrepaidHistoryApi,
  fetchMchPrepaidHistoryStatApi,
} from '#/api';
import type { MchInfo, MchPrepaidHistory } from '#/api/types/business';
import { FUND_DIRECTION_OPTIONS, todayDateTimeRange } from '#/constants/merchant';
import { formatDateTime, formatYuan } from '#/utils/format';

const visible = ref(false);
const loading = ref(false);
const dataSource = ref<MchPrepaidHistory[]>([]);
const total = ref(0);
const totalAmount = ref(0);
const pagination = reactive({ current: 1, pageSize: 20 });
const mch = ref<Partial<MchInfo>>({});
const dateRange = ref<[string, string] | undefined>();
const query = reactive({
  mchNo: '',
  fundDirection: undefined as string | undefined,
});

const columns: TableColumnsType<MchPrepaidHistory> = [
  { dataIndex: 'createdAt', title: '创建日期', width: 170 },
  { dataIndex: 'beforeBalance', title: '变更前余额', width: 120 },
  { dataIndex: 'amount', title: '变更金额', width: 120 },
  { dataIndex: 'afterBalance', title: '变更后余额', width: 120 },
  { dataIndex: 'operator', title: '操作员', width: 140 },
  { dataIndex: 'remark', ellipsis: true, title: '备注', width: 200 },
];

function buildParams() {
  const [createdStart, createdEnd] = dateRange.value ?? [];
  return {
    mchNo: query.mchNo,
    fundDirection: query.fundDirection || undefined,
    createdStart,
    createdEnd,
    pageNumber: pagination.current,
    pageSize: pagination.pageSize,
  };
}

async function loadStat() {
  try {
    const data = await fetchMchPrepaidHistoryStatApi(buildParams());
    totalAmount.value = data?.totalAmount ?? 0;
  } catch {
    totalAmount.value = 0;
  }
}

async function loadData(resetPage = false) {
  if (resetPage) pagination.current = 1;
  loading.value = true;
  try {
    void loadStat();
    const page = await fetchMchPrepaidHistoryApi(buildParams());
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
  query.fundDirection = undefined;
  dateRange.value = todayDateTimeRange();
  void loadData(true);
}

function onTableChange(pag: { current?: number; pageSize?: number }) {
  pagination.current = pag.current ?? 1;
  pagination.pageSize = pag.pageSize ?? 20;
  void loadData();
}

function signedYuan(value?: number | null) {
  if (value == null || value === 0) return '0.00';
  const text = formatYuan(value);
  return value > 0 ? `+${text}` : text;
}

function amountClass(value?: number | null) {
  if (value == null || value === 0) return '';
  return value > 0 ? 'text-green-500' : 'text-red-500';
}

function show(row: MchInfo) {
  mch.value = row;
  query.mchNo = row.mchNo;
  query.fundDirection = undefined;
  dateRange.value = todayDateTimeRange();
  visible.value = true;
  void loadData(true);
}

defineExpose({ show });
</script>

<template>
  <Drawer
    v-model:open="visible"
    title="预付流水记录"
    :width="1100"
    :footer="false"
    destroy-on-close
  >
    <div class="ap-drawer-body">
      <div class="ap-drawer-section ap-drawer-mch-info">
        <span>商户名称: </span>
        [<span class="text-primary font-semibold">{{ mch.mchNo }}</span>]
        <span class="text-muted-foreground ml-1 font-semibold">
          {{ mch.mchName }}
        </span>
      </div>
      <div class="ap-drawer-section">
        <Form layout="inline" class="ap-drawer-filter" @finish="onSearch">
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
              placeholder="资金变动方向"
              style="width: 140px"
              :options="FUND_DIRECTION_OPTIONS"
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button html-type="submit" type="primary">搜索</Button>
              <Button @click="onReset">重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </div>
      <div class="ap-drawer-section flex items-center gap-2">
        <span class="font-semibold">变更金额汇总：</span>
        <Tag color="blue">{{ formatYuan(totalAmount) }}</Tag>
      </div>
      <div class="ap-drawer-section ap-drawer-table-card">
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
          row-key="mchPrepaidHistoryId"
          size="middle"
          :scroll="{ x: 900 }"
          @change="onTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'createdAt'">
              {{ formatDateTime(record.createdAt) }}
            </template>
            <template v-else-if="column.dataIndex === 'beforeBalance'">
              <b>{{ formatYuan(record.beforeBalance) }}</b>
            </template>
            <template v-else-if="column.dataIndex === 'amount'">
              <b :class="amountClass(record.amount)">
                {{ signedYuan(record.amount) }}
              </b>
            </template>
            <template v-else-if="column.dataIndex === 'afterBalance'">
              <b>{{ formatYuan(record.afterBalance) }}</b>
            </template>
            <template v-else-if="column.dataIndex === 'operator'">
              <span class="text-xs">
                {{ record.createdLoginName || record.createdUid || '-' }}
              </span>
            </template>
            <template v-else-if="column.dataIndex === 'remark'">
              <b>{{ record.remark || '' }}</b>
            </template>
          </template>
        </Table>
      </div>
    </div>
  </Drawer>
</template>

<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { nextTick, reactive, ref } from 'vue';

import {
  Button,
  Drawer,
  Form,
  RangePicker,
  Select,
  Space,
  Table,
} from 'ant-design-vue';

import {
  fetchPassagePrepaidHistoryByGroupApi,
  fetchPassagePrepaidHistoryByGroupStatApi,
} from '#/api';
import type { PrepaidHistoryStat } from '#/api/modules/history';
import type { PassagePrepaidHistory } from '#/api/types/business';
import HistoryPrepaidOperatorCell from '#/components/prepaid/HistoryPrepaidOperatorCell.vue';
import PicPreviewButton from '#/components/prepaid/PicPreviewButton.vue';
import PrepaidHistoryStatCards from '#/components/prepaid/PrepaidHistoryStatCards.vue';
import { FUND_DIRECTION_OPTIONS } from '#/constants/merchant';
import {
  amountSignedClass,
  formatDateTime,
  formatExchangeRate,
  formatOptionalText,
  formatPrepaidQuantity,
  formatYuan,
  signedYuan,
} from '#/utils/format';

const visible = ref(false);
const loading = ref(false);
const dataSource = ref<PassagePrepaidHistory[]>([]);
const total = ref(0);
const stat = ref<PrepaidHistoryStat>({});
const pagination = reactive({ current: 1, pageSize: 20 });
const dateRange = ref<[string, string] | undefined>();
const query = reactive({
  passageGroupName: '',
  fundDirection: undefined as string | undefined,
});

const columns: TableColumnsType<PassagePrepaidHistory> = [
  { dataIndex: 'beforeBalance', title: '变更前预付', width: 120 },
  { dataIndex: 'amount', title: '变更金额', width: 120 },
  { dataIndex: 'afterBalance', title: '变更后预付', width: 120 },
  { dataIndex: 'currencyType', title: '货币类型', width: 100 },
  { dataIndex: 'quantity', title: '数量', width: 110 },
  { dataIndex: 'exchangeRate', title: '汇率', width: 100 },
  { dataIndex: 'pic', title: '凭证', width: 80, align: 'center' },
  { dataIndex: 'operator', title: '操作员', width: 200 },
  { dataIndex: 'remark', ellipsis: true, title: '备注', width: 160 },
  { dataIndex: 'createdAt', title: '操作时间', width: 170 },
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
    stat.value =
      (await fetchPassagePrepaidHistoryByGroupStatApi(buildParams())) ?? {};
  } catch {
    stat.value = {};
  }
}

async function loadData(resetPage = false) {
  if (!query.passageGroupName) return;
  if (resetPage) pagination.current = 1;
  loading.value = true;
  try {
    void loadStat();
    const page = await fetchPassagePrepaidHistoryByGroupApi(buildParams());
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
    :width="1100"
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
            :placeholder="['操作时间开始', '操作时间结束']"
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

      <PrepaidHistoryStatCards :stat="stat" />

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
        row-key="passageGroupPrepaidHistoryId"
        size="middle"
        :scroll="{ x: 1100 }"
        @change="onTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'beforeBalance'">
            <b>{{ formatYuan(record.beforeBalance) }}</b>
          </template>
          <template v-else-if="column.dataIndex === 'amount'">
            <b :class="amountSignedClass(record.amount)">
              {{ signedYuan(record.amount) }}
            </b>
          </template>
          <template v-else-if="column.dataIndex === 'afterBalance'">
            <b>{{ formatYuan(record.afterBalance) }}</b>
          </template>
          <template v-else-if="column.dataIndex === 'currencyType'">
            {{ formatOptionalText(record.currencyType) }}
          </template>
          <template v-else-if="column.dataIndex === 'quantity'">
            {{ formatPrepaidQuantity(record.quantity) }}
          </template>
          <template v-else-if="column.dataIndex === 'exchangeRate'">
            {{ formatExchangeRate(record.exchangeRate) }}
          </template>
          <template v-else-if="column.dataIndex === 'pic'">
            <PicPreviewButton :pic="record.pic" />
          </template>
          <template v-else-if="column.dataIndex === 'operator'">
            <HistoryPrepaidOperatorCell
              :created-login-name="record.createdLoginName"
              :created-uid="record.createdUid"
            />
          </template>
          <template v-else-if="column.dataIndex === 'createdAt'">
            {{ formatDateTime(record.createdAt) }}
          </template>
        </template>
      </Table>
    </div>
  </Drawer>
</template>

<style scoped>
.amount-positive {
  color: hsl(142 71% 40%);
}

.amount-negative {
  color: hsl(var(--destructive));
}
</style>

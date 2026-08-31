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
} from 'ant-design-vue';

import {
  fetchMchPrepaidHistoryApi,
  fetchMchPrepaidHistoryStatApi,
} from '#/api';
import type { PrepaidHistoryStat } from '#/api/modules/history';
import type { MchInfo, MchPrepaidHistory } from '#/api/types/business';
import HistoryPrepaidOperatorCell from '#/components/prepaid/HistoryPrepaidOperatorCell.vue';
import PicPreviewButton from '#/components/prepaid/PicPreviewButton.vue';
import PrepaidHistoryStatCards from '#/components/prepaid/PrepaidHistoryStatCards.vue';
import { FUND_DIRECTION_OPTIONS, todayDateTimeRange } from '#/constants/merchant';
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
const dataSource = ref<MchPrepaidHistory[]>([]);
const total = ref(0);
const stat = ref<PrepaidHistoryStat>({});
const pagination = reactive({ current: 1, pageSize: 20 });
const mch = ref<Partial<MchInfo>>({});
const dateRange = ref<[string, string] | undefined>();
const query = reactive({
  mchNo: '',
  fundDirection: undefined as string | undefined,
});

const columns: TableColumnsType<MchPrepaidHistory> = [
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
    stat.value =
      (await fetchMchPrepaidHistoryStatApi(buildParams())) ?? {};
  } catch {
    stat.value = {};
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
    :width="1200"
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
              :placeholder="['操作时间开始', '操作时间结束']"
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
      <div class="ap-drawer-section">
        <PrepaidHistoryStatCards :stat="stat" />
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
          :scroll="{ x: 1200 }"
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
            <template v-else-if="column.dataIndex === 'remark'">
              {{ record.remark || '—' }}
            </template>
            <template v-else-if="column.dataIndex === 'createdAt'">
              {{ formatDateTime(record.createdAt) }}
            </template>
          </template>
        </Table>
      </div>
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

<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import {
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Form,
  Input,
  message,
  RangePicker,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  fetchForceOrderStatApi,
  fetchPayOrderDetailApi,
  fetchPayOrderForceListApi,
} from '#/api';
import type { PayOrder, PayRealTimeStat } from '#/api/types/business';
import {
  notifyStateColor,
  notifyStateLabel,
  payOrderStateColor,
  payOrderStateLabel,
} from '#/constants/order';
import { formatDateTime, formatYuan } from '#/utils/format';
import { defaultTodayRange } from '#/utils/date-range';

defineOptions({ name: 'OrderForceListPage' });

const loading = ref(false);
const dataSource = ref<PayOrder[]>([]);
const total = ref(0);
const pagination = reactive({ current: 1, pageSize: 20 });
const successRange = ref<[string, string] | undefined>(defaultTodayRange());
const query = reactive({
  payOrderId: '',
  mchOrderNo: '',
  passageOrderNo: '',
  mchNo: '',
  passageId: '' as string | number,
});
const stat = ref<PayRealTimeStat>({});
const detailOpen = ref(false);
const detailLoading = ref(false);
const detail = ref<PayOrder | null>(null);

const columns: TableColumnsType = [
  { dataIndex: 'mchNo', fixed: 'left', title: '商户号/商户', width: 160 },
  { dataIndex: 'payOrderId', title: '订单号（点击复制）', width: 200 },
  { dataIndex: 'amount', title: '支付金额', width: 110 },
  { dataIndex: 'forceChangeBeforeState', title: '补单前', width: 100 },
  { dataIndex: 'state', title: '当前状态', width: 100 },
  { dataIndex: 'forceChangeLoginName', title: '操作员', width: 100 },
  { dataIndex: 'notifyState', title: '回调状态', width: 100 },
  { dataIndex: 'updatedAt', title: '更新时间', width: 170 },
  { dataIndex: 'passageName', ellipsis: true, title: '支付通道', width: 140 },
  { dataIndex: 'action', fixed: 'right', title: '操作', width: 90 },
];

function buildParams() {
  const [successTimeStart, successTimeEnd] = successRange.value ?? [];
  return {
    ...query,
    passageId: query.passageId === '' ? undefined : query.passageId,
    successTimeStart,
    successTimeEnd,
    pageNumber: pagination.current,
    pageSize: pagination.pageSize,
  };
}

async function loadStat() {
  try {
    stat.value = (await fetchForceOrderStatApi(buildParams())) ?? {};
  } catch {
    // ignore
  }
}

async function loadData(resetPage = false) {
  if (resetPage) pagination.current = 1;
  loading.value = true;
  try {
    void loadStat();
    const page = await fetchPayOrderForceListApi(buildParams());
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
  query.payOrderId = '';
  query.mchOrderNo = '';
  query.passageOrderNo = '';
  query.mchNo = '';
  query.passageId = '';
  successRange.value = defaultTodayRange();
  void loadData(true);
}

function onTableChange(pag: { current?: number; pageSize?: number }) {
  pagination.current = pag.current ?? 1;
  pagination.pageSize = pag.pageSize ?? 20;
  void loadData();
}

async function copyText(text?: string | null) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(String(text));
    message.success('已复制');
  } catch {
    message.error('复制失败');
  }
}

async function openDetail(row: PayOrder) {
  detailOpen.value = true;
  detailLoading.value = true;
  try {
    detail.value = await fetchPayOrderDetailApi(row.payOrderId);
  } catch {
    detail.value = row;
  } finally {
    detailLoading.value = false;
  }
}

onMounted(() => {
  void loadData(true);
});
</script>

<template>
  <Page auto-content-height title="补单列表">
    <div class="ap-page-stack">
      <Card class="ap-page-filter">
      <Form layout="inline" @finish="onSearch">
        <Form.Item>
          <RangePicker
            v-model:value="successRange"
            show-time
            value-format="YYYY-MM-DD HH:mm:ss"
            :placeholder="['成功时间开始', '成功时间结束']"
          />
        </Form.Item>
        <Form.Item>
          <Input
            v-model:value="query.payOrderId"
            allow-clear
            placeholder="支付订单号"
          />
        </Form.Item>
        <Form.Item>
          <Input
            v-model:value="query.mchOrderNo"
            allow-clear
            placeholder="商户订单号"
          />
        </Form.Item>
        <Form.Item>
          <Input
            v-model:value="query.passageOrderNo"
            allow-clear
            placeholder="通道订单号"
          />
        </Form.Item>
        <Form.Item>
          <Input v-model:value="query.mchNo" allow-clear placeholder="商户号" />
        </Form.Item>
        <Form.Item>
          <Input
            v-model:value="query.passageId"
            allow-clear
            placeholder="对应通道"
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

    <Row :gutter="[12, 12]" class="ap-page-stats">
      <Col :md="6" :span="12">
        <Card size="small">
          <div class="text-muted-foreground text-xs">订单金额</div>
          <div class="text-lg font-semibold">
            {{ formatYuan(stat.successAmount) }}
          </div>
          <div class="text-muted-foreground text-xs">
            总：{{ formatYuan(stat.totalAmount) }}
          </div>
        </Card>
      </Col>
      <Col :md="6" :span="12">
        <Card size="small">
          <div class="text-muted-foreground text-xs">订单数</div>
          <div class="text-lg font-semibold">{{ stat.successCount ?? 0 }}</div>
          <div class="text-muted-foreground text-xs">
            总：{{ stat.totalCount ?? 0 }}
          </div>
        </Card>
      </Col>
      <Col :md="6" :span="12">
        <Card size="small">
          <Statistic title="商户入账" :value="formatYuan(stat.totalMchIncome)" />
        </Card>
      </Col>
      <Col :md="6" :span="12">
        <Card size="small">
          <Statistic title="平台利润" :value="formatYuan(stat.totalIncome)" />
        </Card>
      </Col>
    </Row>

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
        row-key="payOrderId"
        :scroll="{ x: 1400 }"
        size="middle"
        @change="onTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'mchNo'">
            <div>
              <div>{{ record.mchNo }}</div>
              <div class="text-muted-foreground text-xs">
                {{ record.mchName || '' }}
              </div>
            </div>
          </template>
          <template v-else-if="column.dataIndex === 'payOrderId'">
            <div class="cursor-pointer" @click="copyText(record.payOrderId as string)">
              <div>{{ record.payOrderId }}</div>
              <div class="text-muted-foreground text-xs">
                {{ record.mchOrderNo }}
              </div>
            </div>
          </template>
          <template v-else-if="column.dataIndex === 'amount'">
            {{ formatYuan(record.amount as number) }}
          </template>
          <template v-else-if="column.dataIndex === 'forceChangeBeforeState'">
            <Tag :color="payOrderStateColor(record.forceChangeBeforeState as number)">
              {{ payOrderStateLabel(record.forceChangeBeforeState as number) }}
            </Tag>
          </template>
          <template v-else-if="column.dataIndex === 'state'">
            <Tag :color="payOrderStateColor(record.state as number)">
              {{ payOrderStateLabel(record.state as number) }}
            </Tag>
          </template>
          <template v-else-if="column.dataIndex === 'notifyState'">
            <Tag :color="notifyStateColor(record.notifyState as number)">
              {{ notifyStateLabel(record.notifyState as number) }}
            </Tag>
          </template>
          <template v-else-if="column.dataIndex === 'updatedAt'">
            {{ formatDateTime(record.updatedAt as string) }}
          </template>
          <template v-else-if="column.dataIndex === 'action'">
            <Button size="small" type="link" @click="openDetail(record as PayOrder)">
              详情
            </Button>
          </template>
        </template>
      </Table>
    </Card>

    <Drawer
      v-model:open="detailOpen"
      title="订单详情"
      width="560"
      :loading="detailLoading"
    >
      <Descriptions v-if="detail" :column="1" bordered size="small">
        <Descriptions.Item label="支付订单号">
          {{ detail.payOrderId }}
        </Descriptions.Item>
        <Descriptions.Item label="商户订单号">
          {{ detail.mchOrderNo }}
        </Descriptions.Item>
        <Descriptions.Item label="通道订单号">
          {{ detail.passageOrderNo || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="商户号">{{ detail.mchNo }}</Descriptions.Item>
        <Descriptions.Item label="商户名">
          {{ detail.mchName || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="支付金额">
          {{ formatYuan(detail.amount) }}
        </Descriptions.Item>
        <Descriptions.Item label="补单前">
          <Tag :color="payOrderStateColor(detail.forceChangeBeforeState)">
            {{ payOrderStateLabel(detail.forceChangeBeforeState) }}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="当前状态">
          <Tag :color="payOrderStateColor(detail.state)">
            {{ payOrderStateLabel(detail.state) }}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="操作员">
          {{ detail.forceChangeLoginName || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="支付通道">
          {{ detail.passageName || detail.passageId || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="更新时间">
          {{ formatDateTime(detail.updatedAt) }}
        </Descriptions.Item>
      </Descriptions>
    </Drawer>
    </div>
  </Page>
</template>

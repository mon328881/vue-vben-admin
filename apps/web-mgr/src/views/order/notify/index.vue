<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import {
  Button,
  Card,
  Descriptions,
  Drawer,
  Form,
  Input,
  Modal,
  Popconfirm,
  RangePicker,
  Select,
  Space,
  Table,
  Tag,
  message,
} from 'ant-design-vue';

import {
  fetchMchNotifyListApi,
  resendAllMchNotifyApi,
  resendMchNotifyApi,
} from '#/api';
import {
  NOTIFY_STATE_OPTIONS,
  notifyStateColor,
  notifyStateLabel,
} from '#/constants/order';
import { hasEnt } from '#/utils/access';
import { formatDateTime } from '#/utils/format';
import { defaultTodayRange } from '#/utils/date-range';

defineOptions({ name: 'MchNotifyListPage' });

const loading = ref(false);
const dataSource = ref<Record<string, unknown>[]>([]);
const total = ref(0);
const pagination = reactive({ current: 1, pageSize: 20 });
const dateRange = ref<[string, string] | undefined>(defaultTodayRange());
const query = reactive({
  orderId: '',
  passageOrderNo: '',
  mchNo: '',
  state: 3 as number | undefined,
});
const detailOpen = ref(false);
const detail = ref<Record<string, unknown> | null>(null);

const canResend = computed(() => hasEnt('ENT_MCH_NOTIFY_RESEND'));

const columns: TableColumnsType = [
  { dataIndex: 'orderId', ellipsis: true, title: '订单号', width: 200 },
  { dataIndex: 'passageOrderNo', ellipsis: true, title: '通道订单号', width: 160 },
  { dataIndex: 'state', title: '通知状态', width: 110 },
  { dataIndex: 'orderType', title: '订单类型', width: 100 },
  { dataIndex: 'mchNo', title: '商户号', width: 130 },
  { dataIndex: 'payPassageName', ellipsis: true, title: '通道', width: 140 },
  { dataIndex: 'updatedAt', title: '更新日期', width: 170 },
  { dataIndex: 'action', fixed: 'right', title: '操作', width: 140 },
];

function orderTypeLabel(orderType?: number | null) {
  if (orderType === 1) return '支付';
  if (orderType === 2) return '代付';
  if (orderType === 3) return '提现';
  return '未知';
}

function buildParams() {
  const [createdStart, createdEnd] = dateRange.value ?? [];
  return {
    ...query,
    createdStart,
    createdEnd,
    pageNumber: pagination.current,
    pageSize: pagination.pageSize,
  };
}

async function loadData(resetPage = false) {
  if (resetPage) pagination.current = 1;
  loading.value = true;
  try {
    const page = await fetchMchNotifyListApi(buildParams());
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
  query.orderId = '';
  query.passageOrderNo = '';
  query.mchNo = '';
  query.state = 3;
  dateRange.value = defaultTodayRange();
  void loadData(true);
}

function onTableChange(pag: { current?: number; pageSize?: number }) {
  pagination.current = pag.current ?? 1;
  pagination.pageSize = pag.pageSize ?? 20;
  void loadData();
}

function openDetail(row: Record<string, unknown>) {
  detail.value = row;
  detailOpen.value = true;
}

function confirmResend(row: Record<string, unknown>) {
  const notifyId = row.notifyId;
  if (notifyId == null) {
    message.error('通知 ID 无效');
    return;
  }
  Modal.confirm({
    title: '确认重发通知？',
    content: `确认重发订单 ${row.orderId ?? ''} 的商户通知？`,
    okText: '确认',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      await resendMchNotifyApi(String(notifyId));
      message.success('操作成功');
      void loadData();
    },
  });
}

async function resendAll() {
  await resendAllMchNotifyApi({ ...query });
  message.success('操作成功');
  void loadData();
}

onMounted(() => {
  void loadData(true);
});
</script>

<template>
  <Page auto-content-height title="商户通知">
    <div class="ap-page-stack">
      <Card class="ap-page-filter">
      <Form layout="inline" @finish="onSearch">
        <Form.Item>
          <RangePicker
            v-model:value="dateRange"
            show-time
            value-format="YYYY-MM-DD HH:mm:ss"
            :placeholder="['创建时间开始', '创建时间结束']"
          />
        </Form.Item>
        <Form.Item>
          <Input v-model:value="query.orderId" allow-clear placeholder="订单号" />
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
          <Select
            v-model:value="query.state"
            allow-clear
            placeholder="通知状态"
            style="width: 140px"
            :options="NOTIFY_STATE_OPTIONS"
          />
        </Form.Item>
        <Form.Item class="ap-filter-actions">
          <Space>
            <Button html-type="submit" type="primary">查询</Button>
            <Button @click="onReset">重置</Button>
            <Popconfirm
              v-if="canResend"
              title="确认重发全部通知么?"
              @confirm="resendAll"
            >
              <Button danger>重发全部</Button>
            </Popconfirm>
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
        :row-key="(r: any, i?: number) => String(r.notifyId ?? r.orderId ?? i ?? 0)"
        :scroll="{ x: 1200 }"
        size="middle"
        @change="onTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'state'">
            <Tag :color="notifyStateColor(record.state as number)">
              {{ notifyStateLabel(record.state as number) }}
            </Tag>
          </template>
          <template v-else-if="column.dataIndex === 'orderType'">
            {{ orderTypeLabel(record.orderType as number) }}
          </template>
          <template v-else-if="column.dataIndex === 'updatedAt'">
            {{ formatDateTime(record.updatedAt as string) }}
          </template>
          <template v-else-if="column.dataIndex === 'action'">
            <Space>
              <Button
                size="small"
                type="link"
                @click="openDetail(record as Record<string, unknown>)"
              >
                详情
              </Button>
              <Button
                v-if="canResend && Number(record.state) === 3"
                danger
                size="small"
                type="link"
                @click="confirmResend(record as Record<string, unknown>)"
              >
                重发通知
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <Drawer v-model:open="detailOpen" title="通知详情" width="520">
      <Descriptions v-if="detail" :column="1" bordered size="small">
        <Descriptions.Item label="订单号">
          {{ detail.orderId }}
        </Descriptions.Item>
        <Descriptions.Item label="通道订单号">
          {{ detail.passageOrderNo || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="通知状态">
          <Tag :color="notifyStateColor(detail.state as number)">
            {{ notifyStateLabel(detail.state as number) }}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="订单类型">
          {{ orderTypeLabel(detail.orderType as number) }}
        </Descriptions.Item>
        <Descriptions.Item label="商户号">{{ detail.mchNo }}</Descriptions.Item>
        <Descriptions.Item label="通道">
          {{ detail.payPassageName || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="通知地址">
          {{ detail.notifyUrl || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="响应结果">
          {{ detail.resResult || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="更新日期">
          {{ formatDateTime(detail.updatedAt as string) }}
        </Descriptions.Item>
      </Descriptions>
    </Drawer>
    </div>
  </Page>
</template>

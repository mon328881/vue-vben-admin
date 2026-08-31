<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Space,
  Table,
  Tag,
  message,
} from 'ant-design-vue';

import {
  fetchMchAppsApi,
  fetchMchInfoApi,
  payTestPayOrdersApi,
} from '#/api';
import type { MchAppItem } from '#/api/types/business';
import FilterActions from '#/components/list/FilterActions.vue';
import PayTestDrawer from '#/components/pay/PayTestDrawer.vue';
import AssetsIcon from '#/components/payconfig/AssetsIcon.vue';
import { formatDateTime, formatRateDecimal } from '#/utils/format';

defineOptions({ name: 'MchAppsPage' });

const query = reactive({
  pageNumber: 1,
  pageSize: 20,
  productId: undefined as number | undefined,
  productName: '',
});
const list = ref<MchAppItem[]>([]);
const total = ref(0);
const loading = ref(false);

const payTestOpen = ref(false);
const currentProduct = ref<MchAppItem | null>(null);
const mchNo = ref('');

const columns: TableColumnsType<MchAppItem> = [
  { dataIndex: 'productId', title: '产品ID', width: 120 },
  { dataIndex: 'productName', title: '产品名称', ellipsis: true },
  { dataIndex: 'mchRate', title: '商户费率', width: 120 },
  { dataIndex: 'state', title: '状态', width: 100 },
  { dataIndex: 'createdAt', title: '创建日期', width: 180 },
  { dataIndex: 'action', title: '操作', width: 120, fixed: 'right' },
];

async function load() {
  loading.value = true;
  try {
    const data = await fetchMchAppsApi({
      pageNumber: query.pageNumber,
      pageSize: query.pageSize,
      productId: query.productId || undefined,
      productName: query.productName || undefined,
    });
    list.value = data.records ?? [];
    total.value = data.total ?? 0;
  } catch (error) {
    message.error(error instanceof Error ? error.message : '加载失败');
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  query.pageNumber = 1;
  load();
}

function onReset() {
  query.productId = undefined;
  query.productName = '';
  query.pageNumber = 1;
  load();
}

async function openPayTest(row: MchAppItem) {
  currentProduct.value = row;
  try {
    const info = await fetchMchInfoApi();
    mchNo.value = info?.mchInfo?.mchNo ?? '';
  } catch {
    mchNo.value = '';
  }
  payTestOpen.value = true;
}

async function submitPayTest(payload: { testOrderNo: string; amount: number }) {
  if (!currentProduct.value?.productId) {
    return { code: 1, msg: '请先选择要测试的支付产品' };
  }
  try {
    const data = await payTestPayOrdersApi({
      amount: Math.round(payload.amount * 100),
      mchOrderNo: payload.testOrderNo,
      productId: currentProduct.value.productId,
    });
    return { code: 0, data };
  } catch (error) {
    return {
      code: 1,
      msg: error instanceof Error ? error.message : String(error),
    };
  }
}

onMounted(load);
</script>

<template>
  <Page auto-content-height title="支付产品">
    <div class="ap-page-stack">
      <Card class="ap-page-filter">
        <Form class="ap-pay-order-filter" @finish="onSearch">
          <Row :gutter="[16, 16]">
            <Col :lg="4" :md="6" :sm="12" :span="24" :xl="4">
              <Form.Item>
                <InputNumber
                  v-model:value="query.productId"
                  :controls="false"
                  class="!w-full"
                  placeholder="产品编码"
                />
              </Form.Item>
            </Col>
            <Col :lg="4" :md="6" :sm="12" :span="24" :xl="4">
              <Form.Item>
                <Input
                  v-model:value="query.productName"
                  allow-clear
                  placeholder="产品名称"
                />
              </Form.Item>
            </Col>
            <Col :lg="4" :md="6" :sm="12" :span="24" :xl="4">
              <Form.Item class="ap-filter-actions">
                <FilterActions :loading="loading" @reset="onReset" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card>
        <Table
          :columns="columns"
          :data-source="list"
          :loading="loading"
          :pagination="{
            current: query.pageNumber,
            pageSize: query.pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
          }"
          row-key="productId"
          @change="
            (p) => {
              query.pageNumber = p.current ?? 1;
              query.pageSize = p.pageSize ?? 20;
              load();
            }
          "
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'productId'">
              <b class="text-primary">{{ String(record.productId ?? '') }}</b>
            </template>
            <template v-else-if="column.dataIndex === 'productName'">
              <Space>
                <AssetsIcon :filename="record.icon" :size="20" />
                <span>{{ record.productName || '—' }}</span>
              </Space>
            </template>
            <template v-else-if="column.dataIndex === 'mchRate'">
              {{ formatRateDecimal(record.mchRate) }}
            </template>
            <template v-else-if="column.dataIndex === 'state'">
              <Tag :color="record.state === 1 ? 'success' : 'default'">
                {{ record.state === 1 ? '启用' : '禁用' }}
              </Tag>
            </template>
            <template v-else-if="column.dataIndex === 'createdAt'">
              {{ formatDateTime(record.createdAt) }}
            </template>
            <template v-else-if="column.dataIndex === 'action'">
              <Button
                size="small"
                type="link"
                @click="openPayTest(record as MchAppItem)"
              >
                支付测试
              </Button>
            </template>
          </template>
        </Table>
      </Card>
    </div>

    <PayTestDrawer
      v-model:open="payTestOpen"
      :mch-no="mchNo"
      :product="currentProduct"
      :submit-request="submitPayTest"
    />
  </Page>
</template>

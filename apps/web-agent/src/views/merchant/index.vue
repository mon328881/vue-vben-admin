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
  Row,
  Table,
  Tag,
  message,
} from 'ant-design-vue';

import { fetchMchAgentListApi } from '#/api';
import type { MchAgentRow } from '#/api/types/business';
import FilterActions from '#/components/list/FilterActions.vue';
import { formatYuan } from '#/utils/format';

import MchProductRateDrawer from './components/MchProductRateDrawer.vue';

defineOptions({ name: 'AgentMerchantPage' });

const query = reactive({
  pageNumber: 1,
  pageSize: 20,
  mchNo: '',
  mchName: '',
});
const list = ref<MchAgentRow[]>([]);
const total = ref(0);
const loading = ref(false);
const rateDrawerRef = ref<InstanceType<typeof MchProductRateDrawer>>();

const columns: TableColumnsType<MchAgentRow> = [
  { dataIndex: 'mchNo', title: '商户号', width: 140 },
  { dataIndex: 'mchName', title: '商户名', ellipsis: true },
  { dataIndex: 'balance', title: '余额', width: 130 },
  { dataIndex: 'state', title: '状态', width: 100 },
  { dataIndex: 'todayAmount', title: '今日成交额', width: 140 },
  { dataIndex: 'action', title: '操作', width: 120, fixed: 'right' },
];

async function load() {
  loading.value = true;
  try {
    const data = await fetchMchAgentListApi({
      pageNumber: query.pageNumber,
      pageSize: query.pageSize,
      mchNo: query.mchNo || undefined,
      mchName: query.mchName || undefined,
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
  void load();
}

function onReset() {
  query.mchNo = '';
  query.mchName = '';
  query.pageNumber = 1;
  void load();
}

function openRateDrawer(row: MchAgentRow) {
  rateDrawerRef.value?.show(row);
}

onMounted(load);
</script>

<template>
  <Page auto-content-height title="商户列表">
    <div class="ap-page-stack">
      <Card class="ap-page-filter">
        <Form class="ap-pay-order-filter" @submit="onSearch">
          <Row :gutter="[16, 16]">
            <Col :lg="4" :md="8" :span="24" :xl="4">
              <Form.Item>
                <Input
                  v-model:value="query.mchNo"
                  allow-clear
                  placeholder="商户号"
                />
              </Form.Item>
            </Col>
            <Col :lg="4" :md="8" :span="24" :xl="4">
              <Form.Item>
                <Input
                  v-model:value="query.mchName"
                  allow-clear
                  placeholder="商户名"
                />
              </Form.Item>
            </Col>
            <Col :lg="16" :md="8" :span="24" :xl="16" class="ap-filter-actions">
              <FilterActions :loading="loading" @search="onSearch" @reset="onReset" />
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
          row-key="mchNo"
          :scroll="{ x: 900 }"
          @change="
            (p) => {
              query.pageNumber = p.current ?? 1;
              query.pageSize = p.pageSize ?? 20;
              load();
            }
          "
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'mchNo'">
              <b class="text-primary">{{ record.mchNo || '—' }}</b>
            </template>
            <template v-else-if="column.dataIndex === 'balance'">
              {{ formatYuan(record.balance) }}
            </template>
            <template v-else-if="column.dataIndex === 'state'">
              <Tag :color="record.state === 1 ? 'success' : 'default'">
                {{ record.state === 1 ? '启用' : '禁用' }}
              </Tag>
            </template>
            <template v-else-if="column.dataIndex === 'todayAmount'">
              {{ formatYuan(record.stat?.totalSuccessAmount) }}
            </template>
            <template v-else-if="column.dataIndex === 'action'">
              <Button
                size="small"
                type="link"
                @click="openRateDrawer(record as MchAgentRow)"
              >
                产品费率
              </Button>
            </template>
          </template>
        </Table>
      </Card>
    </div>

    <MchProductRateDrawer ref="rateDrawerRef" />
  </Page>
</template>

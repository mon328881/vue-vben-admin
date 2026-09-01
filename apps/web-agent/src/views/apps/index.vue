<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import {
  Card,
  Col,
  Form,
  Input,
  Row,
  Space,
  Table,
  Tag,
  message,
} from 'ant-design-vue';

import { fetchAgentPassageListApi } from '#/api';
import type { PassageRow } from '#/api/types/business';
import FilterActions from '#/components/list/FilterActions.vue';
import AssetsIcon from '#/components/payconfig/AssetsIcon.vue';
import { formatDateTime, formatRateDecimal } from '#/utils/format';

defineOptions({ name: 'AgentAppsPage' });

const query = reactive({
  pageNumber: 1,
  pageSize: 20,
  payPassageId: '',
  payPassageName: '',
});
const list = ref<PassageRow[]>([]);
const total = ref(0);
const loading = ref(false);

const columns: TableColumnsType<PassageRow> = [
  { dataIndex: 'payPassageId', title: '通道ID', width: 120 },
  { dataIndex: 'payPassageName', title: '通道名称', ellipsis: true },
  { dataIndex: 'agentRate', title: '代理费率', width: 120 },
  { dataIndex: 'state', title: '状态', width: 100 },
  { dataIndex: 'createdAt', title: '创建日期', width: 180 },
];

async function load() {
  loading.value = true;
  try {
    const data = await fetchAgentPassageListApi({
      pageNumber: query.pageNumber,
      pageSize: query.pageSize,
      payPassageId: query.payPassageId || undefined,
      payPassageName: query.payPassageName || undefined,
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
  query.payPassageId = '';
  query.payPassageName = '';
  query.pageNumber = 1;
  void load();
}

onMounted(load);
</script>

<template>
  <Page auto-content-height title="支付通道">
    <div class="ap-page-stack">
      <Card class="ap-page-filter">
        <Form class="ap-pay-order-filter" @submit="onSearch">
          <Row :gutter="[16, 16]">
            <Col :lg="4" :md="8" :span="24" :xl="4">
              <Form.Item>
                <Input
                  v-model:value="query.payPassageId"
                  allow-clear
                  placeholder="通道ID"
                />
              </Form.Item>
            </Col>
            <Col :lg="4" :md="8" :span="24" :xl="4">
              <Form.Item>
                <Input
                  v-model:value="query.payPassageName"
                  allow-clear
                  placeholder="通道名称"
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
          row-key="payPassageId"
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
            <template v-if="column.dataIndex === 'payPassageId'">
              <b class="text-primary">{{ String(record.payPassageId ?? '') }}</b>
            </template>
            <template v-else-if="column.dataIndex === 'payPassageName'">
              <Space>
                <AssetsIcon :filename="record.icon" :size="20" />
                <span>{{ record.payPassageName || '—' }}</span>
              </Space>
            </template>
            <template v-else-if="column.dataIndex === 'agentRate'">
              {{ formatRateDecimal(record.agentRate) }}
            </template>
            <template v-else-if="column.dataIndex === 'state'">
              <Tag :color="record.state === 1 ? 'success' : 'default'">
                {{ record.state === 1 ? '启用' : '禁用' }}
              </Tag>
            </template>
            <template v-else-if="column.dataIndex === 'createdAt'">
              {{ formatDateTime(record.createdAt) }}
            </template>
          </template>
        </Table>
      </Card>
    </div>
  </Page>
</template>

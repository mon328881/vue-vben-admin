<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { reactive, ref } from 'vue';

import {
  Button,
  Drawer,
  Form,
  InputNumber,
  Space,
  Table,
  Tag,
  message,
} from 'ant-design-vue';

import { fetchMchProductListApi } from '#/api';
import type { MchAgentRow, MchProductRate } from '#/api/types/business';
import AssetsIcon from '#/components/payconfig/AssetsIcon.vue';
import { formatRateDecimal } from '#/utils/format';

defineOptions({ name: 'MchProductRateDrawer' });

const visible = ref(false);
const loading = ref(false);
const mch = ref<Pick<MchAgentRow, 'mchNo' | 'mchName'>>({
  mchNo: '',
  mchName: '',
});
const list = ref<MchProductRate[]>([]);
const total = ref(0);
const query = reactive({
  pageNumber: 1,
  pageSize: 20,
  productId: undefined as number | undefined,
});

const columns: TableColumnsType<MchProductRate> = [
  { dataIndex: 'productId', title: '产品ID', width: 100 },
  { dataIndex: 'productName', title: '产品名称', ellipsis: true },
  { dataIndex: 'mchRate', title: '商户费率', width: 110 },
  { dataIndex: 'agentRate', title: '代理费率', width: 110 },
  { dataIndex: 'state', title: '状态', width: 90 },
];

async function load() {
  if (!mch.value.mchNo) return;
  loading.value = true;
  try {
    const data = await fetchMchProductListApi({
      mchNo: mch.value.mchNo,
      pageNumber: query.pageNumber,
      pageSize: query.pageSize,
      productId: query.productId || undefined,
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
  query.productId = undefined;
  query.pageNumber = 1;
  void load();
}

async function show(row: Pick<MchAgentRow, 'mchNo' | 'mchName'>) {
  mch.value = { mchNo: row.mchNo, mchName: row.mchName };
  query.productId = undefined;
  query.pageNumber = 1;
  visible.value = true;
  await load();
}

defineExpose({ show });
</script>

<template>
  <Drawer
    v-model:open="visible"
    title="商户产品费率"
    width="860"
    destroy-on-close
    :footer="false"
  >
    <div class="ap-drawer-body">
      <div class="ap-drawer-section ap-drawer-mch-info">
        <span>商户: </span>
        [<span class="text-primary font-semibold">{{ mch.mchNo || '--' }}</span>]
        <span class="text-muted-foreground ml-1 font-semibold">
          {{ mch.mchName || '--' }}
        </span>
      </div>

      <div class="ap-drawer-section">
        <Form layout="inline" class="ap-drawer-filter" @submit="onSearch">
          <Form.Item>
            <InputNumber
              v-model:value="query.productId"
              :controls="false"
              placeholder="产品编码"
              style="width: 160px"
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button html-type="submit" type="primary" :loading="loading">
                查询
              </Button>
              <Button @click="onReset">重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      <div class="ap-drawer-section ap-drawer-table-card">
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
          size="middle"
          @change="
            (p) => {
              query.pageNumber = p.current ?? 1;
              query.pageSize = p.pageSize ?? 20;
              load();
            }
          "
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'productName'">
              <Space>
                <AssetsIcon :filename="record.icon" :size="20" />
                <span>{{ record.productName || '—' }}</span>
              </Space>
            </template>
            <template v-else-if="column.dataIndex === 'mchRate'">
              {{ formatRateDecimal(record.mchRate) }}
            </template>
            <template v-else-if="column.dataIndex === 'agentRate'">
              {{ formatRateDecimal(record.agentRate) }}
            </template>
            <template v-else-if="column.dataIndex === 'state'">
              <Tag :color="record.state === 1 ? 'success' : 'default'">
                {{ record.state === 1 ? '启用' : '禁用' }}
              </Tag>
            </template>
          </template>
        </Table>
      </div>
    </div>
  </Drawer>
</template>

<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { reactive, ref } from 'vue';

import {
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Radio,
  Space,
  Table,
  Tag,
  message,
} from 'ant-design-vue';

import {
  fetchProductMchInfoApi,
  productMchBlindAllApi,
  productMchUnBlindAllApi,
  updateProductMchInfoApi,
  type PayWay,
  type ProductMchBind,
} from '#/api';
import { PRODUCT_RATE_RE } from '#/constants/payWays';
import { formatRateDecimal } from '#/utils/format';

const visible = ref(false);
const loading = ref(false);
const product = ref<Pick<PayWay, 'productId' | 'productName'> | null>(null);
const dataSource = ref<ProductMchBind[]>([]);
const total = ref(0);
const pagination = reactive({ current: 1, pageSize: 50 });
const query = reactive({
  productId: undefined as number | undefined,
  mchNo: '',
  mchName: '',
});

const editVisible = ref(false);
const editSaving = ref(false);
const editing = ref<ProductMchBind | null>(null);
const editForm = reactive({
  state: 1,
  mchRatePercent: '' as number | string,
  agentRatePercent: '' as number | string,
});

const columns: TableColumnsType<ProductMchBind> = [
  { dataIndex: 'merchant', title: '商户' },
  { dataIndex: 'agent', title: '上级代理', width: 140 },
  { dataIndex: 'state', title: '状态', width: 100 },
  { dataIndex: 'mchRate', title: '商户费率', width: 120 },
  { dataIndex: 'agentRate', title: '代理费率', width: 120 },
  { dataIndex: 'action', fixed: 'right', title: '操作', width: 100 },
];

async function loadData(resetPage = false) {
  if (!query.productId) return;
  if (resetPage) pagination.current = 1;
  loading.value = true;
  try {
    const page = await fetchProductMchInfoApi({
      ...query,
      pageNumber: pagination.current,
      pageSize: pagination.pageSize,
    });
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
  query.mchNo = '';
  query.mchName = '';
  void loadData(true);
}

function onTableChange(pag: { current?: number; pageSize?: number }) {
  pagination.current = pag.current ?? 1;
  pagination.pageSize = pag.pageSize ?? 50;
  void loadData();
}

async function confirmBlindAll() {
  if (!product.value?.productId) return;
  loading.value = true;
  try {
    await productMchBlindAllApi(product.value.productId);
    message.success('一键全绑定成功');
    onReset();
  } finally {
    loading.value = false;
  }
}

async function confirmUnBlindAll() {
  if (!product.value?.productId) return;
  loading.value = true;
  try {
    await productMchUnBlindAllApi(product.value.productId);
    message.success('一键全解绑成功');
    onReset();
  } finally {
    loading.value = false;
  }
}

function openEdit(row: ProductMchBind) {
  editing.value = row;
  editForm.state = row.state ?? 1;
  editForm.mchRatePercent =
    row.mchRate != null ? (Number(row.mchRate) * 100).toFixed(2) : '';
  editForm.agentRatePercent =
    row.agentRate != null ? (Number(row.agentRate) * 100).toFixed(2) : '';
  editVisible.value = true;
}

function parsePercent(raw: unknown, label: string) {
  const text = String(raw ?? '').trim();
  if (!text) {
    message.error(`${label}不能为空`);
    return null;
  }
  if (!PRODUCT_RATE_RE.test(text)) {
    message.error(`${label}格式错误，最多两位小数，可为负数`);
    return null;
  }
  const num = Number(text);
  if (Number.isNaN(num)) {
    message.error(`${label}格式错误`);
    return null;
  }
  return num / 100;
}

async function saveEdit() {
  const productId = product.value?.productId;
  if (!productId || !editing.value) return;
  const mchRate = parsePercent(editForm.mchRatePercent, '商户费率');
  if (mchRate === null) return;
  const agentRate = parsePercent(editForm.agentRatePercent, '代理费率');
  if (agentRate === null) return;
  editSaving.value = true;
  try {
    await updateProductMchInfoApi({
      productId,
      state: editForm.state,
      mchRate,
      agentRate,
      mchNo: editing.value.mchNo,
    });
    message.success('修改成功');
    editVisible.value = false;
    void loadData();
  } finally {
    editSaving.value = false;
  }
}

function show(row: Pick<PayWay, 'productId' | 'productName'>) {
  product.value = { ...row };
  query.productId = row.productId;
  query.mchNo = '';
  query.mchName = '';
  visible.value = true;
  void loadData(true);
}

defineExpose({ show });
</script>

<template>
  <Drawer
    v-model:open="visible"
    title="产品-商户配置"
    :width="1000"
    :destroy-on-close="true"
    :footer="false"
  >
    <div class="ap-drawer-body">
      <div class="ap-drawer-section ap-drawer-mch-info">
        <div class="ap-drawer-mch-block">
          <span class="ap-drawer-label">产品信息：</span>
          <span class="text-brand">[{{ product?.productId ?? '-' }}]</span>
          <span>{{ product?.productName ?? '-' }}</span>
        </div>
      </div>

      <div class="ap-drawer-section ap-drawer-filter">
        <Form layout="inline" @finish="onSearch">
          <Form.Item>
            <Input
              v-model:value="query.mchNo"
              allow-clear
              placeholder="商户号"
              style="width: 120px"
            />
          </Form.Item>
          <Form.Item>
            <Input
              v-model:value="query.mchName"
              allow-clear
              placeholder="商户名"
              style="width: 200px"
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

      <div class="ap-drawer-section ap-drawer-actions">
        <Popconfirm title="确认全部绑定么？" @confirm="confirmBlindAll">
          <Button type="primary" :loading="loading">一键全绑定</Button>
        </Popconfirm>
        <Popconfirm title="确认全部解绑么？" @confirm="confirmUnBlindAll">
          <Button danger :loading="loading">一键全解绑</Button>
        </Popconfirm>
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
          row-key="mchNo"
          size="small"
          @change="onTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'merchant'">
              <div class="text-brand">{{ record.mchNo }}</div>
              <div>{{ record.mchName || '--' }}</div>
            </template>
            <template v-else-if="column.dataIndex === 'agent'">
              <template v-if="record.agentNo">
                <div>{{ record.agentNo }}</div>
                <div>{{ record.agentName || '' }}</div>
              </template>
            </template>
            <template v-else-if="column.dataIndex === 'state'">
              <Tag :color="record.state === 1 ? 'success' : 'default'">
                {{ record.state === 1 ? '绑定' : '解绑' }}
              </Tag>
            </template>
            <template v-else-if="column.dataIndex === 'mchRate'">
              <b>{{ formatRateDecimal(record.mchRate) }}</b>
            </template>
            <template v-else-if="column.dataIndex === 'agentRate'">
              {{ formatRateDecimal(record.agentRate) }}
            </template>
            <template v-else-if="column.dataIndex === 'action'">
              <Button
                size="small"
                type="link"
                @click="openEdit(record as ProductMchBind)"
              >
                修改
              </Button>
            </template>
          </template>
        </Table>
      </div>
    </div>
  </Drawer>

  <Modal
    v-model:open="editVisible"
    title="产品费率配置"
    :confirm-loading="editSaving"
    ok-text="保存"
    cancel-text="取消"
    @ok="saveEdit"
  >
    <Form layout="vertical" :model="editForm">
      <Form.Item label="商户信息">
        <span>[{{ editing?.mchNo ?? '-' }}]</span>
        <span style="margin-left: 4px">{{ editing?.mchName ?? '-' }}</span>
      </Form.Item>
      <Form.Item label="产品信息">
        <span>[{{ product?.productId ?? '-' }}]</span>
        <span style="margin-left: 4px">{{ product?.productName ?? '-' }}</span>
      </Form.Item>
      <Form.Item label="绑定状态">
        <Radio.Group v-model:value="editForm.state">
          <Radio :value="1">绑定</Radio>
          <Radio :value="0">解绑</Radio>
        </Radio.Group>
      </Form.Item>
      <Form.Item label="商户费率(%)">
        <InputNumber
          v-model:value="editForm.mchRatePercent"
          :precision="2"
          :step="0.01"
          :min="-200"
          :max="200"
          placeholder="如：5.25，可为负数"
          style="width: 260px"
        />
      </Form.Item>
      <Form.Item label="代理费率(%)">
        <InputNumber
          v-model:value="editForm.agentRatePercent"
          :precision="2"
          :step="0.01"
          :min="-200"
          :max="200"
          placeholder="如：5.25，可为负数"
          style="width: 260px"
        />
      </Form.Item>
    </Form>
  </Modal>
</template>

<style scoped>
.text-brand {
  color: hsl(var(--primary));
}
</style>

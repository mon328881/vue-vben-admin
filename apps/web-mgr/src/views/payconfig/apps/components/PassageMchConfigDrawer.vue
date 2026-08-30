<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { nextTick, reactive, ref } from 'vue';

import {
  Button,
  Drawer,
  Form,
  Input,
  Modal,
  Popconfirm,
  Radio,
  Select,
  Space,
  Table,
  Tag,
  message,
} from 'ant-design-vue';

import {
  fetchPassageMchInfoApi,
  passageMchBatchSetApi,
  passageMchBlindAllApi,
  passageMchUnBlindAllApi,
  updatePassageMchInfoApi,
  type PassageMchBind,
  type PayPassage,
} from '#/api';
import { formatRateDecimal } from '#/utils/format';

const HAVE_AGENT_OPTIONS = [
  { value: '0', label: '无' },
  { value: '1', label: '有' },
];

const visible = ref(false);
const loading = ref(false);
const passage = ref<PayPassage | null>(null);
const dataSource = ref<PassageMchBind[]>([]);
const total = ref(0);
const pagination = reactive({ current: 1, pageSize: 20 });
const selectedIds = ref<(number | string)[]>([]);
const query = reactive({
  payPassageId: '' as number | string,
  mchNo: '',
  mchName: '',
  agentNo: '',
  haveAgent: undefined as string | undefined,
});

const batchVisible = ref(false);
const batchSaving = ref(false);
const batchState = ref(1);

const columns: TableColumnsType<PassageMchBind> = [
  { dataIndex: 'mch', title: '商户名称', width: 220 },
  { dataIndex: 'agent', title: '上级代理', width: 180 },
  { dataIndex: 'productRate', title: '产品费率', width: 110 },
  { dataIndex: 'state', title: '状态', width: 100 },
  { dataIndex: 'action', fixed: 'right', title: '操作', width: 120 },
];

async function loadData(resetPage = false) {
  if (!query.payPassageId) return;
  if (resetPage) pagination.current = 1;
  loading.value = true;
  try {
    const page = await fetchPassageMchInfoApi({
      ...query,
      haveAgent: query.haveAgent || undefined,
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
  selectedIds.value = [];
  void loadData(true);
}

function onReset() {
  query.mchNo = '';
  query.mchName = '';
  query.agentNo = '';
  query.haveAgent = undefined;
  selectedIds.value = [];
  void loadData(true);
}

async function bindRow(row: PassageMchBind, state: number) {
  if (!passage.value) return;
  await updatePassageMchInfoApi({
    payPassageId: Number(passage.value.payPassageId),
    mchNo: row.mchNo,
    state,
  });
  message.success(state === 1 ? '绑定成功' : '解绑成功');
  void loadData();
}

async function blindAll() {
  if (!passage.value) return;
  loading.value = true;
  try {
    await passageMchBlindAllApi(passage.value.payPassageId);
    message.success('一键全绑定成功');
    onReset();
  } finally {
    loading.value = false;
  }
}

async function unBlindAll() {
  if (!passage.value) return;
  loading.value = true;
  try {
    await passageMchUnBlindAllApi(passage.value.payPassageId);
    message.success('一键全解绑成功');
    onReset();
  } finally {
    loading.value = false;
  }
}

function openBatch() {
  if (!selectedIds.value.length) {
    message.error('请先勾选商户');
    return;
  }
  batchState.value = 1;
  batchVisible.value = true;
}

async function saveBatch() {
  if (!passage.value) return;
  batchSaving.value = true;
  try {
    await passageMchBatchSetApi(passage.value.payPassageId, {
      selectedIds: selectedIds.value.map(String),
      state: batchState.value,
    });
    message.success('操作成功');
    batchVisible.value = false;
    void loadData();
  } finally {
    batchSaving.value = false;
  }
}

function onTableChange(pag: { current?: number; pageSize?: number }) {
  pagination.current = pag.current ?? 1;
  pagination.pageSize = pag.pageSize ?? 20;
  void loadData();
}

function show(row: PayPassage) {
  passage.value = row;
  query.payPassageId = row.payPassageId;
  query.mchNo = '';
  query.mchName = '';
  query.agentNo = '';
  query.haveAgent = undefined;
  selectedIds.value = [];
  visible.value = true;
  void nextTick(() => loadData(true));
}

defineExpose({ show });
</script>

<template>
  <Drawer
    v-model:open="visible"
    title="通道-商户绑定"
    :width="1000"
    :footer="false"
    destroy-on-close
  >
    <div class="ap-drawer-body">
      <div class="ap-drawer-section ap-drawer-mch-info">
        <div class="ap-drawer-mch-block">
          <span class="ap-drawer-label">通道信息：</span>
          <span>[{{ passage?.payPassageId }}] {{ passage?.payPassageName }}</span>
        </div>
        <div class="ap-drawer-mch-block">
          <span class="ap-drawer-label">所属产品：</span>
          <span>[{{ passage?.productId }}] {{ passage?.productName || '' }}</span>
        </div>
      </div>

      <div class="ap-drawer-section ap-drawer-filter">
        <Form layout="inline" @finish="onSearch">
          <Form.Item>
            <Input v-model:value="query.mchNo" allow-clear placeholder="商户号" />
          </Form.Item>
          <Form.Item>
            <Input
              v-model:value="query.mchName"
              allow-clear
              placeholder="商户名称"
            />
          </Form.Item>
          <Form.Item>
            <Input
              v-model:value="query.agentNo"
              allow-clear
              placeholder="代理号"
            />
          </Form.Item>
          <Form.Item>
            <Select
              v-model:value="query.haveAgent"
              allow-clear
              placeholder="是否有代理"
              style="width: 120px"
              :options="HAVE_AGENT_OPTIONS"
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button html-type="submit" type="primary">查询</Button>
              <Button @click="onReset">重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      <div class="ap-drawer-section ap-drawer-actions">
        <Popconfirm title="确认一键全绑定？" @confirm="blindAll">
          <Button type="primary">一键全绑定</Button>
        </Popconfirm>
        <Popconfirm title="确认一键全解绑？" @confirm="unBlindAll">
          <Button danger>一键全解绑</Button>
        </Popconfirm>
        <Button @click="openBatch">批量设置</Button>
      </div>

      <div class="ap-drawer-table-card">
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
          :row-selection="{
            selectedRowKeys: selectedIds,
            onChange: (keys: (string | number)[]) => (selectedIds = keys),
          }"
          size="middle"
          :scroll="{ x: 800 }"
          @change="onTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'mch'">
              <div>
                <div>[{{ record.mchNo }}] {{ record.mchName || '' }}</div>
              </div>
            </template>
            <template v-else-if="column.dataIndex === 'agent'">
              {{
                record.agentNo
                  ? `[${record.agentNo}] ${record.agentName || ''}`
                  : '--'
              }}
            </template>
            <template v-else-if="column.dataIndex === 'productRate'">
              {{ formatRateDecimal(record.productRate) }}
            </template>
            <template v-else-if="column.dataIndex === 'state'">
              <Tag :color="record.state === 1 ? 'success' : 'default'">
                {{ record.state === 1 ? '已绑定' : '未绑定' }}
              </Tag>
            </template>
            <template v-else-if="column.dataIndex === 'action'">
              <Space>
                <Button
                  size="small"
                  type="link"
                  @click="bindRow(record as PassageMchBind, 1)"
                >
                  绑定
                </Button>
                <Button
                  danger
                  size="small"
                  type="link"
                  @click="bindRow(record as PassageMchBind, 0)"
                >
                  解绑
                </Button>
              </Space>
            </template>
          </template>
        </Table>
      </div>
    </div>

    <Modal
      v-model:open="batchVisible"
      title="批量设置绑定状态"
      :confirm-loading="batchSaving"
      @ok="saveBatch"
    >
      <Radio.Group v-model:value="batchState">
        <Radio :value="1">绑定</Radio>
        <Radio :value="0">解绑</Radio>
      </Radio.Group>
    </Modal>
  </Drawer>
</template>

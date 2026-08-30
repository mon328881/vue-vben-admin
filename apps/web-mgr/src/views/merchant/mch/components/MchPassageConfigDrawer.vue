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
  fetchMchPassageInfoApi,
  mchPassageBlindAllApi,
  mchPassageUnBlindAllApi,
  setMchPassageAllApi,
  updateMchPassageInfoApi,
} from '#/api';
import type { MchInfo, MchPassageInfo } from '#/api/types/business';
import { formatRateDecimal } from '#/utils/format';

const visible = ref(false);
const loading = ref(false);
const mch = ref<MchInfo | null>(null);
const dataSource = ref<MchPassageInfo[]>([]);
const total = ref(0);
const pagination = reactive({ current: 1, pageSize: 20 });
const selectedIds = ref<(number | string)[]>([]);
const query = reactive({
  mchNo: '',
  payPassageId: '',
  payPassageName: '',
  haveAgent: undefined as string | undefined,
});

const batchVisible = ref(false);
const batchSaving = ref(false);
const changeAllState = ref(1);

const columns: TableColumnsType<MchPassageInfo> = [
  { dataIndex: 'passage', title: '通道名称', width: 200 },
  { dataIndex: 'agent', title: '通道代理', width: 120 },
  { dataIndex: 'product', title: '产品名称', width: 140 },
  { dataIndex: 'state', title: '状态', width: 90 },
  { dataIndex: 'productRate', title: '产品费率', width: 100 },
  { dataIndex: 'rate', title: '通道费率', width: 100 },
  { dataIndex: 'action', fixed: 'right', title: '操作', width: 120 },
];

async function loadData(resetPage = false) {
  if (!query.mchNo) return;
  if (resetPage) pagination.current = 1;
  loading.value = true;
  try {
    const page = await fetchMchPassageInfoApi({
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
  query.payPassageId = '';
  query.payPassageName = '';
  query.haveAgent = undefined;
  selectedIds.value = [];
  void loadData(true);
}

async function confirmBlindAll() {
  if (!mch.value?.mchNo) return;
  loading.value = true;
  try {
    await mchPassageBlindAllApi(mch.value.mchNo);
    message.success('一键全绑定成功');
    onReset();
  } finally {
    loading.value = false;
  }
}

async function confirmUnBlindAll() {
  if (!mch.value?.mchNo) return;
  loading.value = true;
  try {
    await mchPassageUnBlindAllApi(mch.value.mchNo);
    message.success('一键全解绑成功');
    onReset();
  } finally {
    loading.value = false;
  }
}

async function bindRow(row: MchPassageInfo, state: number) {
  if (!mch.value?.mchNo) return;
  await updateMchPassageInfoApi({
    payPassageId: row.payPassageId,
    state,
    mchNo: mch.value.mchNo,
  });
  message.success(state === 1 ? '绑定成功' : '解绑成功');
  void loadData();
}

function openBatch() {
  if (!selectedIds.value.length) {
    message.error('请先勾选要配置的通道');
    return;
  }
  changeAllState.value = 1;
  batchVisible.value = true;
}

async function saveBatch() {
  if (!mch.value?.mchNo) return;
  batchSaving.value = true;
  try {
    await setMchPassageAllApi(mch.value.mchNo, {
      selectedIds: [...selectedIds.value],
      changeAllState: changeAllState.value,
    });
    message.success('操作成功');
    batchVisible.value = false;
    void loadData();
  } finally {
    batchSaving.value = false;
  }
}

function show(row: MchInfo) {
  mch.value = row;
  query.mchNo = row.mchNo;
  query.payPassageId = '';
  query.payPassageName = '';
  query.haveAgent = undefined;
  selectedIds.value = [];
  visible.value = true;
  nextTick(() => void loadData(true));
}

function onTableChange(pag: { current?: number; pageSize?: number }) {
  pagination.current = pag.current ?? 1;
  pagination.pageSize = pag.pageSize ?? 20;
  void loadData();
}

function onSelectChange(keys: (number | string)[]) {
  selectedIds.value = keys;
}

defineExpose({ show });
</script>

<template>
  <Drawer
    v-model:open="visible"
    title="商户-通道绑定"
    :width="1000"
    :footer="false"
    destroy-on-close
  >
    <div class="ap-drawer-body">
      <div class="ap-drawer-section ap-drawer-mch-info">
        <div class="ap-drawer-mch-block">
          <span class="ap-drawer-label">商户信息：</span>
          <span class="text-primary">[{{ mch?.mchNo ?? '-' }}]</span>
          <span>{{ mch?.mchName ?? '-' }}</span>
        </div>
        <div class="ap-drawer-mch-block">
          <span class="ap-drawer-label">商户代理：</span>
          <span>
            [{{ mch?.agentNo || '无' }}] {{ mch?.agentName || '无代理' }}
          </span>
        </div>
      </div>

      <div class="ap-drawer-section">
        <Form class="ap-drawer-filter" layout="inline" @finish="onSearch">
          <Form.Item>
            <Input
              v-model:value="query.payPassageId"
              allow-clear
              placeholder="通道ID"
              style="width: 140px"
            />
          </Form.Item>
          <Form.Item>
            <Input
              v-model:value="query.payPassageName"
              allow-clear
              placeholder="通道名"
              style="width: 160px"
            />
          </Form.Item>
          <Form.Item>
            <Select
              v-model:value="query.haveAgent"
              allow-clear
              placeholder="通道是否存在代理"
              style="width: 160px"
              :options="[
                { label: '是', value: '1' },
                { label: '否', value: '0' },
              ]"
            />
          </Form.Item>
          <Form.Item>
            <Space :size="12">
              <Button html-type="submit" type="primary" :loading="loading">
                查询
              </Button>
              <Button @click="onReset">重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      <div class="ap-drawer-section">
        <div class="ap-drawer-actions">
          <Popconfirm title="确认全部绑定么？" @confirm="confirmBlindAll">
            <Button type="primary" :loading="loading">一键全绑定</Button>
          </Popconfirm>
          <Popconfirm title="确认全部解绑么？" @confirm="confirmUnBlindAll">
            <Button danger :loading="loading">一键全解绑</Button>
          </Popconfirm>
          <Button @click="openBatch">批量配置</Button>
        </div>
      </div>

      <div class="ap-drawer-section ap-drawer-table-card">
        <Table
          :columns="columns"
          :data-source="dataSource"
          :loading="loading"
          :pagination="{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t: number) => `共 ${t} 条`,
          }"
          row-key="payPassageId"
          :row-selection="{
            selectedRowKeys: selectedIds,
            onChange: onSelectChange,
          }"
          size="middle"
          :scroll="{ x: 900 }"
          @change="onTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'passage'">
              <b class="text-primary">[{{ record.payPassageId }}]</b>
              {{ record.payPassageName }}
            </template>
            <template v-else-if="column.dataIndex === 'agent'">
              <template v-if="record.passageAgentNo">
                <div>{{ record.passageAgentNo }}</div>
                <div class="text-muted-foreground text-xs">
                  {{ record.passageAgentName }}
                </div>
              </template>
              <template v-else>-</template>
            </template>
            <template v-else-if="column.dataIndex === 'product'">
              <span class="text-primary">[{{ record.productId }}]</span>
              {{ record.productName }}
            </template>
            <template v-else-if="column.dataIndex === 'state'">
              <Tag :color="record.state === 1 ? 'success' : 'default'">
                {{ record.state === 1 ? '已绑定' : '未绑定' }}
              </Tag>
            </template>
            <template v-else-if="column.dataIndex === 'productRate'">
              <b>{{ formatRateDecimal(record.productRate) }}</b>
            </template>
            <template v-else-if="column.dataIndex === 'rate'">
              {{ formatRateDecimal(record.rate) }}
            </template>
            <template v-else-if="column.dataIndex === 'action'">
              <Space>
                <Button
                  size="small"
                  type="link"
                  @click="bindRow(record as MchPassageInfo, 1)"
                >
                  绑定
                </Button>
                <Button
                  size="small"
                  type="link"
                  danger
                  @click="bindRow(record as MchPassageInfo, 0)"
                >
                  解绑
                </Button>
              </Space>
            </template>
          </template>
        </Table>
      </div>
    </div>
  </Drawer>

  <Modal
    v-model:open="batchVisible"
    title="批量配置通道绑定"
    :confirm-loading="batchSaving"
    ok-text="确定"
    cancel-text="取消"
    @ok="saveBatch"
    @cancel="() => (changeAllState = 1)"
  >
    <Form layout="vertical">
      <Form.Item label="已选择通道">
        <b>{{ selectedIds.length }}</b>
      </Form.Item>
      <Form.Item label="状态">
        <Radio.Group v-model:value="changeAllState">
          <Radio :value="1">启用</Radio>
          <Radio :value="0">禁用</Radio>
        </Radio.Group>
      </Form.Item>
    </Form>
  </Modal>
</template>

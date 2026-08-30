<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { computed, nextTick, reactive, ref } from 'vue';

import {
  Button,
  Checkbox,
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
  Textarea,
  message,
} from 'ant-design-vue';

import {
  execMchProductRateCommandApi,
  fetchMchProductInfoApi,
  mchProductBlindAllApi,
  mchProductUnBlindAllApi,
  setMchProductAllRateApi,
  setMchProductBatchRateApi,
  updateMchProductInfoApi,
} from '#/api';
import type { MchInfo, MchProductInfo } from '#/api/types/business';
import { formatRateDecimal } from '#/utils/format';

const RATE_RE = /^-?\d+(?:\.\d{1,2})?$/;
const MCH_NO_RE = /(?:^|\s)M\d{10}(?:\s|$)/;

const visible = ref(false);
const loading = ref(false);
const mch = ref<MchInfo | null>(null);
const dataSource = ref<MchProductInfo[]>([]);
const total = ref(0);
const pagination = reactive({ current: 1, pageSize: 50 });
const selectedIds = ref<(number | string)[]>([]);
const query = reactive({
  mchNo: '',
  productId: '',
  productName: '',
});

const editVisible = ref(false);
const editSaving = ref(false);
const editing = ref<MchProductInfo | null>(null);
const editForm = reactive({
  state: 1,
  mchRatePercent: '' as number | string,
  agentRatePercent: '' as number | string,
});

const batchMode = ref<'all' | 'batch'>('batch');
const batchVisible = ref(false);
const batchSaving = ref(false);
const batchForm = reactive({
  changeAllState: '' as number | string,
  setEnableItem: [] as string[],
  setAllRate: '',
  setAllAgentRate: '',
  adjustEnableItem: [] as string[],
  setAllRateAdjust: '',
  setAllAgentRateAdjust: '',
});

const cmdVisible = ref(false);
const cmdSaving = ref(false);
const cmdText = ref('');
const cmdResult = ref('');

const batchTitle = computed(() =>
  batchMode.value === 'batch' ? '批量配置' : '全部设置',
);

const columns: TableColumnsType<MchProductInfo> = [
  { dataIndex: 'product', title: '支付产品', ellipsis: true },
  { dataIndex: 'state', title: '状态', width: 100 },
  { dataIndex: 'mchRate', title: '商户费率', width: 110 },
  { dataIndex: 'agentRate', title: '代理费率', width: 110 },
  { dataIndex: 'action', fixed: 'right', title: '操作', width: 80 },
];

async function loadData(resetPage = false) {
  if (!query.mchNo) return;
  if (resetPage) pagination.current = 1;
  loading.value = true;
  try {
    const page = await fetchMchProductInfoApi({
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
  selectedIds.value = [];
  void loadData(true);
}

function onReset() {
  query.productId = '';
  query.productName = '';
  selectedIds.value = [];
  void loadData(true);
}

async function confirmBlindAll() {
  if (!mch.value?.mchNo) return;
  loading.value = true;
  try {
    await mchProductBlindAllApi(mch.value.mchNo);
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
    await mchProductUnBlindAllApi(mch.value.mchNo);
    message.success('一键全解绑成功');
    onReset();
  } finally {
    loading.value = false;
  }
}

function openEdit(row: MchProductInfo) {
  editing.value = row;
  editForm.state = row.state ?? 1;
  editForm.mchRatePercent =
    row.mchRate != null ? Number((Number(row.mchRate) * 100).toFixed(2)) : '';
  editForm.agentRatePercent =
    row.agentRate != null
      ? Number((Number(row.agentRate) * 100).toFixed(2))
      : '';
  editVisible.value = true;
}

function parsePercent(raw: number | string, label: string) {
  const text = String(raw ?? '').trim();
  if (!text) {
    message.error(`${label}不能为空`);
    return null;
  }
  if (!RATE_RE.test(text)) {
    message.error(`${label}格式错误，最多两位小数，可为负数`);
    return null;
  }
  return Number(text) / 100;
}

async function saveEdit() {
  if (!mch.value?.mchNo || !editing.value) return;
  const mchRate = parsePercent(editForm.mchRatePercent, '商户费率');
  if (mchRate === null) return;
  const agentRate = parsePercent(editForm.agentRatePercent, '代理费率');
  if (agentRate === null) return;
  editSaving.value = true;
  try {
    await updateMchProductInfoApi({
      productId: editing.value.productId,
      state: editForm.state,
      mchRate,
      agentRate,
      mchNo: mch.value.mchNo,
    });
    message.success('修改成功');
    editVisible.value = false;
    void loadData();
  } finally {
    editSaving.value = false;
  }
}

function resetBatch() {
  batchForm.changeAllState = '';
  batchForm.setEnableItem = [];
  batchForm.setAllRate = '';
  batchForm.setAllAgentRate = '';
  batchForm.adjustEnableItem = [];
  batchForm.setAllRateAdjust = '';
  batchForm.setAllAgentRateAdjust = '';
}

function openBatch() {
  if (!selectedIds.value.length) {
    message.error('请先勾选要配置的产品');
    return;
  }
  batchMode.value = 'batch';
  resetBatch();
  batchVisible.value = true;
}

function openAll() {
  batchMode.value = 'all';
  resetBatch();
  batchVisible.value = true;
}

function validateRateField(raw: string, label: string) {
  const text = String(raw ?? '').trim();
  if (!text) return `${label}不能为空`;
  if (!RATE_RE.test(text)) return `${label}格式错误，最多两位小数`;
  const n = Number.parseFloat(text);
  if (n < -100 || n > 100) return `${label}范围应在 -100~100 之间`;
  return '';
}

function toRate(raw: string) {
  return Number((Number.parseFloat(String(raw).trim()) / 100).toFixed(4));
}

async function saveBatch() {
  if (!mch.value?.mchNo) return;
  const hasState = batchForm.changeAllState !== '';
  const hasSet = batchForm.setEnableItem.length > 0;
  const hasAdjust = batchForm.adjustEnableItem.length > 0;
  if (!hasState && !hasSet && !hasAdjust) {
    message.error('请至少选择一项操作');
    return;
  }
  const errors = [
    batchForm.setEnableItem.includes('1')
      ? validateRateField(batchForm.setAllRate, '商户费率设置')
      : '',
    batchForm.setEnableItem.includes('2')
      ? validateRateField(batchForm.setAllAgentRate, '代理费率设置')
      : '',
    batchForm.adjustEnableItem.includes('3')
      ? validateRateField(batchForm.setAllRateAdjust, '商户费率调整')
      : '',
    batchForm.adjustEnableItem.includes('4')
      ? validateRateField(batchForm.setAllAgentRateAdjust, '代理费率调整')
      : '',
  ].filter(Boolean);
  if (errors.length) {
    message.error(errors[0]);
    return;
  }
  const payload: Record<string, unknown> = {
    changeAllState: batchForm.changeAllState,
  };
  if (batchForm.setEnableItem.includes('1'))
    payload.setAllRate = toRate(batchForm.setAllRate);
  if (batchForm.setEnableItem.includes('2'))
    payload.setAllAgentRate = toRate(batchForm.setAllAgentRate);
  if (batchForm.adjustEnableItem.includes('3'))
    payload.setAllRateAdjust = toRate(batchForm.setAllRateAdjust);
  if (batchForm.adjustEnableItem.includes('4'))
    payload.setAllAgentRateAdjust = toRate(batchForm.setAllAgentRateAdjust);

  batchSaving.value = true;
  try {
    if (batchMode.value === 'batch') {
      await setMchProductBatchRateApi(mch.value.mchNo, {
        ...payload,
        selectedIds: [...selectedIds.value],
      });
    } else {
      await setMchProductAllRateApi(mch.value.mchNo, payload);
    }
    message.success('操作成功');
    batchVisible.value = false;
    void loadData();
  } finally {
    batchSaving.value = false;
  }
}

async function execCommand() {
  if (!mch.value?.mchNo) return;
  const command = cmdText.value.trim();
  if (!command) {
    message.warning('请输入命令');
    return;
  }
  if (MCH_NO_RE.test(command)) {
    cmdResult.value =
      '管理后台命令不支持填写商户号，请直接输入产品编码/费率，如：修改费率 1000/5.3';
    return;
  }
  cmdSaving.value = true;
  try {
    const data = await execMchProductRateCommandApi(mch.value.mchNo, command);
    cmdResult.value =
      data?.message ?? (data?.success ? '执行成功' : '执行失败');
    if (data?.success) void loadData();
  } finally {
    cmdSaving.value = false;
  }
}

function show(row: MchInfo) {
  mch.value = row;
  query.mchNo = row.mchNo;
  query.productId = '';
  query.productName = '';
  selectedIds.value = [];
  visible.value = true;
  nextTick(() => void loadData(true));
}

function onTableChange(pag: { current?: number; pageSize?: number }) {
  pagination.current = pag.current ?? 1;
  pagination.pageSize = pag.pageSize ?? 50;
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
    title="商户-产品配置"
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
              v-model:value="query.productId"
              allow-clear
              placeholder="产品ID"
              style="width: 140px"
            />
          </Form.Item>
          <Form.Item>
            <Input
              v-model:value="query.productName"
              allow-clear
              placeholder="产品名"
              style="width: 160px"
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
          <Button @click="openAll">全部设置</Button>
          <Button @click="openBatch">批量配置</Button>
          <Button
            @click="
              cmdVisible = true;
              cmdText = '';
              cmdResult = '';
            "
          >
            费率命令
          </Button>
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
          row-key="productId"
          :row-selection="{
            selectedRowKeys: selectedIds,
            onChange: onSelectChange,
          }"
          size="middle"
          :scroll="{ x: 700 }"
          @change="onTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'product'">
              <span class="text-primary">[{{ record.productId }}]</span>
              {{ record.productName?.trim() ?? '' }}
            </template>
            <template v-else-if="column.dataIndex === 'state'">
              <Tag :color="record.state === 1 ? 'success' : 'default'">
                {{ record.state === 1 ? '已绑定' : '未绑定' }}
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
                @click="openEdit(record as MchProductInfo)"
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
    title="支付产品配置"
    :confirm-loading="editSaving"
    ok-text="保存"
    cancel-text="取消"
    @ok="saveEdit"
  >
    <Form layout="vertical">
      <Form.Item label="商户信息">
        [{{ mch?.mchNo ?? '-' }}] {{ mch?.mchName ?? '-' }}
      </Form.Item>
      <Form.Item label="产品信息">
        [{{ editing?.productId ?? '-' }}] {{ editing?.productName ?? '-' }}
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
          :step="0.01"
          :precision="2"
          style="width: 200px"
          placeholder="请输入费率，如：5.25，可为负数"
        />
      </Form.Item>
      <Form.Item label="代理费率(%)">
        <InputNumber
          v-model:value="editForm.agentRatePercent"
          :step="0.01"
          :precision="2"
          style="width: 200px"
          placeholder="请输入费率，如：5.25，可为负数"
        />
      </Form.Item>
    </Form>
  </Modal>

  <Modal
    v-model:open="batchVisible"
    :title="batchTitle"
    :confirm-loading="batchSaving"
    ok-text="确定"
    cancel-text="取消"
    width="600px"
    @ok="saveBatch"
    @cancel="resetBatch"
  >
    <Form layout="vertical">
      <Form.Item label="状态设置">
        <Radio.Group v-model:value="batchForm.changeAllState">
          <Radio value="">不修改</Radio>
          <Radio :value="1">绑定</Radio>
          <Radio :value="0">解绑</Radio>
        </Radio.Group>
      </Form.Item>
      <Form.Item label="费率固定设置">
        <Checkbox.Group v-model:value="batchForm.setEnableItem">
          <Checkbox value="1">商户费率</Checkbox>
          <Checkbox value="2">代理费率</Checkbox>
        </Checkbox.Group>
        <p class="text-muted-foreground mt-1 text-xs">
          将选中产品的费率覆盖为固定值，范围 -100~100，最多两位小数
        </p>
      </Form.Item>
      <Form.Item
        v-if="batchForm.setEnableItem.includes('1')"
        label="商户费率设置(%)"
      >
        <Input
          v-model:value="batchForm.setAllRate"
          placeholder="如：5.25，可为负数"
          style="width: 260px"
        />
      </Form.Item>
      <Form.Item
        v-if="batchForm.setEnableItem.includes('2')"
        label="代理费率设置(%)"
      >
        <Input
          v-model:value="batchForm.setAllAgentRate"
          placeholder="如：5.25，可为负数"
          style="width: 260px"
        />
      </Form.Item>
      <Form.Item label="费率增量调整">
        <Checkbox.Group v-model:value="batchForm.adjustEnableItem">
          <Checkbox value="3">商户费率</Checkbox>
          <Checkbox value="4">代理费率</Checkbox>
        </Checkbox.Group>
        <p class="text-muted-foreground mt-1 text-xs">
          在现有费率基础上加减，正数上调，负数下调，范围 -100~100，最多两位小数
        </p>
      </Form.Item>
      <Form.Item
        v-if="batchForm.adjustEnableItem.includes('3')"
        label="商户费率调整(%)"
      >
        <Input
          v-model:value="batchForm.setAllRateAdjust"
          placeholder="如：1.25 或 -1.25"
          style="width: 260px"
        />
      </Form.Item>
      <Form.Item
        v-if="batchForm.adjustEnableItem.includes('4')"
        label="代理费率调整(%)"
      >
        <Input
          v-model:value="batchForm.setAllAgentRateAdjust"
          placeholder="如：1.25 或 -1.25"
          style="width: 260px"
        />
      </Form.Item>
    </Form>
  </Modal>

  <Modal
    v-model:open="cmdVisible"
    title="费率命令"
    width="640px"
    :footer="null"
    :mask-closable="false"
  >
    <div class="mb-3 space-y-1 text-sm">
      <p>
        <strong>设置费率</strong>：无绑定记录则新建并绑定，已有记录则设为绑定并更新费率；不存在的产品编码会跳过。
      </p>
      <p>
        <strong>修改费率</strong>：仅修改<strong>已绑定</strong>的产品费率；无记录或已解绑会跳过，需改用「设置费率」。
      </p>
      <p>
        格式示例：<code>修改费率 1000/5.3</code>、<code>设置费率 1000/5.3 1001/8.3</code>（费率如 5.3 表示 5.3%）。
      </p>
    </div>
    <Textarea
      v-model:value="cmdText"
      placeholder="请输入命令，如：修改费率 1000/5.3"
      :rows="4"
    />
    <Textarea
      v-if="cmdResult"
      v-model:value="cmdResult"
      class="mt-2"
      readonly
      :rows="3"
    />
    <div class="mt-3 flex justify-end gap-2">
      <Button @click="cmdVisible = false">关闭</Button>
      <Button type="primary" :loading="cmdSaving" @click="execCommand">
        执行
      </Button>
    </div>
  </Modal>
</template>

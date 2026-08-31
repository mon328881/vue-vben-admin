<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Radio,
  Select,
  Space,
  Switch,
  Table,
  Textarea,
  message,
} from 'ant-design-vue';

import {
  batchPayWayRateApi,
  deletePayWayApi,
  fetchPayWaysApi,
  fetchProductListShortApi,
  queryPayWayBatchRateKeyApi,
  updatePayWayApi,
  verifyPayWayBatchRateAuthApi,
  type PayWay,
} from '#/api';
import AssetsIcon from '#/components/payconfig/AssetsIcon.vue';
import {
  BATCH_RATE_ACTIONS,
  PRODUCT_STATE_OPTIONS,
  parseCommandRate,
  productPollMode,
  toProductRate,
  validateProductRate,
  type BatchRateAction,
} from '#/constants/payWays';
import { GOOGLE_CODE_ERROR, isGoogleCode } from '#/constants/merchant';
import { hasEnt } from '#/utils/access';
import { formatDateTime } from '#/utils/format';

import ProductFormDrawer from './components/ProductFormDrawer.vue';
import ProductMchConfigDrawer from './components/ProductMchConfigDrawer.vue';

defineOptions({ name: 'PayWayPage' });

const COMMAND_ERROR = '命令格式错误，请检查';
const COMMAND_TOKEN = /^([a-z0-9]+)\/(-?\d+(?:\.\d+)?)$/i;
const COMMAND_PLACEHOLDER =
  '例如：修改费率 1000/5.3 1001/8.3\n例如：设置费率 1000/5.3 1001/8.3';

const loading = ref(false);
const dataSource = ref<PayWay[]>([]);
const total = ref(0);
const pagination = reactive({ current: 1, pageSize: 20 });
const query = reactive({
  limitState: undefined as string | undefined,
  productId: '',
  productName: '',
  state: undefined as string | undefined,
});
const selectedIds = ref<(number | string)[]>([]);
const productCache = reactive<Record<string, PayWay>>({});
const stateBusy = ref<Record<string, boolean>>({});
const limitBusy = ref<Record<string, boolean>>({});

const formRef = ref<InstanceType<typeof ProductFormDrawer>>();
const mchRef = ref<InstanceType<typeof ProductMchConfigDrawer>>();

const canAdd = computed(() => hasEnt('ENT_PC_WAY_ADD'));
const canEdit = computed(() => hasEnt('ENT_PC_WAY_EDIT'));
const canDel = computed(() => hasEnt('ENT_PC_WAY_DEL'));

const batchFormVisible = ref(false);
const batchPreviewVisible = ref(false);
const googleVisible = ref(false);
const commandVisible = ref(false);
const googleSaving = ref(false);
const commandSaving = ref(false);
const batchSaving = ref(false);
const googleCode = ref('');
const commandText = ref('');
const pendingOpen = ref<'form' | 'command'>('form');

const batchForm = reactive({
  action: 'setMchRate' as BatchRateAction,
  bindIfAbsent: false,
  useUnifiedValue: false,
  unifiedValue: undefined as number | undefined,
  adjustValue: undefined as number | undefined,
});
const rateItems = ref<
  Array<{ productId: number; productName: string; rateValue?: string | number }>
>([]);
const previewSkipped = ref<
  Array<{
    productId: number;
    productName: string;
    previewValue: string;
    status: string;
  }>
>([]);
const previewSelectedIds = ref<string[]>([]);

const currentAction = computed(() =>
  BATCH_RATE_ACTIONS.find((item) => item.value === batchForm.action),
);
const isSetAction = computed(
  () =>
    batchForm.action === 'setMchRate' || batchForm.action === 'setAgentRate',
);
const bindLabel = computed(() =>
  batchForm.bindIfAbsent
    ? '将绑定并设置商户-产品费率'
    : '仅更新已绑定的商户-产品费率',
);
const rateModeLabel = computed(() =>
  batchForm.bindIfAbsent ? '设置费率' : '修改费率',
);
const rateModeDesc = computed(() =>
  batchForm.bindIfAbsent
    ? '为所有商户绑定并设置费率。'
    : '仅修改已绑定的商户-产品配置，未绑定配置的费率和绑定状态都不修改。',
);
const previewRows = computed(() => {
  const label = currentAction.value?.inputLabel ?? '费率';
  if (isSetAction.value) {
    return [
      ...rateItems.value.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        previewValue: `${label} = ${batchForm.useUnifiedValue ? batchForm.unifiedValue : item.rateValue}%`,
        status: 'normal',
      })),
      ...previewSkipped.value,
    ];
  }
  const sign =
    Number.parseFloat(String(batchForm.adjustValue ?? '')) >= 0 ? '+' : '';
  return [
    ...rateItems.value.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      previewValue: `${label}：当前值 ${sign}${batchForm.adjustValue}%`,
      status: 'normal',
    })),
    ...previewSkipped.value,
  ];
});
const previewBlocked = computed(
  () =>
    previewRows.value.some((row) => row.status === 'error') ||
    !previewSelectedIds.value.length,
);

const columns: TableColumnsType<PayWay> = [
  { dataIndex: 'productId', title: '产品编码', width: 150 },
  { dataIndex: 'productName', ellipsis: true, title: '产品名称' },
  { dataIndex: 'mode', title: '轮询模式', width: 150 },
  { dataIndex: 'state', title: '产品状态', width: 120 },
  { dataIndex: 'limitState', title: '成本限制状态', width: 140 },
  { dataIndex: 'createdAt', title: '创建时间', width: 180 },
  { dataIndex: 'action', fixed: 'right', title: '操作', width: 220 },
];

const rowSelection = computed(() =>
  canEdit.value
    ? {
        selectedRowKeys: selectedIds.value,
        onChange: (keys: (string | number)[]) => {
          selectedIds.value = keys;
        },
      }
    : undefined,
);

async function loadData(resetPage = false) {
  if (resetPage) pagination.current = 1;
  loading.value = true;
  try {
    const page = await fetchPayWaysApi({
      limitState: query.limitState,
      pageNumber: pagination.current,
      pageSize: pagination.pageSize,
      productId: query.productId || undefined,
      productName: query.productName || undefined,
      state: query.state,
    });
    const records = page?.records ?? [];
    dataSource.value = records;
    total.value = page?.total ?? 0;
    records.forEach((row) => {
      productCache[String(row.productId)] = row;
    });
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  void loadData(true);
}

function onReset() {
  query.productId = '';
  query.productName = '';
  query.state = undefined;
  query.limitState = undefined;
  selectedIds.value = [];
  void loadData(true);
}

function onTableChange(pag: { current?: number; pageSize?: number }) {
  pagination.current = pag.current ?? 1;
  pagination.pageSize = pag.pageSize ?? 20;
  void loadData();
}

function onFormSuccess(toFirstPage: boolean) {
  void loadData(toFirstPage);
}

async function toggleState(row: PayWay, checked: boolean | string | number) {
  const key = String(row.productId);
  const next = checked ? 1 : 0;
  const ok = await new Promise<boolean>((resolve) => {
    Modal.confirm({
      title: '二次确认',
      content: next === 1 ? '确认【启用】该产品？' : '确认【停用】该产品？',
      okText: '确认',
      cancelText: '取消',
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
  if (!ok) return;
  stateBusy.value[key] = true;
  try {
    await updatePayWayApi(row.productId, { state: next });
    row.state = next;
    message.success('操作成功');
  } finally {
    stateBusy.value[key] = false;
  }
}

async function toggleLimit(row: PayWay, checked: boolean | string | number) {
  const key = String(row.productId);
  const next = checked ? 1 : 0;
  const ok = await new Promise<boolean>((resolve) => {
    Modal.confirm({
      title: '二次确认',
      content:
        next === 1
          ? '此设置为防止费率配置错误，启用后允许拉起成本价高于收益的产品下通道，打开限制需谨慎！'
          : '停用后无法拉起成本价高于收益的产品下通道',
      okText: '确认',
      cancelText: '取消',
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
  if (!ok) return;
  limitBusy.value[key] = true;
  try {
    await updatePayWayApi(row.productId, { limitState: next });
    row.limitState = next;
    message.success('操作成功');
  } finally {
    limitBusy.value[key] = false;
  }
}

async function onDelete(row: PayWay) {
  await deletePayWayApi(row.productId);
  message.success('删除成功');
  void loadData();
}

function resetBatchForm() {
  batchForm.action = 'setMchRate';
  batchForm.bindIfAbsent = false;
  batchForm.useUnifiedValue = false;
  batchForm.unifiedValue = undefined;
  batchForm.adjustValue = undefined;
  rateItems.value = [];
  previewSkipped.value = [];
  previewSelectedIds.value = [];
  batchPreviewVisible.value = false;
}

function selectedRateItems() {
  return selectedIds.value.map((id) => {
    const productId = Number(id);
    const cached = productCache[String(id)];
    return {
      productId,
      productName: cached?.productName ?? '',
      rateValue: undefined as string | number | undefined,
    };
  });
}

function openBatchForm() {
  resetBatchForm();
  rateItems.value = selectedRateItems();
  previewSelectedIds.value = rateItems.value.map((item) =>
    String(item.productId),
  );
  batchFormVisible.value = true;
}

function openCommandDialog() {
  commandText.value = '';
  commandVisible.value = true;
}

async function ensureBatchAuth(next: 'form' | 'command') {
  pendingOpen.value = next;
  if (next === 'form' && !selectedIds.value.length) {
    message.error('请先勾选要批量设置费率的产品');
    return;
  }
  try {
    const key = await queryPayWayBatchRateKeyApi();
    if (Number(key) === 1) {
      next === 'command' ? openCommandDialog() : openBatchForm();
      return;
    }
  } catch {
    /* fall through to google */
  }
  googleCode.value = '';
  googleVisible.value = true;
}

async function submitGoogle() {
  if (!isGoogleCode(googleCode.value)) {
    message.error(GOOGLE_CODE_ERROR);
    return Promise.reject(new Error(GOOGLE_CODE_ERROR));
  }
  googleSaving.value = true;
  try {
    await verifyPayWayBatchRateAuthApi(Number(googleCode.value.trim()));
    message.success('验证通过');
    googleVisible.value = false;
    pendingOpen.value === 'command' ? openCommandDialog() : openBatchForm();
  } catch (err) {
    return Promise.reject(err);
  } finally {
    googleSaving.value = false;
  }
}

/** 对齐 mgr-web parseCommand — 勿改命令前缀与 token 规则 */
function parseCommand() {
  const text = commandText.value.trim();
  if (!text) return COMMAND_ERROR;
  batchForm.action = 'setMchRate';
  batchForm.useUnifiedValue = false;
  batchForm.unifiedValue = undefined;
  batchForm.adjustValue = undefined;
  rateItems.value = [];
  previewSelectedIds.value = [];
  previewSkipped.value = [];
  const hasSet = text.includes('设置费率');
  const hasEdit = text.includes('修改费率');
  if (hasSet && hasEdit) return COMMAND_ERROR;
  let rest = text;
  if (text.startsWith('设置费率')) {
    batchForm.bindIfAbsent = true;
    rest = rest.substring(4).trim();
  } else if (text.startsWith('修改费率')) {
    batchForm.bindIfAbsent = false;
    rest = rest.substring(4).trim();
  } else {
    return COMMAND_ERROR;
  }
  const tokens = rest.split(/\s+/).filter(Boolean);
  if (!tokens.length) return COMMAND_ERROR;
  const parsed: Array<{ productId: number; rateValue: string }> = [];
  const seen = new Set<string>();
  for (const token of tokens) {
    const match = COMMAND_TOKEN.exec(token);
    if (!match) return COMMAND_ERROR;
    const productIdText = match[1];
    if (!/^\d+$/.test(productIdText)) return COMMAND_ERROR;
    const productId = Number(productIdText);
    const { value: rate, error } = parseCommandRate(
      match[2],
      `产品${productId}商户费率`,
    );
    if (error || !rate) return COMMAND_ERROR;
    if (!seen.has(productIdText)) {
      seen.add(productIdText);
      parsed.push({ productId, rateValue: rate });
    }
  }
  const items: Array<{
    productId: number;
    productName: string;
    rateValue: string;
  }> = [];
  const skipped: Array<{
    productId: number;
    productName: string;
    previewValue: string;
    status: string;
  }> = [];
  for (const item of parsed) {
    const cached = productCache[String(item.productId)];
    if (!cached) {
      skipped.push({
        productId: item.productId,
        productName: '',
        previewValue: '产品编码未找到，跳过',
        status: 'warning',
      });
      continue;
    }
    items.push({
      productId: item.productId,
      productName: cached.productName ?? '',
      rateValue: item.rateValue,
    });
  }
  rateItems.value = items;
  previewSelectedIds.value = items.map((item) => String(item.productId));
  previewSkipped.value = skipped;
  return '';
}

async function previewCommand() {
  commandSaving.value = true;
  try {
    const [shorts] = await Promise.all([
      fetchProductListShortApi(),
      new Promise((resolve) => window.setTimeout(resolve, 1000)),
    ]);
    Object.keys(productCache).forEach((key) => {
      delete productCache[key];
    });
    (shorts ?? []).forEach((item) => {
      productCache[String(item.productId)] = {
        productId: item.productId,
        productName: item.productName ?? '',
        state: 1,
        limitState: 1,
      };
    });
    const error = parseCommand();
    if (error) {
      message.error(error);
      return Promise.reject(new Error(error));
    }
    batchPreviewVisible.value = true;
    // keep command dialog open under preview (align old mgr-web)
    return Promise.reject(new Error('preview'));
  } finally {
    commandSaving.value = false;
  }
}

function validateBatchForm() {
  const label = currentAction.value?.label ?? '批量费率操作';
  if (isSetAction.value) {
    if (batchForm.useUnifiedValue) {
      return validateProductRate(batchForm.unifiedValue, `${label}统一费率`);
    }
    for (const item of rateItems.value) {
      const name = item.productName
        ? `${item.productName}(${item.productId})`
        : `产品${item.productId}`;
      const error = validateProductRate(
        item.rateValue,
        `${name}${currentAction.value?.inputLabel ?? ''}`,
      );
      if (error) return error;
    }
    return '';
  }
  return validateProductRate(batchForm.adjustValue, `${label}调增值`);
}

function buildBatchPayload() {
  const payload: Record<string, unknown> = {
    selectedIds: [...previewSelectedIds.value],
    bindIfAbsent: batchForm.bindIfAbsent,
  };
  if (batchForm.action === 'setMchRate') {
    if (batchForm.useUnifiedValue) {
      payload.setAllRate = toProductRate(batchForm.unifiedValue);
    } else {
      payload.rateItems = rateItems.value.map((item) => ({
        productId: item.productId,
        setAllRate: toProductRate(item.rateValue),
      }));
    }
  } else if (batchForm.action === 'setAgentRate') {
    if (batchForm.useUnifiedValue) {
      payload.setAllAgentRate = toProductRate(batchForm.unifiedValue);
    } else {
      payload.rateItems = rateItems.value.map((item) => ({
        productId: item.productId,
        setAllAgentRate: toProductRate(item.rateValue),
      }));
    }
  } else if (batchForm.action === 'adjustMchRate') {
    payload.setAllRateAdjust = toProductRate(batchForm.adjustValue);
  } else {
    payload.setAllAgentRateAdjust = toProductRate(batchForm.adjustValue);
  }
  return payload;
}

function openBatchPreview() {
  const error = validateBatchForm();
  if (error) {
    message.error(error);
    return Promise.reject(new Error(error));
  }
  if (!previewSelectedIds.value.length) {
    const msg = '请先选中需要批量设置费率的产品';
    message.error(msg);
    return Promise.reject(new Error(msg));
  }
  batchPreviewVisible.value = true;
  // keep batch form open under preview (align old mgr-web)
  return Promise.reject(new Error('preview'));
}

async function submitBatchRate() {
  if (previewBlocked.value) {
    const msg = '当前预览存在错误或无可执行产品，请返回修改';
    message.error(msg);
    return Promise.reject(new Error(msg));
  }
  batchSaving.value = true;
  try {
    await batchPayWayRateApi(buildBatchPayload());
    message.success('批量设置费率成功');
    batchPreviewVisible.value = false;
    batchFormVisible.value = false;
    commandVisible.value = false;
    selectedIds.value = [];
    void loadData();
  } catch (err) {
    message.error(err instanceof Error ? err.message : '操作失败');
    return Promise.reject(err);
  } finally {
    batchSaving.value = false;
  }
}

onMounted(() => {
  void loadData(true);
});
</script>

<template>
  <Page auto-content-height title="支付产品">
    <div class="ap-page-stack">
      <Card class="ap-page-filter">
        <Form layout="inline" @finish="onSearch">
          <Form.Item>
            <Input
              v-model:value="query.productId"
              allow-clear
              placeholder="产品编码"
            />
          </Form.Item>
          <Form.Item>
            <Input
              v-model:value="query.productName"
              allow-clear
              placeholder="产品名称"
            />
          </Form.Item>
          <Form.Item>
            <Select
              v-model:value="query.state"
              allow-clear
              placeholder="产品状态"
              style="width: 140px"
              :options="PRODUCT_STATE_OPTIONS"
            />
          </Form.Item>
          <Form.Item>
            <Select
              v-model:value="query.limitState"
              allow-clear
              placeholder="成本限制状态"
              style="width: 140px"
              :options="PRODUCT_STATE_OPTIONS"
            />
          </Form.Item>
          <Form.Item class="ap-filter-actions">
            <Space>
              <Button html-type="submit" type="primary">查询</Button>
              <Button @click="onReset">重置</Button>
            </Space>
          </Form.Item>
        </Form>
        <div class="mt-3 flex flex-wrap items-center gap-2">
          <Button v-if="canAdd" type="primary" @click="formRef?.show()">
            新建
          </Button>
          <Button v-if="canEdit" @click="ensureBatchAuth('form')">
            批量设置费率
          </Button>
          <Button v-if="canEdit" @click="ensureBatchAuth('command')">
            粘贴命令修改
          </Button>
          <span
            v-if="selectedIds.length"
            class="text-sm text-muted-foreground"
          >
            当前已选择 {{ selectedIds.length }} 个产品
          </span>
        </div>
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
          :row-selection="rowSelection"
          row-key="productId"
          size="middle"
          @change="onTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'productName'">
              <div class="product-name-cell">
                <AssetsIcon :filename="record.icon" :size="20" />
                <span :title="record.productName">
                  {{ record.productName || '--' }}
                </span>
              </div>
            </template>
            <template v-else-if="column.dataIndex === 'mode'">
              {{ productPollMode(record.mode).label }}
            </template>
            <template v-else-if="column.dataIndex === 'state'">
              <Switch
                :checked="record.state === 1"
                :loading="!!stateBusy[String(record.productId)]"
                :disabled="!canEdit"
                checked-children="启用"
                un-checked-children="禁用"
                @change="(c) => toggleState(record as PayWay, c)"
              />
            </template>
            <template v-else-if="column.dataIndex === 'limitState'">
              <Switch
                :checked="record.limitState === 1"
                :loading="!!limitBusy[String(record.productId)]"
                :disabled="!canEdit"
                checked-children="启用"
                un-checked-children="禁用"
                @change="(c) => toggleLimit(record as PayWay, c)"
              />
            </template>
            <template v-else-if="column.dataIndex === 'createdAt'">
              {{ formatDateTime(record.createdAt) }}
            </template>
            <template v-else-if="column.dataIndex === 'action'">
              <Space>
                <Button
                  v-if="canEdit"
                  size="small"
                  type="link"
                  @click="formRef?.show(record.productId, record as PayWay)"
                >
                  修改
                </Button>
                <Button
                  v-if="canEdit"
                  size="small"
                  type="link"
                  @click="
                    mchRef?.show({
                      productId: record.productId,
                      productName: record.productName,
                    })
                  "
                >
                  费率配置
                </Button>
                <Popconfirm
                  v-if="canDel"
                  :title="`确定删除产品「${record.productName || record.productId}」（${record.productId}）？删除后不可恢复。`"
                  @confirm="onDelete(record as PayWay)"
                >
                  <Button danger size="small" type="link">删除</Button>
                </Popconfirm>
              </Space>
            </template>
          </template>
        </Table>
      </Card>

      <ProductFormDrawer ref="formRef" @success="onFormSuccess" />
      <ProductMchConfigDrawer ref="mchRef" />

      <Modal
        v-model:open="googleVisible"
        title="安全验证"
        :confirm-loading="googleSaving"
        ok-text="验证"
        cancel-text="取消"
        @ok="submitGoogle"
      >
        <Alert
          type="warning"
          show-icon
          class="mb-3"
          message="批量修改费率属于高危敏感操作。首次操作需要谷歌验证，通过后 1 小时内重复操作无需再次验证。"
        />
        <Input
          v-model:value="googleCode"
          placeholder="请输入谷歌验证码"
          :maxlength="6"
          @update:value="
            (v) => (googleCode = String(v ?? '').replace(/\D/g, '').slice(0, 6))
          "
        />
      </Modal>

      <Modal
        v-model:open="commandVisible"
        title="粘贴命令修改费率"
        :confirm-loading="commandSaving"
        ok-text="预览结果"
        cancel-text="取消"
        width="720px"
        destroy-on-close
        @ok="previewCommand"
        @cancel="commandText = ''"
      >
        <Alert
          type="warning"
          show-icon
          class="mb-3"
          message="支持与机器人一致的命令格式。设置费率会绑定并设置；修改费率仅修改已绑定配置。"
        />
        <Textarea
          v-model:value="commandText"
          :placeholder="COMMAND_PLACEHOLDER"
          :auto-size="{ minRows: 5, maxRows: 10 }"
        />
        <p class="mt-2 text-sm text-muted-foreground">
          <span class="block">设置费率：为所有商户绑定并设置费率。</span>
          <span class="block">
            修改费率：仅更新已绑定商户-产品的费率，未绑定配置不修改。
          </span>
        </p>
      </Modal>

      <Modal
        v-model:open="batchFormVisible"
        title="支付产品费率批量设置"
        ok-text="确定"
        cancel-text="取消"
        width="860px"
        destroy-on-close
        @ok="openBatchPreview"
        @cancel="resetBatchForm"
      >
        <Alert
          type="warning"
          show-icon
          class="mb-3"
          :message="`将对已选 ${rateItems.length} 个支付产品执行批量费率操作，请确认操作类型和影响范围。`"
        />
        <Form layout="vertical" :model="batchForm">
          <Form.Item label="操作类型">
            <Radio.Group v-model:value="batchForm.action" class="batch-rate-action-group">
              <Radio.Button
                v-for="item in BATCH_RATE_ACTIONS"
                :key="item.value"
                :value="item.value"
              >
                {{ item.label }}
              </Radio.Button>
            </Radio.Group>
            <p class="mt-1 text-sm text-muted-foreground">
              {{ currentAction?.description }}
            </p>
          </Form.Item>
          <Form.Item label="费率方式">
            <Radio.Group v-model:value="batchForm.bindIfAbsent">
              <Radio :value="false">修改费率</Radio>
              <Radio :value="true">设置费率</Radio>
            </Radio.Group>
            <p class="mt-1 text-sm text-muted-foreground">{{ rateModeDesc }}</p>
          </Form.Item>
          <template v-if="isSetAction">
            <Form.Item label="统一费率">
              <div class="flex items-center gap-3">
                <Switch v-model:checked="batchForm.useUnifiedValue" />
                <InputNumber
                  v-show="batchForm.useUnifiedValue"
                  v-model:value="batchForm.unifiedValue"
                  :precision="2"
                  :step="0.01"
                  :min="-100"
                  :max="100"
                  placeholder="如：5.25，可为负数"
                  style="width: 260px"
                />
              </div>
              <p class="mt-1 text-sm text-muted-foreground">
                开启后为全部已选产品设置相同费率，范围 -100 到 100，最多两位小数。
              </p>
            </Form.Item>
            <div class="batch-rate-product-table">
              <div
                v-for="item in rateItems"
                :key="item.productId"
                class="batch-rate-product-table__row"
              >
                <div class="batch-rate-product-table__product">
                  <span class="text-brand">[{{ item.productId }}]</span>
                  <span class="cell-ellipsis" :title="item.productName">
                    {{ item.productName || '--' }}
                  </span>
                </div>
                <InputNumber
                  v-model:value="item.rateValue"
                  :precision="2"
                  :step="0.01"
                  :min="-100"
                  :max="100"
                  :disabled="batchForm.useUnifiedValue"
                  placeholder="如：5.25,最多两位小数"
                  style="width: 260px"
                />
              </div>
            </div>
          </template>
          <Form.Item
            v-else
            :label="`${currentAction?.inputLabel ?? '费率调增值'}(%)`"
          >
            <InputNumber
              v-model:value="batchForm.adjustValue"
              :precision="2"
              :step="0.01"
              :min="-100"
              :max="100"
              placeholder="如：1.25 或 -1.25"
              style="width: 260px"
            />
            <p class="mt-1 text-sm text-muted-foreground">
              正数上调，负数下调；未勾选同时绑定时，仅应用到已绑定的商户-产品配置。
            </p>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        v-model:open="batchPreviewVisible"
        title="批量费率结果预览"
        :confirm-loading="batchSaving"
        :ok-button-props="{
          danger: true,
          disabled: previewBlocked,
        }"
        ok-text="确认修改"
        cancel-text="返回修改"
        width="780px"
        @ok="submitBatchRate"
      >
        <Alert
          type="warning"
          show-icon
          class="mb-3"
          message="请确认以下最终操作结果。确认后将批量写入商户-产品费率配置。"
        />
        <div class="batch-rate-preview-summary">
          <div>
            <span>操作类型：</span>
            <b>{{ rateModeLabel }}</b>
          </div>
          <div>
            <span>产品数量：</span>
            <b>{{ rateItems.length }} 个</b>
          </div>
          <div>
            <span>绑定范围：</span>
            <b>{{ bindLabel }}</b>
          </div>
        </div>
        <div class="batch-rate-preview-table">
          <div class="batch-rate-preview-table__head">
            <span>支付产品</span>
            <span>最终操作结果</span>
          </div>
          <div
            v-for="item in previewRows"
            :key="item.productId"
            class="batch-rate-preview-table__row"
          >
            <div class="batch-rate-product-table__product">
              <span class="text-brand">[{{ item.productId }}]</span>
              <span class="cell-ellipsis" :title="item.productName">
                {{ item.productName || '--' }}
              </span>
            </div>
            <b
              :class="{
                'text-danger': item.status === 'error',
                'text-warning': item.status === 'warning',
              }"
            >
              {{ item.previewValue }}
            </b>
          </div>
        </div>
      </Modal>
    </div>
  </Page>
</template>

<style scoped>
.product-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.product-name-cell > span,
.cell-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.batch-rate-action-group {
  display: flex;
  flex-wrap: wrap;
}

.batch-rate-product-table {
  max-height: 340px;
  overflow: auto;
  margin-top: 8px;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
}

.batch-rate-product-table__row {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) 280px;
  column-gap: 8px;
  align-items: center;
  padding: 8px 12px;
}

.batch-rate-product-table__row + .batch-rate-product-table__row {
  border-top: 1px solid hsl(var(--border));
}

.batch-rate-product-table__product {
  display: flex;
  gap: 6px;
  align-items: center;
  min-width: 0;
}

.batch-rate-preview-summary {
  display: grid;
  row-gap: 4px;
  margin-bottom: 12px;
}

.batch-rate-preview-table {
  max-height: 360px;
  overflow: auto;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
}

.batch-rate-preview-table__head,
.batch-rate-preview-table__row {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) 260px;
  column-gap: 8px;
  align-items: center;
  padding: 8px 12px;
}

.batch-rate-preview-table__head {
  position: sticky;
  top: 0;
  z-index: 1;
  font-weight: 500;
  color: hsl(var(--muted-foreground));
  background: hsl(var(--background));
  border-bottom: 1px solid hsl(var(--border));
}

.batch-rate-preview-table__row + .batch-rate-preview-table__row {
  border-top: 1px solid hsl(var(--border));
}

.text-brand {
  color: hsl(var(--primary));
}

.text-danger {
  color: hsl(var(--destructive));
}

.text-warning {
  color: #e37318;
}
</style>

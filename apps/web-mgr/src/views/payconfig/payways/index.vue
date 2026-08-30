<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import {
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
  message,
} from 'ant-design-vue';

import {
  batchPayWayRateApi,
  deletePayWayApi,
  fetchPayWaysApi,
  queryPayWayBatchRateKeyApi,
  updatePayWayApi,
  verifyPayWayBatchRateAuthApi,
  type PayWay,
} from '#/api';
import AssetsIcon from '#/components/payconfig/AssetsIcon.vue';
import {
  BATCH_RATE_ACTIONS,
  PRODUCT_STATE_OPTIONS,
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
const stateBusy = ref<Record<string, boolean>>({});
const limitBusy = ref<Record<string, boolean>>({});

const formRef = ref<InstanceType<typeof ProductFormDrawer>>();
const mchRef = ref<InstanceType<typeof ProductMchConfigDrawer>>();

const canAdd = computed(() => hasEnt('ENT_PC_WAY_ADD'));
const canEdit = computed(() => hasEnt('ENT_PC_WAY_EDIT'));
const canDel = computed(() => hasEnt('ENT_PC_WAY_DEL'));

const batchVisible = ref(false);
const batchSaving = ref(false);
const googleVisible = ref(false);
const googleSaving = ref(false);
const googleCode = ref('');
const batchForm = reactive({
  action: 'setMchRate' as BatchRateAction,
  bindIfAbsent: false,
  rateValue: undefined as number | undefined,
});

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

async function ensureBatchAuth() {
  if (!selectedIds.value.length) {
    message.error('请先勾选要批量设置费率的产品');
    return;
  }
  try {
    const key = await queryPayWayBatchRateKeyApi();
    if (Number(key) === 1) {
      openBatchForm();
      return;
    }
  } catch {
    /* fall through */
  }
  googleCode.value = '';
  googleVisible.value = true;
}

function openBatchForm() {
  batchForm.action = 'setMchRate';
  batchForm.bindIfAbsent = false;
  batchForm.rateValue = undefined;
  batchVisible.value = true;
}

async function submitGoogle() {
  if (!isGoogleCode(googleCode.value)) {
    message.error(GOOGLE_CODE_ERROR);
    return;
  }
  googleSaving.value = true;
  try {
    await verifyPayWayBatchRateAuthApi(Number(googleCode.value.trim()));
    message.success('验证通过');
    googleVisible.value = false;
    openBatchForm();
  } finally {
    googleSaving.value = false;
  }
}

async function submitBatchRate() {
  const label =
    BATCH_RATE_ACTIONS.find((i) => i.value === batchForm.action)?.inputLabel ??
    '费率';
  const error = validateProductRate(batchForm.rateValue, label);
  if (error) {
    message.error(error);
    return;
  }
  const payload: Record<string, unknown> = {
    selectedIds: selectedIds.value.map(String),
    bindIfAbsent: batchForm.bindIfAbsent,
  };
  const rate = toProductRate(batchForm.rateValue);
  if (batchForm.action === 'setMchRate') payload.setAllRate = rate;
  else if (batchForm.action === 'setAgentRate') payload.setAllAgentRate = rate;
  else if (batchForm.action === 'adjustMchRate')
    payload.setAllRateAdjust = rate;
  else payload.setAllAgentRateAdjust = rate;

  batchSaving.value = true;
  try {
    await batchPayWayRateApi(payload);
    message.success('批量设置费率成功');
    batchVisible.value = false;
    selectedIds.value = [];
    void loadData();
  } catch (err) {
    message.error(err instanceof Error ? err.message : '操作失败');
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
      <div class="mt-3 flex flex-wrap gap-2">
        <Button v-if="canAdd" type="primary" @click="formRef?.show()">
          新建
        </Button>
        <Button v-if="canEdit" @click="ensureBatchAuth">批量设置费率</Button>
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
      <p class="mb-3 text-sm text-muted-foreground">
        批量修改费率属于高危敏感操作。首次操作需要谷歌验证，通过后 1
        小时内重复操作无需再次验证。
      </p>
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
      v-model:open="batchVisible"
      title="支付产品费率批量设置"
      :confirm-loading="batchSaving"
      ok-text="确定"
      cancel-text="取消"
      width="640px"
      @ok="submitBatchRate"
    >
      <Form layout="vertical" :model="batchForm">
        <Form.Item label="操作类型">
          <Radio.Group v-model:value="batchForm.action">
            <Radio.Button
              v-for="item in BATCH_RATE_ACTIONS"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </Radio.Button>
          </Radio.Group>
        </Form.Item>
        <Form.Item label="费率方式">
          <Radio.Group v-model:value="batchForm.bindIfAbsent">
            <Radio :value="false">修改费率</Radio>
            <Radio :value="true">设置费率</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          :label="`${BATCH_RATE_ACTIONS.find((i) => i.value === batchForm.action)?.inputLabel ?? '费率'}(%)`"
        >
          <InputNumber
            v-model:value="batchForm.rateValue"
            :precision="2"
            :step="0.01"
            :min="-100"
            :max="100"
            placeholder="如：5.25，可为负数"
            style="width: 260px"
          />
        </Form.Item>
        <p class="text-sm text-muted-foreground">
          将对已选 {{ selectedIds.length }} 个支付产品执行批量费率操作。
        </p>
      </Form>
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

.product-name-cell > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

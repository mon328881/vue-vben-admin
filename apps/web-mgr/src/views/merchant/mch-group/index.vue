<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from 'ant-design-vue';

import {
  deleteMchGroupApi,
  fetchMchGroupListApi,
  settleMchGroupApi,
  updateMchGroupApi,
  type MchGroupInfo,
} from '#/api';
import {
  MCH_GROUP_SETTLE_MODES,
  settleModeLabel,
  settleModeTagColor,
} from '#/constants/merchant';
import { hasEnt } from '#/utils/access';
import { formatYuan } from '#/utils/format';

import MchGroupFormDrawer from './components/MchGroupFormDrawer.vue';

defineOptions({ name: 'MchGroupListPage' });

const loading = ref(false);
const dataSource = ref<MchGroupInfo[]>([]);
const total = ref(0);
const pagination = reactive({ current: 1, pageSize: 20 });
const query = reactive({
  mchGroupName: '',
  state: undefined as number | undefined,
  isAutoSettle: undefined as number | undefined,
});
const stateBusy = ref<Record<string, boolean>>({});
const settlingName = ref('');

const formRef = ref<InstanceType<typeof MchGroupFormDrawer>>();

const canAdd = computed(() => hasEnt('ENT_MCH_INFO_ADD'));
const canEdit = computed(() => hasEnt('ENT_MCH_INFO_EDIT'));
const canDel = computed(() => hasEnt('ENT_MCH_INFO_DEL'));

const columns: TableColumnsType = [
  {
    dataIndex: 'mchGroupName',
    ellipsis: true,
    title: '商户分组名称',
    width: 160,
  },
  { dataIndex: 'totalPrepaid', title: '总预付', width: 120 },
  { dataIndex: 'totalBalance', title: '总余额', width: 120 },
  { dataIndex: 'settleDiff', title: '[总预付-总余额]差额', width: 200 },
  { dataIndex: 'state', title: '状态', width: 110 },
  { dataIndex: 'mchCount', title: '商户数量', width: 90 },
  { dataIndex: 'isAutoSettle', title: '自动结算模式', width: 120 },
  { dataIndex: 'autoSettleTime', title: '结算时间', width: 100 },
  { dataIndex: 'action', fixed: 'right', title: '操作', width: 140 },
];

function settleDiffValue(row: MchGroupInfo) {
  if (row.settleDiff != null) return Number(row.settleDiff);
  return Number(row.totalPrepaid ?? 0) - Number(row.totalBalance ?? 0);
}

async function loadData(resetPage = false) {
  if (resetPage) pagination.current = 1;
  loading.value = true;
  try {
    const page = await fetchMchGroupListApi({
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
  query.mchGroupName = '';
  query.state = undefined;
  query.isAutoSettle = undefined;
  void loadData(true);
}

function onTableChange(pag: { current?: number; pageSize?: number }) {
  pagination.current = pag.current ?? 1;
  pagination.pageSize = pag.pageSize ?? 20;
  void loadData();
}

async function onStateChange(
  row: MchGroupInfo,
  checked: boolean | string | number,
) {
  if (!canEdit.value) return;
  const next = checked ? 1 : 0;
  const ok = await new Promise<boolean>((resolve) => {
    Modal.confirm({
      title: '二次确认',
      content:
        next === 1
          ? '确认启用该商户分组？启用后可在商户设置中选择，并按本组自动结算配置执行。'
          : '确认停用该商户分组？停用后不会出现在商户分组下拉，也不会执行本组自动结算；已有商户不会自动解绑。',
      okText: '确认',
      cancelText: '取消',
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
  if (!ok) return;
  const name = row.mchGroupName;
  stateBusy.value[name] = true;
  try {
    await updateMchGroupApi(name, { state: next });
    row.state = next;
    message.success('状态修改成功');
  } catch (error) {
    message.error(error instanceof Error ? error.message : '状态修改失败');
  } finally {
    stateBusy.value[name] = false;
  }
}

async function confirmSettle(row: MchGroupInfo) {
  if (Number(row.settleMchCount ?? 0) <= 0) {
    message.warning('当前分组没有可结算商户');
    return;
  }
  settlingName.value = row.mchGroupName;
  try {
    const data = await settleMchGroupApi(row.mchGroupName);
    message.success(`结算完成，成功 ${data?.settledCount ?? 0} 个`);
    void loadData();
  } catch (error) {
    message.error(error instanceof Error ? error.message : '结算失败');
  } finally {
    settlingName.value = '';
  }
}

async function onDelete(row: MchGroupInfo) {
  await deleteMchGroupApi(row.mchGroupName);
  message.success('删除成功');
  void loadData(true);
}

function onFormSuccess(toFirstPage: boolean) {
  void loadData(toFirstPage);
}

onMounted(() => {
  void loadData(true);
});
</script>

<template>
  <Page auto-content-height title="商户分组">
    <div class="ap-page-stack">
      <Card class="ap-page-filter">
        <Form layout="inline" @finish="onSearch">
          <Form.Item>
            <Input
              v-model:value="query.mchGroupName"
              allow-clear
              placeholder="商户分组名称"
            />
          </Form.Item>
          <Form.Item>
            <Select
              v-model:value="query.state"
              allow-clear
              placeholder="分组状态"
              style="width: 120px"
              :options="[
                { label: '停用', value: 0 },
                { label: '启用', value: 1 },
              ]"
            />
          </Form.Item>
          <Form.Item>
            <Select
              v-model:value="query.isAutoSettle"
              allow-clear
              placeholder="自动结算模式"
              style="width: 140px"
              :options="MCH_GROUP_SETTLE_MODES"
            />
          </Form.Item>
          <Form.Item class="ap-filter-actions">
            <Space>
              <Button html-type="submit" type="primary">查询</Button>
              <Button @click="onReset">重置</Button>
            </Space>
          </Form.Item>
        </Form>
        <div class="ap-page-toolbar">
          <Button v-if="canAdd" type="primary" @click="formRef?.showCreate()">
            新建
          </Button>
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
          row-key="mchGroupName"
          :scroll="{ x: 1300 }"
          size="middle"
          @change="onTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'totalPrepaid'">
              {{ formatYuan(record.totalPrepaid as number) }}
            </template>
            <template v-else-if="column.dataIndex === 'totalBalance'">
              {{ formatYuan(record.totalBalance as number) }}
            </template>
            <template v-else-if="column.dataIndex === 'settleDiff'">
              <div class="inline-action-cell">
                <Popconfirm
                  v-if="
                    canEdit && Number(record.settleMchCount ?? 0) > 0
                  "
                  title="结算将清空该分组下所有商户余额，并从各商户预付中扣除，确认结算吗？"
                  @confirm="confirmSettle(record as MchGroupInfo)"
                >
                  <Button
                    size="small"
                    type="primary"
                    class="inline-action-cell__action"
                    :loading="settlingName === record.mchGroupName"
                    :disabled="!!settlingName"
                  >
                    结算
                  </Button>
                </Popconfirm>
                <span
                  class="inline-action-cell__value"
                  :class="
                    settleDiffValue(record as MchGroupInfo) < 0
                      ? 'amount-negative'
                      : settleDiffValue(record as MchGroupInfo) > 0
                        ? 'amount-positive'
                        : ''
                  "
                >
                  {{ formatYuan(settleDiffValue(record as MchGroupInfo)) }}
                </span>
              </div>
            </template>
            <template v-else-if="column.dataIndex === 'state'">
              <Switch
                :checked="record.state === 1"
                :loading="!!stateBusy[String(record.mchGroupName)]"
                :disabled="!canEdit"
                checked-children="启用"
                un-checked-children="停用"
                @change="(c) => onStateChange(record as MchGroupInfo, c)"
              />
            </template>
            <template v-else-if="column.dataIndex === 'isAutoSettle'">
              <Tag :color="settleModeTagColor(record.isAutoSettle as number)">
                {{ settleModeLabel(record.isAutoSettle as number) }}
              </Tag>
            </template>
            <template v-else-if="column.dataIndex === 'autoSettleTime'">
              {{
                record.isAutoSettle === 1 && record.autoSettleTime
                  ? record.autoSettleTime
                  : '--'
              }}
            </template>
            <template v-else-if="column.dataIndex === 'action'">
              <Space>
                <Button
                  v-if="canEdit"
                  size="small"
                  type="link"
                  @click="formRef?.showEdit(record as MchGroupInfo)"
                >
                  修改
                </Button>
                <Popconfirm
                  v-if="canDel"
                  :title="`确定删除商户分组「${record.mchGroupName}」？删除后，该分组下所有商户将自动重置为未分组，且操作不可恢复。`"
                  @confirm="onDelete(record as MchGroupInfo)"
                >
                  <Button danger size="small" type="link">删除</Button>
                </Popconfirm>
              </Space>
            </template>
          </template>
        </Table>
      </Card>
    </div>

    <MchGroupFormDrawer ref="formRef" @success="onFormSuccess" />
  </Page>
</template>

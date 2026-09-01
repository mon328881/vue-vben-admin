<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import {
  Button,
  Card,
  Form,
  Input,
  Popconfirm,
  Select,
  Table,
  Tag,
  message,
} from 'ant-design-vue';

import {
  deleteIsvInfoApi,
  fetchAgentStatInfoApi,
  fetchIsvListApi,
  type AgentStatInfo,
} from '#/api';
import type { AgentInfo } from '#/api/types/business';
import FilterActions from '#/components/list/FilterActions.vue';
import ListStatCards, {
  type ListStatCardItem,
} from '#/components/list/ListStatCards.vue';
import { hasEnt } from '#/utils/access';
import { formatDateTime, formatYuan } from '#/utils/format';

import AgentBalanceAdjustDialog from './components/AgentBalanceAdjustDialog.vue';
import AgentFormDrawer from './components/AgentFormDrawer.vue';

defineOptions({ name: 'IsvListPage' });

const loading = ref(false);
const dataSource = ref<AgentInfo[]>([]);
const total = ref(0);
const pagination = reactive({ current: 1, pageSize: 20 });
const query = reactive({
  agentName: '',
  agentNo: '',
  state: undefined as string | undefined,
});
const stat = ref<AgentStatInfo>({
  agentNum: 0,
  totalBalance: 0,
  freezeBalance: 0,
});

const formRef = ref<InstanceType<typeof AgentFormDrawer>>();
const balanceRef = ref<InstanceType<typeof AgentBalanceAdjustDialog>>();

const canAdd = computed(() => hasEnt('ENT_ISV_INFO_ADD'));
const canEdit = computed(() => hasEnt('ENT_ISV_INFO_EDIT'));
const canDel = computed(() => hasEnt('ENT_ISV_INFO_DEL'));

const listStatItems = computed<ListStatCardItem[]>(() => [
  {
    title: '代理总数',
    value: Number(stat.value.agentNum ?? 0),
    icon: 'lucide:users',
  },
  {
    title: '代理总余额',
    value: Number(stat.value.totalBalance ?? 0) / 100,
    decimals: 2,
    prefix: '¥',
    icon: 'lucide:wallet',
  },
  {
    title: '冻结金额汇总',
    value: Number(stat.value.freezeBalance ?? 0) / 100,
    decimals: 2,
    prefix: '¥',
    icon: 'lucide:lock',
  },
]);

const columns: TableColumnsType<AgentInfo> = [
  {
    dataIndex: 'agentName',
    ellipsis: true,
    fixed: 'left',
    title: '代理商名称',
    width: 200,
  },
  { dataIndex: 'agentNo', title: '代理商户号', width: 150 },
  { dataIndex: 'balance', title: '代理余额', width: 220 },
  { dataIndex: 'state', title: '状态', width: 100 },
  { dataIndex: 'createdAt', title: '创建日期', width: 180 },
  { dataIndex: 'updatedAt', title: '修改日期', width: 180 },
  { dataIndex: 'remark', ellipsis: true, title: '备注' },
  { dataIndex: 'action', fixed: 'right', title: '操作', width: 160 },
];

async function loadStat() {
  try {
    const data = await fetchAgentStatInfoApi({ ...query });
    if (data) stat.value = data;
  } catch {
    // 统计失败不阻断列表
  }
}

async function loadData(resetPage = false) {
  if (resetPage) pagination.current = 1;
  loading.value = true;
  try {
    void loadStat();
    const page = await fetchIsvListApi({
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
  query.agentNo = '';
  query.agentName = '';
  query.state = undefined;
  void loadData(true);
}

function onTableChange(pag: { current?: number; pageSize?: number }) {
  pagination.current = pag.current ?? 1;
  pagination.pageSize = pag.pageSize ?? 20;
  void loadData();
}

function onFormSuccess() {
  void loadData(true);
}

async function onDelete(row: AgentInfo) {
  await deleteIsvInfoApi(row.agentNo);
  message.success('删除成功');
  void loadData(true);
}

onMounted(() => {
  void loadData(true);
});
</script>

<template>
  <Page auto-content-height title="代理商列表">
    <div class="ap-page-stack">
      <Card class="ap-page-filter">
      <Form layout="inline" @submit="onSearch">
        <Form.Item>
          <Input
            v-model:value="query.agentNo"
            allow-clear
            placeholder="代理商户号"
          />
        </Form.Item>
        <Form.Item>
          <Input
            v-model:value="query.agentName"
            allow-clear
            placeholder="代理商名称"
          />
        </Form.Item>
        <Form.Item>
          <Select
            v-model:value="query.state"
            allow-clear
            placeholder="状态"
            style="width: 120px"
            :options="[
              { label: '禁用', value: '0' },
              { label: '启用', value: '1' },
            ]"
          />
        </Form.Item>
        <Form.Item class="ap-filter-actions">
          <FilterActions @search="onSearch" @reset="onReset" />
        </Form.Item>
      </Form>
    </Card>

    <ListStatCards :items="listStatItems" />

    <Card>
      <div class="ap-table-toolbar">
        <Button v-if="canAdd" type="primary" @click="formRef?.show()">
          新建
        </Button>
      </div>
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
        row-key="agentNo"
        size="middle"
        @change="onTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'balance'">
            <div class="inline-action-cell">
              <Button
                v-if="canEdit"
                size="small"
                type="primary"
                class="inline-action-cell__action"
                @click="balanceRef?.show(record as AgentInfo)"
              >
                调额
              </Button>
              <b
                class="inline-action-cell__value"
                :class="
                  (record.balance ?? 0) > 0
                    ? 'amount-positive'
                    : 'amount-negative'
                "
              >
                {{ formatYuan(record.balance) }}
              </b>
            </div>
          </template>
          <template v-else-if="column.dataIndex === 'state'">
            <Tag :color="record.state === 1 ? 'success' : 'default'">
              {{ record.state === 1 ? '启用' : '禁用' }}
            </Tag>
          </template>
          <template v-else-if="column.dataIndex === 'createdAt'">
            {{ formatDateTime(record.createdAt) }}
          </template>
          <template v-else-if="column.dataIndex === 'updatedAt'">
            {{ formatDateTime(record.updatedAt) }}
          </template>
          <template v-else-if="column.dataIndex === 'action'">
              <div class="ap-table-ops">
                <Button
                  v-if="canEdit"
                  size="small"
                  type="link"
                  class="ap-table-ops__link"
                  @click="formRef?.show(record.agentNo)"
                >
                  修改
                </Button>
                <Popconfirm
                  v-if="canDel"
                  title="确认删除？"
                  description="请确认该代理商下未分配商户。"
                  @confirm="onDelete(record as AgentInfo)"
                >
                  <Button
                    danger
                    size="small"
                    type="link"
                    class="ap-table-ops__link"
                  >
                    删除
                  </Button>
                </Popconfirm>
              </div>
            </template>
        </template>
      </Table>
    </Card>

    <AgentFormDrawer ref="formRef" @success="onFormSuccess" />
    <AgentBalanceAdjustDialog ref="balanceRef" @success="onFormSuccess" />
    </div>
  </Page>
</template>

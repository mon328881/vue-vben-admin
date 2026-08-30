<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
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
      <Form layout="inline" @finish="onSearch">
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
          <Space>
            <Button html-type="submit" type="primary">查询</Button>
            <Button @click="onReset">重置</Button>
          </Space>
        </Form.Item>
      </Form>
      <div class="mt-3">
        <Button v-if="canAdd" type="primary" @click="formRef?.show()">
          新建
        </Button>
      </div>
    </Card>

    <Row :gutter="[12, 12]" class="ap-page-stats">
      <Col :md="8" :span="24">
        <Card size="small">
          <Statistic title="代理总数" :value="stat.agentNum ?? 0" />
        </Card>
      </Col>
      <Col :md="8" :span="24">
        <Card size="small">
          <Statistic
            title="代理总余额"
            :value="formatYuan(stat.totalBalance)"
          />
        </Card>
      </Col>
      <Col :md="8" :span="24">
        <Card size="small">
          <Statistic
            title="冻结金额汇总"
            :value="formatYuan(stat.freezeBalance)"
          />
        </Card>
      </Col>
    </Row>

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
        row-key="agentNo"
        size="middle"
        @change="onTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'balance'">
            <Space>
              <Button
                v-if="canEdit"
                size="small"
                type="primary"
                @click="balanceRef?.show(record as AgentInfo)"
              >
                调额
              </Button>
              <b
                :class="
                  (record.balance ?? 0) > 0 ? 'text-success' : 'text-error'
                "
              >
                {{ formatYuan(record.balance) }}
              </b>
            </Space>
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
            <Space>
              <Button
                v-if="canEdit"
                size="small"
                type="link"
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
                <Button danger size="small" type="link">删除</Button>
              </Popconfirm>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <AgentFormDrawer ref="formRef" @success="onFormSuccess" />
    <AgentBalanceAdjustDialog ref="balanceRef" @success="onFormSuccess" />
    </div>
  </Page>
</template>

<style scoped>
.text-success {
  color: #52c41a;
}
.text-error {
  color: #ff4d4f;
}
</style>

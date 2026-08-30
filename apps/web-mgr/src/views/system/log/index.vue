<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import {
  Button,
  Card,
  Descriptions,
  Drawer,
  Form,
  Input,
  RangePicker,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';

import { fetchSysLogDetailApi, fetchSysLogListApi } from '#/api';
import type { SysLog } from '#/api/modules/system';
import { defaultTodayRange } from '#/utils/date-range';
import { formatDateTime } from '#/utils/format';

defineOptions({ name: 'SysLogPage' });

const SYS_TYPE_MAP: Record<string, string> = {
  MGR: '运营平台',
  MCH: '商户',
  AGENT: '代理',
  ROBOT: '机器人',
};

const loading = ref(false);
const dataSource = ref<SysLog[]>([]);
const total = ref(0);
const pagination = reactive({ current: 1, pageSize: 20 });
const dateRange = ref<[string, string] | undefined>(defaultTodayRange());
const query = reactive({
  loginUsername: '',
  methodRemark: '',
});
const detailOpen = ref(false);
const detailLoading = ref(false);
const detail = ref<SysLog | null>(null);

const columns: TableColumnsType = [
  { dataIndex: 'loginUsername', fixed: 'left', title: '用户名', width: 140 },
  { dataIndex: 'userIp', title: '用户 IP', width: 140 },
  { dataIndex: 'sysType', title: '所属系统', width: 110 },
  { dataIndex: 'methodRemark', ellipsis: true, title: '操作描述', width: 260 },
  { dataIndex: 'createdAt', title: '创建日期', width: 170 },
  { dataIndex: 'action', fixed: 'right', title: '操作', width: 80 },
];

function sysTypeLabel(value?: string) {
  if (!value) return '-';
  return SYS_TYPE_MAP[value] ?? value;
}

function buildParams() {
  const [createdStart, createdEnd] = dateRange.value ?? [];
  return {
    ...query,
    createdStart,
    createdEnd,
    pageNumber: pagination.current,
    pageSize: pagination.pageSize,
  };
}

async function loadData(resetPage = false) {
  if (resetPage) pagination.current = 1;
  loading.value = true;
  try {
    const page = await fetchSysLogListApi(buildParams());
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
  query.loginUsername = '';
  query.methodRemark = '';
  dateRange.value = defaultTodayRange();
  void loadData(true);
}

function onTableChange(pag: { current?: number; pageSize?: number }) {
  pagination.current = pag.current ?? 1;
  pagination.pageSize = pag.pageSize ?? 20;
  void loadData();
}

async function openDetail(row: SysLog) {
  detailOpen.value = true;
  detailLoading.value = true;
  try {
    detail.value = await fetchSysLogDetailApi(row.sysLogId);
  } catch {
    detail.value = row;
  } finally {
    detailLoading.value = false;
  }
}

onMounted(() => {
  void loadData(true);
});
</script>

<template>
  <Page auto-content-height title="系统日志">
    <div class="ap-page-stack">
      <Card class="ap-page-filter">
      <Form layout="inline" @finish="onSearch">
        <Form.Item>
          <RangePicker
            v-model:value="dateRange"
            show-time
            value-format="YYYY-MM-DD HH:mm:ss"
            :placeholder="['开始时间', '结束时间']"
          />
        </Form.Item>
        <Form.Item>
          <Input
            v-model:value="query.loginUsername"
            allow-clear
            placeholder="用户登录名"
          />
        </Form.Item>
        <Form.Item>
          <Input
            v-model:value="query.methodRemark"
            allow-clear
            placeholder="操作描述"
          />
        </Form.Item>
        <Form.Item class="ap-filter-actions">
          <Space>
            <Button html-type="submit" type="primary">查询</Button>
            <Button @click="onReset">重置</Button>
          </Space>
        </Form.Item>
      </Form>
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
        row-key="sysLogId"
        :scroll="{ x: 1000 }"
        size="middle"
        @change="onTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'sysType'">
            <Tag>{{ sysTypeLabel(record.sysType) }}</Tag>
          </template>
          <template v-else-if="column.dataIndex === 'createdAt'">
            {{ formatDateTime(record.createdAt) }}
          </template>
          <template v-else-if="column.dataIndex === 'action'">
            <Button
              size="small"
              type="link"
              @click="openDetail(record as SysLog)"
            >
              详情
            </Button>
          </template>
        </template>
      </Table>
    </Card>

    <Drawer
      v-model:open="detailOpen"
      title="日志详情"
      width="560"
      :loading="detailLoading"
    >
      <Descriptions v-if="detail" :column="1" bordered size="small">
        <Descriptions.Item label="用户名">
          {{ detail.loginUsername }}
        </Descriptions.Item>
        <Descriptions.Item label="用户 IP">
          {{ detail.userIp || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="所属系统">
          {{ sysTypeLabel(detail.sysType) }}
        </Descriptions.Item>
        <Descriptions.Item label="操作描述">
          {{ detail.methodRemark || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="方法名">
          {{ detail.methodName || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="请求地址">
          {{ detail.reqUrl || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="请求参数">
          {{ detail.optReqParam || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="响应信息">
          {{ detail.optResInfo || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="创建日期">
          {{ formatDateTime(detail.createdAt) }}
        </Descriptions.Item>
      </Descriptions>
    </Drawer>
    </div>
  </Page>
</template>

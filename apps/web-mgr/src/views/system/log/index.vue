<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import {
  Button,
  Card,
  Descriptions,
  Divider,
  Drawer,
  Form,
  Input,
  RangePicker,
  Table,
  Tag,
  message,
} from 'ant-design-vue';

import { fetchSysLogDetailApi, fetchSysLogListApi } from '#/api';
import FilterActions from '#/components/list/FilterActions.vue';
import LogDisplayField from '#/components/system/LogDisplayField.vue';
import type { SysLog } from '#/api/modules/system';
import { defaultTodayRange } from '#/utils/date-range';
import { formatDateTime } from '#/utils/format';

defineOptions({ name: 'SysLogPage' });

const SYS_TYPE_LABEL: Record<string, string> = {
  MGR: '运营平台',
  MCH: '商户系统',
  AGENT: '代理系统',
  ROBOT: '机器人',
};

function sysTypeLabel(value?: string) {
  if (!value) return '—';
  return SYS_TYPE_LABEL[value] ?? '其他';
}

function sysTypeColor(value?: string) {
  switch (value) {
    case 'MGR':
      return 'success';
    case 'MCH':
    case 'AGENT':
      return 'processing';
    case 'ROBOT':
      return 'warning';
    default:
      return 'default';
  }
}

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
  { dataIndex: 'sysType', title: '所属系统', width: 120 },
  { dataIndex: 'methodRemark', ellipsis: true, title: '操作描述', width: 300 },
  { dataIndex: 'createdAt', title: '创建日期', width: 180 },
  { dataIndex: 'action', fixed: 'right', title: '操作', width: 100, align: 'center' },
];

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

function closeDetail() {
  detailOpen.value = false;
  detail.value = null;
}

async function openDetail(row: SysLog) {
  detailOpen.value = true;
  detailLoading.value = true;
  detail.value = null;
  try {
    detail.value = await fetchSysLogDetailApi(row.sysLogId);
  } catch {
    message.error('加载日志详情失败');
    closeDetail();
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
        <Form layout="inline" @submit="onSearch">
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
            <FilterActions submit-text="搜索" @search="onSearch" @reset="onReset" />
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
          :scroll="{ x: 1100 }"
          size="middle"
          @change="onTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'loginUsername'">
              <b>{{ record.loginUsername || '—' }}</b>
            </template>
            <template v-else-if="column.dataIndex === 'sysType'">
              <Tag :color="sysTypeColor(record.sysType as string)">
                {{ sysTypeLabel(record.sysType as string) }}
              </Tag>
            </template>
            <template v-else-if="column.dataIndex === 'createdAt'">
              {{ formatDateTime(record.createdAt as string) }}
            </template>
            <template v-else-if="column.dataIndex === 'action'">
              <Button
                size="small"
                type="link"
                @click="openDetail(record as SysLog)"
              >
                日志详情
              </Button>
            </template>
          </template>
        </Table>
      </Card>

      <Drawer
        v-model:open="detailOpen"
        title="日志详情"
        width="40%"
        destroy-on-close
        :loading="detailLoading"
        @close="closeDetail"
      >
        <div v-if="detail" class="sys-log-detail">
          <Descriptions :column="2" size="small" layout="vertical" bordered>
            <Descriptions.Item label="用户登录名">
              {{ detail.loginUsername || '—' }}
            </Descriptions.Item>
            <Descriptions.Item label="用户 IP">
              {{ detail.userIp || '—' }}
            </Descriptions.Item>
            <Descriptions.Item label="所属系统" :span="2">
              <Tag :color="sysTypeColor(detail.sysType)">
                {{ sysTypeLabel(detail.sysType) }}
              </Tag>
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          <Descriptions :column="1" size="small" layout="vertical" bordered>
            <Descriptions.Item label="操作描述">
              {{ detail.methodRemark || '—' }}
            </Descriptions.Item>
            <Descriptions.Item label="请求方法">
              {{ detail.methodName || '—' }}
            </Descriptions.Item>
            <Descriptions.Item label="请求地址">
              {{ detail.reqUrl || '—' }}
            </Descriptions.Item>
          </Descriptions>

          <Form.Item label="请求参数" class="sys-log-detail__field">
            <LogDisplayField
              :value="detail.optReqParam"
              :min-rows="4"
              :max-rows="12"
            />
          </Form.Item>
          <Form.Item label="响应参数" class="sys-log-detail__field">
            <LogDisplayField
              :value="detail.optResInfo"
              :min-rows="6"
              :max-rows="16"
            />
          </Form.Item>
        </div>
      </Drawer>
    </div>
  </Page>
</template>

<style scoped>
.sys-log-detail__field {
  margin-top: 12px;
  margin-bottom: 0;
}

.sys-log-detail__field :deep(.ant-form-item-label) {
  padding-bottom: 6px;
}
</style>

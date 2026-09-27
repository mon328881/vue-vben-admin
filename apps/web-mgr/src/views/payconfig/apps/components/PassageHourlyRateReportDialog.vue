<script lang="ts" setup>
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue';

import type { PassageHourlyArchive } from '#/api';

import { computed, reactive, ref } from 'vue';

import { useAccessStore } from '@vben/stores';

import { Alert, message, Modal, Table } from 'ant-design-vue';

import { fetchPassageHourlyArchivesApi } from '#/api';

const accessStore = useAccessStore();
const visible = ref(false);
const loading = ref(false);
const records = ref<PassageHourlyArchive[]>([]);
const archiveMeta = reactive({
  maxCount: 5,
  totalCoverageDays: 7,
});
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
});

const alertMessage = computed(() => {
  const days = archiveMeta.totalCoverageDays || 7;
  const archived = archiveMeta.maxCount || 5;
  return `每日 00:30 归档前天分时成率（例：6-26 00:30 归档 6-24），列表中展示今日、昨日，此处提供更早 ${archived} 天报表，合计 ${days} 天。报表为 Excel 透视表。`;
});

const columns: TableColumnsType<PassageHourlyArchive> = [
  {
    customRender: ({ index }) =>
      (pagination.current - 1) * pagination.pageSize + index + 1,
    title: '序号',
    width: 72,
  },
  { dataIndex: 'statDate', title: '统计日期' },
  { align: 'right', dataIndex: 'rowCount', title: '通道数', width: 100 },
  { align: 'center', dataIndex: 'op', title: '操作', width: 100 },
];

function downloadHref(row: PassageHourlyArchive) {
  // GCS V4 直链原样返回；加 iToken 会 SignatureDoesNotMatch 403
  if (row.url) return row.url;
  const base = `/api/passageHourlyStat/download?statDate=${encodeURIComponent(row.statDate)}`;
  const token = accessStore.accessToken;
  if (!token) return base;
  // 本地 /download 回退：<a target=_blank> 无法带 Header，走 query iToken
  return `${base}&iToken=${encodeURIComponent(token)}`;
}

async function loadData() {
  loading.value = true;
  try {
    const raw = await fetchPassageHourlyArchivesApi();
    records.value = raw.records ?? [];
    if (raw.maxCount !== undefined) archiveMeta.maxCount = raw.maxCount;
    if (raw.totalCoverageDays !== undefined) {
      archiveMeta.totalCoverageDays = raw.totalCoverageDays;
    }
    pagination.total = records.value.length;
    pagination.current = 1;
  } catch {
    message.error('加载成率报表失败');
    records.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
}

function onTableChange(pag: TablePaginationConfig) {
  pagination.current = pag.current ?? 1;
  pagination.pageSize = pag.pageSize ?? 10;
}

function open() {
  visible.value = true;
  void loadData();
}

defineExpose({ open });
</script>

<template>
  <Modal
    v-model:open="visible"
    title="通道成率报表"
    width="720px"
    :footer="null"
    destroy-on-close
  >
    <div class="hourly-report-dialog">
      <Alert
        class="hourly-report-dialog__alert"
        type="info"
        show-icon
        :message="alertMessage"
      />
      <Table
        :columns="columns"
        :data-source="records"
        :loading="loading"
        :pagination="{
          current: pagination.current,
          pageSize: pagination.pageSize,
          pageSizeOptions: ['5', '10', '20'],
          showSizeChanger: true,
          showTotal: (t: number) => `共 ${t} 条`,
          total: pagination.total,
        }"
        bordered
        :row-key="
          (r: PassageHourlyArchive) =>
            r.objectKey || r.statDate || r.fileName || String(r.createdAt ?? '')
        "
        size="small"
        table-layout="fixed"
        @change="onTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'op'">
            <a
              v-if="record.url"
              class="hourly-report-dialog__link"
              :href="downloadHref(record as PassageHourlyArchive)"
              target="_blank"
              rel="noopener noreferrer"
            >
              下载
            </a>
            <span v-else>--</span>
          </template>
        </template>
      </Table>
    </div>
  </Modal>
</template>

<style scoped>
.hourly-report-dialog {
  overflow: hidden;
}

.hourly-report-dialog__alert {
  margin-bottom: 20px;
}

.hourly-report-dialog :deep(.ant-table) {
  width: 100%;
}

.hourly-report-dialog :deep(.ant-table-container),
.hourly-report-dialog :deep(.ant-table-content) {
  overflow-x: hidden !important;
}

.hourly-report-dialog__link {
  color: hsl(var(--primary));
}
</style>

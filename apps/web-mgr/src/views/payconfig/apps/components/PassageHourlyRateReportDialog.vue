<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { ref } from 'vue';

import { useAccessStore } from '@vben/stores';

import { Alert, Modal, Table, message } from 'ant-design-vue';

import {
  fetchPassageHourlyArchivesApi,
  type PassageHourlyArchive,
} from '#/api';

const columns: TableColumnsType<PassageHourlyArchive> = [
  { dataIndex: 'statDate', title: '统计日期', width: 120 },
  { dataIndex: 'rowCount', title: '通道数', width: 80 },
  { align: 'center', dataIndex: 'op', title: '操作', width: 80 },
];

const accessStore = useAccessStore();
const visible = ref(false);
const loading = ref(false);
const records = ref<PassageHourlyArchive[]>([]);

async function load() {
  loading.value = true;
  try {
    records.value = (await fetchPassageHourlyArchivesApi()) ?? [];
  } catch {
    message.error('加载成率报表失败');
    records.value = [];
  } finally {
    loading.value = false;
  }
}

function open() {
  visible.value = true;
  void load();
}

function downloadHref(row: PassageHourlyArchive) {
  const base =
    row.url ||
    `/api/passageHourlyStat/download?statDate=${encodeURIComponent(row.statDate)}`;
  const token = accessStore.accessToken;
  if (!token) return base;
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}iToken=${encodeURIComponent(token)}`;
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
    <Alert
      type="info"
      show-icon
      class="mb-3"
      message="每日 00:30 归档前天分时成率（例：6-26 00:30 归档 6-24），列表中展示今日、昨日，此处提供更早 5 天报表，合计 7 天。报表为 Excel 透视表。"
    />
    <Table
      :columns="columns"
      :data-source="records"
      :loading="loading"
      :pagination="false"
      :scroll="{ y: 400 }"
      bordered
      row-key="objectKey"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'op'">
          <a
            v-if="record.url"
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
  </Modal>
</template>

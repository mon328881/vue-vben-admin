<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { ref } from 'vue';

import { Drawer, Table, Tabs, message } from 'ant-design-vue';

import {
  fetchPassageHourlyStatApi,
  type PassageHourlyPoint,
  type PassageHourlyStat,
  type PayPassage,
} from '#/api';
import { formatRateDecimal } from '#/utils/format';

const columns: TableColumnsType<PassageHourlyPoint> = [
  { dataIndex: 'hourLabel', title: '时段', width: 120 },
  { align: 'right', dataIndex: 'totalCount', title: '订单数', width: 90 },
  { align: 'right', dataIndex: 'successCount', title: '成功数', width: 90 },
  { align: 'right', dataIndex: 'successRate', title: '成率', width: 100 },
];

const visible = ref(false);
const loading = ref(false);
const tab = ref('today');
const passage = ref<PayPassage | null>(null);
const points = ref<PassageHourlyPoint[]>([]);
const summary = ref<PassageHourlyStat['summary']>(null);

function dateOf(which: string) {
  const day = new Date();
  if (which === 'yesterday') day.setDate(day.getDate() - 1);
  const y = day.getFullYear();
  const m = String(day.getMonth() + 1).padStart(2, '0');
  const d = String(day.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function load() {
  if (passage.value?.payPassageId == null) return;
  loading.value = true;
  try {
    const data = await fetchPassageHourlyStatApi({
      payPassageId: passage.value.payPassageId,
      date: dateOf(tab.value),
    });
    points.value = data?.points ?? [];
    summary.value = data?.summary ?? null;
  } catch {
    message.error('加载小时成率失败');
    points.value = [];
    summary.value = null;
  } finally {
    loading.value = false;
  }
}

function show(row: PayPassage) {
  passage.value = row;
  tab.value = 'today';
  visible.value = true;
  void load();
}

function close() {
  visible.value = false;
  points.value = [];
  summary.value = null;
}

function onTabChange(key: number | string) {
  tab.value = String(key);
  void load();
}

defineExpose({ show });
</script>

<template>
  <Drawer
    v-model:open="visible"
    title="通道分时成率"
    width="640"
    placement="right"
    destroy-on-close
    :footer="null"
    @close="close"
  >
    <div v-if="passage?.payPassageId != null" class="flex flex-col gap-2">
      <div class="font-semibold">
        [{{ passage.payPassageId }}] {{ passage.payPassageName || '--' }}
      </div>
      <div class="text-muted-foreground text-xs">
        所属供应商: {{ passage.passageGroup || '--' }}
      </div>
      <Tabs :active-key="tab" @change="onTabChange">
        <Tabs.TabPane key="today" tab="今日" />
        <Tabs.TabPane key="yesterday" tab="昨日" />
      </Tabs>
      <div
        v-if="summary"
        class="text-muted-foreground flex flex-wrap gap-4 text-xs"
      >
        <span>
          合计订单 <b>{{ summary.totalCount }}</b>
        </span>
        <span>
          成功 <b>{{ summary.successCount }}</b>
        </span>
        <span>
          成率
          <b class="text-primary">{{ formatRateDecimal(summary.successRate) }}</b>
        </span>
      </div>
      <Table
        :columns="columns"
        :data-source="points"
        :loading="loading"
        :pagination="false"
        :scroll="{ y: 600 }"
        bordered
        row-key="hour"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'successRate'">
            {{ formatRateDecimal(record.successRate) }}
          </template>
        </template>
      </Table>
    </div>
  </Drawer>
</template>

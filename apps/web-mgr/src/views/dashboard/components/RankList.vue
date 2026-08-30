<script lang="ts" setup>
/**
 * 对齐旧端 RankList：左侧排名/并发表 + 右侧通道监控图
 */
import type { EchartsUIType } from '@vben/plugins/echarts';
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue';

import {
  computed,
  nextTick,
  onActivated,
  onDeactivated,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  watch,
} from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import {
  Card,
  Col,
  RadioButton,
  RadioGroup,
  Row,
  Table,
} from 'ant-design-vue';

import {
  fetchDashboardAgentRankApi,
  fetchDashboardMchRankApi,
  fetchDashboardPassageGroupRankApi,
  fetchDashboardPassageRankApi,
  fetchRealTimeConcurrentApi,
  fetchRealTimeCountApi,
  type ConcurrentRow,
  type DashboardRankRow,
  type RealTimePassageItem,
} from '#/api';
import {
  amountSignedClass,
  formatSuccessRate,
  formatYuan,
  rateValue,
} from '#/utils/format';

defineOptions({ name: 'DashboardRankList' });

const POLL_MS = 30 * 1000;

const boardTab = ref('1');
const rankTab = ref('1');
const monitorMinutes = ref('20');
const concurrentMinutes = ref('20');

const rankLoading = ref(false);
const concurrentLoading = ref(false);
const chartEmpty = ref(false);

const rankRows = ref<DashboardRankRow[]>([]);
const concurrentRows = ref<ConcurrentRow[]>([]);
const rankTotal = ref(0);
const concurrentTotal = ref(0);
const rankPage = reactive({ current: 1, pageSize: 10 });
const concurrentPage = reactive({ current: 1, pageSize: 10 });

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

interface MonitorRow {
  name: string;
  rate: number;
  successCount: number;
  allCount: number;
  successAmount: number;
  totalAmount: number;
}

let monitorRows: MonitorRow[] = [];

const rowKey = computed(() => {
  switch (rankTab.value) {
    case '2': {
      return 'payPassageId';
    }
    case '3': {
      return 'passageGroupName';
    }
    case '4': {
      return 'agentNo';
    }
    default: {
      return 'mchNo';
    }
  }
});

const rankColumns = computed<TableColumnsType>(() => {
  const base: TableColumnsType = [
    { title: 'ID/名称', key: 'name', ellipsis: true },
    { title: '余额(¥)', key: 'balance', width: 140, ellipsis: true },
    { title: '今日跑量', key: 'successAmount', width: 140, ellipsis: true },
    { title: '成率', key: 'successRate', width: 100 },
  ];
  const diff = {
    title: '剩余预付',
    key: 'diff',
    width: 140,
    align: 'right' as const,
    ellipsis: true,
  };
  if (rankTab.value === '4') {
    return base.filter(
      (col) => col.key !== 'successAmount' && col.key !== 'successRate',
    );
  }
  if (rankTab.value === '2') return base;
  return [...base, diff];
});

const concurrentColumns: TableColumnsType = [
  { title: '商户名', dataIndex: 'mchName', key: 'mchName', ellipsis: true },
  { title: '下单次数', key: 'allCount', width: 120, align: 'center' },
  { title: '实时成率', key: 'realTimeRate', width: 100, align: 'center' },
  {
    title: '下单次数/每分钟',
    key: 'perMinCount',
    width: 150,
    align: 'center',
  },
];

function normalizeRankRow(row: DashboardRankRow): DashboardRankRow {
  return {
    ...row,
    name:
      row.name ||
      row.mchName ||
      row.payPassageName ||
      row.passageGroupName ||
      row.agentName ||
      row.mchNo ||
      row.agentNo ||
      '--',
  };
}

async function loadRank(toFirst = false) {
  if (toFirst) rankPage.current = 1;
  rankLoading.value = true;
  try {
    const params = {
      pageNumber: rankPage.current,
      pageSize: rankPage.pageSize,
    };
    let page: null | { records?: DashboardRankRow[]; total?: number } = null;
    switch (rankTab.value) {
      case '2': {
        page = await fetchDashboardPassageRankApi(params);
        break;
      }
      case '3': {
        page = await fetchDashboardPassageGroupRankApi(params);
        break;
      }
      case '4': {
        page = await fetchDashboardAgentRankApi(params);
        break;
      }
      default: {
        page = await fetchDashboardMchRankApi(params);
      }
    }
    rankRows.value = (page?.records ?? []).map(normalizeRankRow);
    rankTotal.value = Number(page?.total ?? 0);
  } catch (error) {
    console.error('加载排名数据失败:', error);
    rankRows.value = [];
    rankTotal.value = 0;
  } finally {
    rankLoading.value = false;
  }
}

async function loadConcurrent(toFirst = false) {
  if (toFirst) concurrentPage.current = 1;
  concurrentLoading.value = true;
  try {
    const page = await fetchRealTimeConcurrentApi({
      pageNumber: concurrentPage.current,
      pageSize: concurrentPage.pageSize,
      time: Number(concurrentMinutes.value) || 20,
    });
    concurrentRows.value = page?.records ?? [];
    concurrentTotal.value = Number(page?.total ?? 0);
  } catch (error) {
    console.error('加载商户并发失败:', error);
    concurrentRows.value = [];
    concurrentTotal.value = 0;
  } finally {
    concurrentLoading.value = false;
  }
}

function formatSuccessRateCell(row: DashboardRankRow) {
  if (rankTab.value === '3') {
    return formatSuccessRate(row.successCount, row.totalCount);
  }
  const value = row.successRate;
  if (value == null) return '-';
  const num = Number(value);
  if (!Number.isFinite(num)) return '-';
  return `${(num * 100).toFixed(2)}%`;
}

function formatDiff(row: DashboardRankRow) {
  if (row.prepaid === undefined || row.prepaid === null) return '-';
  return formatYuan(Number(row.prepaid) - Number(row.balance ?? 0));
}

function displayName(row: DashboardRankRow) {
  if (rankTab.value === '1') {
    return `[${row.mchNo ?? ''}] ${row.mchName ?? ''}`;
  }
  if (rankTab.value === '2') {
    return `[${row.payPassageId ?? ''}] ${row.payPassageName ?? ''}`;
  }
  if (rankTab.value === '3') {
    return row.passageGroupName ?? '';
  }
  return `[${row.agentNo ?? ''}] ${row.agentName ?? ''}`;
}

function onRankTableChange(pagination: TablePaginationConfig) {
  rankPage.current = pagination.current ?? 1;
  rankPage.pageSize = pagination.pageSize ?? 10;
  void loadRank();
}

function onConcurrentTableChange(pagination: TablePaginationConfig) {
  concurrentPage.current = pagination.current ?? 1;
  concurrentPage.pageSize = pagination.pageSize ?? 10;
  void loadConcurrent();
}

function brandColor() {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--primary')
    .trim();
  return raw ? `hsl(${raw})` : '#1677ff';
}

async function renderChart(rows: MonitorRow[]) {
  await renderEcharts(
    {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: unknown) => {
          const list = params as Array<{ dataIndex: number }>;
          const row = monitorRows[list?.[0]?.dataIndex ?? -1];
          if (!row) return '';
          return [
            `<div style="font-weight:500;margin-bottom:8px;">${row.name}</div>`,
            `<div style="display:flex;justify-content:space-between;gap:20px;"><span>成功率</span><span style="font-weight:600;">${row.rate.toFixed(2)}%</span></div>`,
            `<div style="display:flex;justify-content:space-between;gap:20px;"><span>成功/总数</span><span>${row.successCount} / ${row.allCount}</span></div>`,
            `<div style="display:flex;justify-content:space-between;gap:20px;"><span>成功金额</span><span>¥${formatYuan(row.successAmount)}</span></div>`,
            `<div style="display:flex;justify-content:space-between;gap:20px;"><span>总金额</span><span>¥${formatYuan(row.totalAmount)}</span></div>`,
          ].join('');
        },
      },
      grid: {
        left: '3%',
        right: '80px',
        top: '10px',
        bottom: '10px',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        max: 100,
        splitLine: { lineStyle: { type: 'dashed' } },
      },
      yAxis: {
        type: 'category',
        data: rows.map((row) => row.name),
        inverse: true,
        axisLabel: { width: 160, overflow: 'truncate', fontSize: 12 },
        axisTick: { show: false },
        axisLine: { show: false },
      },
      series: [
        {
          type: 'bar',
          data: rows.map((row) => row.rate),
          barWidth: 16,
          itemStyle: {
            color: brandColor(),
            borderRadius: [0, 4, 4, 0],
          },
          label: {
            show: true,
            position: 'right',
            // echarts CallbackDataParams.value 类型较宽，这里只取数值展示
            formatter: ((param: { value?: unknown }) =>
              Number(param?.value ?? 0).toFixed(2)) as never,
            color: '#333',
            fontSize: 12,
          },
        },
      ],
    },
    true,
  );
}

async function loadMonitor() {
  try {
    const raw = await fetchRealTimeCountApi(Number(monitorMinutes.value) || 20);
    if (!raw || typeof raw !== 'object' || Object.keys(raw).length === 0) {
      chartEmpty.value = true;
      monitorRows = [];
      await renderChart([]);
      return;
    }
    chartEmpty.value = false;
    monitorRows = Object.values(raw as Record<string, RealTimePassageItem>)
      .map((item) => ({
        name: String(item.passageName ?? ''),
        rate: rateValue(item.successCount, item.allCount),
        successCount: Number(item.successCount ?? 0),
        allCount: Number(item.allCount ?? 0),
        successAmount: Number(item.successAmount ?? 0),
        totalAmount: Number(item.totalAmount ?? 0),
      }))
      .sort((a, b) => b.rate - a.rate);
    await renderChart(monitorRows);
  } catch (error) {
    console.error('加载通道监控数据失败:', error);
    chartEmpty.value = true;
    monitorRows = [];
    await renderChart([]);
  }
}

let pollTimer: null | ReturnType<typeof setInterval> = null;
let pageActive = true;

function clearPoll() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function refreshTick() {
  if (boardTab.value === '1') {
    void loadRank();
  } else {
    void loadConcurrent();
  }
  void loadMonitor();
}

function startPoll() {
  clearPoll();
  if (!pageActive || document.hidden) return;
  pollTimer = setInterval(refreshTick, POLL_MS);
}

function onVisibility() {
  if (document.hidden) {
    clearPoll();
    return;
  }
  if (!pageActive) return;
  refreshTick();
  startPoll();
}

watch(rankTab, () => {
  void loadRank(true);
});

watch(boardTab, (value) => {
  if (value === '2') void loadConcurrent(true);
});

watch(concurrentMinutes, () => {
  void loadConcurrent(true);
});

watch(monitorMinutes, () => {
  void loadMonitor();
});

onMounted(() => {
  document.addEventListener('visibilitychange', onVisibility);
  void loadRank(true);
  nextTick(() => {
    void loadMonitor();
    startPoll();
  });
});

onActivated(() => {
  pageActive = true;
  if (!document.hidden) {
    refreshTick();
    startPoll();
  }
});

onDeactivated(() => {
  pageActive = false;
  clearPoll();
});

onUnmounted(() => {
  pageActive = false;
  clearPoll();
  document.removeEventListener('visibilitychange', onVisibility);
});
</script>

<template>
  <Row :gutter="16" class="rank-row">
    <Col :xs="24" :xl="12">
      <Card class="dashboard-rank-card" :bordered="true">
        <div class="card-header">
          <RadioGroup v-model:value="boardTab" button-style="solid" size="small">
            <RadioButton value="1">数据排名</RadioButton>
            <RadioButton value="2">商户并发</RadioButton>
          </RadioGroup>
          <RadioGroup
            v-if="boardTab === '1'"
            v-model:value="rankTab"
            button-style="solid"
            size="small"
          >
            <RadioButton value="1">商户</RadioButton>
            <RadioButton value="2">通道</RadioButton>
            <RadioButton value="3">供应商</RadioButton>
            <RadioButton value="4">代理</RadioButton>
          </RadioGroup>
          <RadioGroup
            v-else
            v-model:value="concurrentMinutes"
            button-style="solid"
            size="small"
          >
            <RadioButton value="1">1分钟</RadioButton>
            <RadioButton value="5">5分钟</RadioButton>
            <RadioButton value="20">20分钟</RadioButton>
            <RadioButton value="60">60分钟</RadioButton>
          </RadioGroup>
        </div>

        <div v-show="boardTab === '1'" class="table-container">
          <Table
            size="small"
            :row-key="rowKey"
            :columns="rankColumns"
            :data-source="rankRows"
            :loading="rankLoading"
            :pagination="{
              current: rankPage.current,
              pageSize: rankPage.pageSize,
              total: rankTotal,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
            }"
            :scroll="{ y: 480 }"
            @change="onRankTableChange"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'name'">
                {{ displayName(record) }}
              </template>
              <template v-else-if="column.key === 'balance'">
                <b :class="amountSignedClass(record.balance)">
                  {{ formatYuan(record.balance) }}
                </b>
              </template>
              <template v-else-if="column.key === 'successAmount'">
                <span v-if="record.successAmount" class="text-brand">
                  {{ formatYuan(record.successAmount) }}
                </span>
                <b v-else>-</b>
              </template>
              <template v-else-if="column.key === 'successRate'">
                <b>{{ formatSuccessRateCell(record) }}</b>
              </template>
              <template v-else-if="column.key === 'diff'">
                <b>{{ formatDiff(record) }}</b>
              </template>
            </template>
          </Table>
        </div>

        <div v-show="boardTab === '2'" class="table-container">
          <Table
            size="small"
            row-key="mchName"
            :columns="concurrentColumns"
            :data-source="concurrentRows"
            :loading="concurrentLoading"
            :pagination="{
              current: concurrentPage.current,
              pageSize: concurrentPage.pageSize,
              total: concurrentTotal,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
            }"
            :scroll="{ y: 480 }"
            @change="onConcurrentTableChange"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'allCount'">
                {{ record.allCount ?? 0 }}
              </template>
              <template v-else-if="column.key === 'realTimeRate'">
                <span class="text-brand">
                  {{ formatSuccessRate(record.successCount, record.allCount) }}
                </span>
              </template>
              <template v-else-if="column.key === 'perMinCount'">
                <b>{{ record.perMinCount ?? 0 }}</b>
              </template>
            </template>
          </Table>
        </div>
      </Card>
    </Col>

    <Col :xs="24" :xl="12">
      <div class="monitor-panel">
        <div class="monitor-header">
          <span class="monitor-title">通道监控</span>
          <RadioGroup
            v-model:value="monitorMinutes"
            button-style="solid"
            size="small"
          >
            <RadioButton value="1">1分钟</RadioButton>
            <RadioButton value="5">5分钟</RadioButton>
            <RadioButton value="20">20分钟</RadioButton>
            <RadioButton value="60">60分钟</RadioButton>
          </RadioGroup>
        </div>
        <div class="monitor-body">
          <div class="chart-legend">
            <span class="legend-item">
              <span class="legend-color"></span>
              <span class="legend-text">通道成功率</span>
            </span>
          </div>
          <div class="monitor-chart-wrap">
            <EchartsUI ref="chartRef" height="560px" />
            <div v-if="chartEmpty" class="monitor-empty">暂无数据</div>
          </div>
        </div>
      </div>
    </Col>
  </Row>
</template>

<style scoped>
.rank-row {
  width: 100%;
}

.dashboard-rank-card {
  height: 710px;
  box-sizing: border-box;
}

.dashboard-rank-card :deep(.ant-card-body) {
  padding: 16px 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 12px;
  flex-wrap: wrap;
  padding-bottom: 12px;
}

.table-container {
  flex: 1;
  min-height: 0;
}

.text-brand {
  color: hsl(var(--primary));
}

.monitor-panel {
  height: 710px;
  box-sizing: border-box;
  padding: 16px 20px;
  background-color: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

.monitor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding-bottom: 12px;
}

.monitor-title {
  font-size: 16px;
  font-weight: 500;
  color: hsl(var(--foreground));
}

.monitor-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.chart-legend {
  display: flex;
  justify-content: center;
  padding: 8px 0 12px;
  flex-shrink: 0;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.legend-color {
  width: 14px;
  height: 14px;
  background-color: hsl(var(--primary));
  border-radius: 2px;
}

.legend-text {
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.monitor-chart-wrap {
  position: relative;
  flex: 1;
  width: 100%;
  min-height: 0;
}

.monitor-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: hsl(var(--muted-foreground));
  background-color: hsl(var(--card));
  font-size: 14px;
}

:deep(.amount-positive) {
  color: hsl(142 71% 40%);
}

:deep(.amount-negative) {
  color: hsl(var(--destructive));
}

:deep(.amount-zero) {
  color: hsl(var(--foreground));
}
</style>

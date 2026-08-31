<template>
  <Row :gutter="16" class="rank-row">
    <Col :xs="24" :xl="12">
      <AnalysisChartCard class="dashboard-rank-card" :title="rankBoardTitle">
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
      </AnalysisChartCard>
    </Col>

    <Col :xs="24" :xl="12">
      <AnalysisChartCard class="monitor-panel" title="通道监控">
        <div class="monitor-header">
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
      </AnalysisChartCard>
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

.dashboard-rank-card :deep([data-slot='card-content']),
.dashboard-rank-card :deep(.p-6) {
  padding-top: 0;
  height: calc(100% - 64px);
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
}

.monitor-panel :deep([data-slot='card-content']),
.monitor-panel :deep(.p-6) {
  padding-top: 0;
  height: calc(100% - 64px);
  display: flex;
  flex-direction: column;
}

.monitor-header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
  padding-bottom: 12px;
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

<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Image,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  fetchPicBase64Api,
  fetchPrepaidHistoryListApi,
  fetchPrepaidHistoryStatApi,
} from '#/api';
import type { PrepaidHistory } from '#/api/types/business';
import AsyncExportButtons from '#/components/export/AsyncExportButtons.vue';
import ExportReportListDialog from '#/components/export/ExportReportListDialog.vue';
import { FUND_DIRECTION_OPTIONS } from '#/constants/history';
import { useMchPrepaidHistoryExport } from '#/composables/use-async-export';
import { formatDayEnd, formatDayStart } from '#/utils/date-range';
import {
  amountSignedClass,
  formatDateTime,
  formatYuan,
  signedYuan,
} from '#/utils/format';

defineOptions({ name: 'AgentPrepaidPage' });

function default30DayRange(): [string, string] {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 29);
  return [formatDayStart(start), formatDayEnd(end)];
}

const query = reactive({
  pageNumber: 1,
  pageSize: 20,
  mchNo: '',
  mchName: '',
  fundDirection: undefined as number | undefined,
  createdStart: '',
  createdEnd: '',
});
const createdRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>();
const list = ref<PrepaidHistory[]>([]);
const total = ref(0);
const loading = ref(false);
const summary = reactive({ totalAmount: 0 });

const picPreviewOpen = ref(false);
const picPreviewLoading = ref(false);
const picPreviewSrc = ref('');

const {
  exportLoading,
  exportProgress,
  reportListVisible,
  reportListLoading,
  reportListTitle,
  hasReportDownloads,
  completedExports,
  submitExport,
  restoreRunningTask,
  syncReportDownloadAvailability,
  openReportList,
  downloadFile,
  deleteCompletedItem,
} = useMchPrepaidHistoryExport();

const columns: TableColumnsType<PrepaidHistory> = [
  { dataIndex: 'mchNo', title: '商户号', width: 130 },
  { dataIndex: 'mchName', title: '商户名称', width: 140, ellipsis: true },
  { dataIndex: 'beforeBalance', title: '变更前余额', width: 120 },
  { dataIndex: 'amount', title: '变更金额', width: 110 },
  { dataIndex: 'afterBalance', title: '变更后余额', width: 120 },
  { dataIndex: 'createdAt', title: '创建日期', width: 170 },
  { dataIndex: 'operator', title: '操作员', width: 120 },
  { dataIndex: 'pic', title: '凭证', width: 90 },
  { dataIndex: 'remark', title: '备注', ellipsis: true },
];

function syncRange() {
  if (createdRange.value?.[0] && createdRange.value?.[1]) {
    query.createdStart = formatDayStart(createdRange.value[0].toDate());
    query.createdEnd = formatDayEnd(createdRange.value[1].toDate());
  } else {
    query.createdStart = '';
    query.createdEnd = '';
  }
}

function filters() {
  syncRange();
  return {
    createdEnd: query.createdEnd || undefined,
    createdStart: query.createdStart || undefined,
    fundDirection: query.fundDirection,
    mchNo: query.mchNo || undefined,
    mchName: query.mchName || undefined,
  };
}

async function loadSummary() {
  try {
    const data = await fetchPrepaidHistoryStatApi(filters());
    summary.totalAmount = data?.totalAmount ?? 0;
  } catch (error) {
    console.error(error);
  }
}

async function load() {
  loading.value = true;
  try {
    const data = await fetchPrepaidHistoryListApi({
      pageNumber: query.pageNumber,
      pageSize: query.pageSize,
      ...filters(),
    });
    list.value = data.records ?? [];
    total.value = data.total ?? 0;
  } catch (error) {
    message.error(error instanceof Error ? error.message : '加载失败');
  } finally {
    loading.value = false;
  }
}

async function onSearch() {
  query.pageNumber = 1;
  await loadSummary();
  await load();
}

function applyDefaultRange() {
  const [start, end] = default30DayRange();
  createdRange.value = [dayjs(start), dayjs(end)];
  query.createdStart = start;
  query.createdEnd = end;
}

function onReset() {
  query.mchNo = '';
  query.mchName = '';
  query.fundDirection = undefined;
  applyDefaultRange();
  query.pageNumber = 1;
  void onSearch();
}

function onExport() {
  submitExport(filters());
}

async function previewPic(pic?: string) {
  if (!pic) {
    message.warning('暂无凭证');
    return;
  }
  picPreviewOpen.value = true;
  picPreviewLoading.value = true;
  picPreviewSrc.value = '';
  try {
    const base64 = await fetchPicBase64Api(pic);
    picPreviewSrc.value = base64?.startsWith('data:')
      ? base64
      : `data:image/png;base64,${base64 ?? ''}`;
  } catch (error) {
    message.error(error instanceof Error ? error.message : '加载凭证失败');
    picPreviewOpen.value = false;
  } finally {
    picPreviewLoading.value = false;
  }
}

onMounted(async () => {
  applyDefaultRange();
  await onSearch();
  await restoreRunningTask();
  await syncReportDownloadAvailability();
});
</script>

<template>
  <Page auto-content-height title="预付流水">
    <div class="ap-page-stack">
      <Card class="ap-page-filter">
        <Form class="ap-pay-order-filter" @finish="onSearch">
          <Row :gutter="[16, 16]">
            <Col :lg="8" :md="12" :span="24" :xl="8">
              <Form.Item>
                <DatePicker.RangePicker
                  v-model:value="createdRange"
                  show-time
                  style="width: 100%"
                  :placeholder="['创建时间开始', '创建时间结束']"
                />
              </Form.Item>
            </Col>
            <Col :lg="4" :md="8" :span="24" :xl="4">
              <Form.Item>
                <Input
                  v-model:value="query.mchNo"
                  allow-clear
                  placeholder="商户号"
                />
              </Form.Item>
            </Col>
            <Col :lg="4" :md="8" :span="24" :xl="4">
              <Form.Item>
                <Input
                  v-model:value="query.mchName"
                  allow-clear
                  placeholder="商户名称"
                />
              </Form.Item>
            </Col>
            <Col :lg="4" :md="8" :span="24" :xl="4">
              <Form.Item>
                <Select
                  v-model:value="query.fundDirection"
                  allow-clear
                  placeholder="资金变动方向"
                  style="width: 100%"
                  :options="FUND_DIRECTION_OPTIONS"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row :gutter="[16, 16]" class="mt-1">
            <Col :span="24" class="ap-filter-actions">
              <Space>
                <Button html-type="submit" type="primary" :loading="loading">
                  查询
                </Button>
                <Button @click="onReset">重置</Button>
                <AsyncExportButtons
                  danger
                  :has-report-downloads="hasReportDownloads"
                  :loading="exportLoading"
                  :progress="exportProgress"
                  @export="onExport"
                  @open-report-list="openReportList"
                />
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      <Row :gutter="[16, 16]" class="ap-page-stats">
        <Col :md="8" :span="24">
          <Card>
            <Statistic
              title="变更金额汇总"
              :precision="2"
              :value="summary.totalAmount / 100"
              prefix="¥"
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          :columns="columns"
          :data-source="list"
          :loading="loading"
          :pagination="{
            current: query.pageNumber,
            pageSize: query.pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
          }"
          :scroll="{ x: 1200 }"
          row-key="id"
          @change="
            (p) => {
              query.pageNumber = p.current ?? 1;
              query.pageSize = p.pageSize ?? 20;
              load();
            }
          "
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'beforeBalance'">
              {{ formatYuan(record.beforeBalance) }}
            </template>
            <template v-else-if="column.dataIndex === 'amount'">
              <span :class="amountSignedClass(record.amount)">
                {{ signedYuan(record.amount) }}
              </span>
            </template>
            <template v-else-if="column.dataIndex === 'afterBalance'">
              {{ formatYuan(record.afterBalance) }}
            </template>
            <template v-else-if="column.dataIndex === 'createdAt'">
              {{ formatDateTime(record.createdAt) }}
            </template>
            <template v-else-if="column.dataIndex === 'pic'">
              <Button
                v-if="record.pic"
                size="small"
                type="link"
                @click="previewPic(record.pic)"
              >
                查看
              </Button>
              <span v-else>—</span>
            </template>
          </template>
        </Table>
      </Card>
    </div>

    <ExportReportListDialog
      v-model:visible="reportListVisible"
      :data="completedExports"
      :loading="reportListLoading"
      :title="reportListTitle"
      @download="downloadFile"
      @remove="deleteCompletedItem"
    />

    <Modal
      v-model:open="picPreviewOpen"
      title="凭证预览"
      :footer="null"
      destroy-on-close
      width="520"
    >
      <div v-if="picPreviewLoading" class="pic-loading">加载中…</div>
      <Image
        v-else-if="picPreviewSrc"
        :src="picPreviewSrc"
        alt="凭证"
        class="pic-preview"
      />
    </Modal>
  </Page>
</template>

<style scoped>
.amount-positive {
  color: hsl(142 71% 40%);
}

.amount-negative {
  color: hsl(var(--destructive));
}

.amount-zero {
  color: inherit;
}

.pic-loading {
  padding: 40px 0;
  text-align: center;
  color: hsl(var(--muted-foreground));
}

.pic-preview {
  width: 100%;
}
</style>

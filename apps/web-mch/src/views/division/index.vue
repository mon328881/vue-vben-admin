<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  applyDivisionApi,
  fetchDivisionConfigApi,
  fetchDivisionListApi,
  fetchDivisionMchInfoApi,
} from '#/api';
import type { MchDivisionRecord } from '#/api/types/business';
import {
  DIVISION_STATE_OPTIONS,
  divisionStateColor,
  divisionStateLabel,
} from '#/constants/division';
import { defaultTodayRange, formatDayEnd, formatDayStart } from '#/utils/date-range';
import { formatDateTime, formatYuan, yuanToCent } from '#/utils/format';

defineOptions({ name: 'DivisionPage' });

const info = reactive({
  mchNo: '',
  mchName: '',
  balance: 0,
  freezeBalance: 0,
});
const config = reactive({
  mchFee: 0,
  mchFeeRate: 0,
  mchMinWithdraw: 0,
  mchVisible: 0,
});

const query = reactive({
  pageNumber: 1,
  pageSize: 20,
  recordId: '',
  state: undefined as number | undefined,
  createdStart: '',
  createdEnd: '',
});
const createdRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>();
const list = ref<MchDivisionRecord[]>([]);
const total = ref(0);
const loading = ref(false);
const searchLoading = ref(false);

const applyOpen = ref(false);
const applyLoading = ref(false);
const applyForm = reactive({
  amount: undefined as number | undefined,
  remark: '',
});

const totalBalance = computed(
  () => (info.balance || 0) + (info.freezeBalance || 0),
);
const applyDisabled = computed(() => config.mchVisible !== 1);
const feeRateText = computed(
  () => `${((config.mchFeeRate || 0) * 100).toFixed(2)}%`,
);

const columns: TableColumnsType<MchDivisionRecord> = [
  { dataIndex: 'recordId', title: '流水单号', width: 150 },
  { dataIndex: 'name', title: '商户', ellipsis: true },
  { dataIndex: 'createdAt', title: '申请时间', width: 200 },
  { dataIndex: 'amount', title: '申请金额', width: 200 },
  { dataIndex: 'divisionAmount', title: '到账金额', width: 200 },
  { dataIndex: 'divisionAmountFee', title: '服务费', width: 150 },
  { dataIndex: 'state', title: '状态', width: 150 },
];

function applyToday() {
  const [start, end] = defaultTodayRange();
  createdRange.value = [dayjs(start), dayjs(end)];
  query.createdStart = start;
  query.createdEnd = end;
}

function syncRange() {
  if (createdRange.value?.[0] && createdRange.value?.[1]) {
    query.createdStart = formatDayStart(createdRange.value[0].toDate());
    query.createdEnd = formatDayEnd(createdRange.value[1].toDate());
  } else {
    query.createdStart = '';
    query.createdEnd = '';
  }
}

async function loadInfo() {
  try {
    const data = await fetchDivisionMchInfoApi();
    info.mchNo = data?.mchNo ?? '';
    info.mchName = data?.mchName ?? '';
    info.balance = data?.balance ?? 0;
    info.freezeBalance = data?.freezeBalance ?? 0;
  } catch (error) {
    console.error(error);
  }
}

async function loadConfig() {
  try {
    const data = await fetchDivisionConfigApi();
    config.mchFee = data?.mchFee ?? 0;
    config.mchFeeRate = data?.mchFeeRate ?? 0;
    config.mchMinWithdraw = data?.mchMinWithdraw ?? 0;
    config.mchVisible = data?.mchVisible ?? 0;
  } catch (error) {
    console.error(error);
  }
}

async function load() {
  loading.value = true;
  syncRange();
  try {
    const data = await fetchDivisionListApi({
      pageNumber: query.pageNumber,
      pageSize: query.pageSize,
      createdEnd: query.createdEnd || undefined,
      createdStart: query.createdStart || undefined,
      recordId: query.recordId || undefined,
      state: query.state,
    });
    list.value = data.records ?? [];
    total.value = data.total ?? 0;
  } catch (error) {
    message.error(error instanceof Error ? error.message : '加载失败');
  } finally {
    loading.value = false;
    searchLoading.value = false;
  }
}

async function onSearch() {
  query.pageNumber = 1;
  searchLoading.value = true;
  await loadInfo();
  await load();
}

function onReset() {
  query.recordId = '';
  query.state = undefined;
  applyToday();
  query.pageNumber = 1;
  loadInfo();
  load();
}

function openApply() {
  if (applyDisabled.value) {
    message.warning('当前不可申请结算');
    return;
  }
  applyForm.amount = undefined;
  applyForm.remark = '';
  applyOpen.value = true;
}

async function submitApply() {
  if (!applyForm.amount || applyForm.amount <= 0) {
    message.error('请输入有效申请金额');
    return;
  }
  applyLoading.value = true;
  try {
    await applyDivisionApi(
      yuanToCent(applyForm.amount),
      applyForm.remark || undefined,
    );
    message.success('提交成功');
    applyOpen.value = false;
    await onSearch();
  } catch (error) {
    message.error(error instanceof Error ? error.message : '申请失败');
  } finally {
    applyLoading.value = false;
  }
}

onMounted(async () => {
  applyToday();
  await loadConfig();
  await onSearch();
});
</script>

<template>
  <Page auto-content-height title="结算管理">
    <div class="ap-page-stack">
      <Row :gutter="[16, 16]" class="division-overview">
        <Col :lg="4" :md="8" :span="12">
          <Card class="top-stat-card">
            <div class="top-stat-title">账户总余额</div>
            <div class="top-stat-value stat-total">
              {{ formatYuan(totalBalance) }}
            </div>
          </Card>
        </Col>
        <Col :lg="4" :md="8" :span="12">
          <Card class="top-stat-card">
            <div class="top-stat-title">可提现余额</div>
            <div class="top-stat-value stat-withdrawable">
              {{ formatYuan(info.balance) }}
            </div>
          </Card>
        </Col>
        <Col :lg="4" :md="8" :span="12">
          <Card class="top-stat-card">
            <div class="top-stat-title">冻结余额</div>
            <div class="top-stat-value stat-freeze">
              {{ formatYuan(info.freezeBalance) }}
            </div>
          </Card>
        </Col>
        <Col :lg="6" :md="12" :span="24">
          <Card class="division-fee-card">
            <p>最小结算: <b>{{ formatYuan(config.mchMinWithdraw) }}</b></p>
            <p>单笔手续费: <b>{{ formatYuan(config.mchFee) }}</b></p>
            <p>单笔费率: <b>{{ feeRateText }}</b></p>
          </Card>
        </Col>
        <Col :lg="6" :md="12" :span="24">
          <div class="apply-slot">
            <Button
              type="primary"
              :disabled="applyDisabled"
              @click="openApply"
            >
              申请结算
            </Button>
          </div>
        </Col>
      </Row>

      <Card class="ap-page-filter">
        <Form class="ap-pay-order-filter" @finish="onSearch">
          <Row :gutter="[16, 16]">
            <Col :lg="8" :md="12" :span="24">
              <Form.Item>
                <DatePicker.RangePicker
                  v-model:value="createdRange"
                  show-time
                  style="width: 100%"
                  :placeholder="['创建时间开始', '创建时间结束']"
                />
              </Form.Item>
            </Col>
            <Col :lg="4" :md="8" :span="24">
              <Form.Item>
                <Input
                  v-model:value="query.recordId"
                  allow-clear
                  placeholder="流水单号"
                />
              </Form.Item>
            </Col>
            <Col :lg="4" :md="8" :span="24">
              <Form.Item>
                <Select
                  v-model:value="query.state"
                  allow-clear
                  placeholder="状态"
                  style="width: 100%"
                  :options="DIVISION_STATE_OPTIONS"
                />
              </Form.Item>
            </Col>
            <Col :lg="8" :md="24" :span="24" class="ap-filter-actions">
              <Space>
                <Button
                  html-type="submit"
                  type="primary"
                  :loading="searchLoading"
                >
                  搜索
                </Button>
                <Button @click="onReset">重置</Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

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
          row-key="recordId"
          @change="
            (p) => {
              query.pageNumber = p.current ?? 1;
              query.pageSize = p.pageSize ?? 20;
              load();
            }
          "
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'name'">
              <span class="mch-no">[{{ record.userNo || '--' }}]</span>
              <span class="mch-name">{{ record.userName || '--' }}</span>
            </template>
            <template v-else-if="column.dataIndex === 'amount'">
              <b class="amount-apply">{{ formatYuan(record.amount) }}</b>
            </template>
            <template v-else-if="column.dataIndex === 'divisionAmount'">
              <b class="amount-receive">{{
                formatYuan(record.divisionAmount)
              }}</b>
            </template>
            <template v-else-if="column.dataIndex === 'divisionAmountFee'">
              {{ formatYuan(record.divisionAmountFee) }}
            </template>
            <template v-else-if="column.dataIndex === 'state'">
              <Tag :color="divisionStateColor(record.state)">
                {{ divisionStateLabel(record.state) }}
              </Tag>
            </template>
            <template v-else-if="column.dataIndex === 'createdAt'">
              {{ formatDateTime(record.createdAt) }}
            </template>
          </template>
        </Table>
      </Card>
    </div>

    <Modal
      v-model:open="applyOpen"
      title="申请结算"
      ok-text="确定"
      cancel-text="取消"
      :confirm-loading="applyLoading"
      destroy-on-close
      @ok="submitApply"
    >
      <Form :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <Form.Item label="商户号">
          <span class="apply-form__text">{{ info.mchNo || '--' }}</span>
        </Form.Item>
        <Form.Item label="商户名称">
          <span class="apply-form__text">{{ info.mchName || '--' }}</span>
        </Form.Item>
        <Form.Item label="申请金额" required>
          <InputNumber
            v-model:value="applyForm.amount"
            :min="0.01"
            :precision="2"
            class="!w-full"
            placeholder="请输入申请金额，例如：1000.50"
          />
        </Form.Item>
        <Form.Item label="备注">
          <Input
            v-model:value="applyForm.remark"
            allow-clear
            placeholder="请输入备注（可选）"
          />
        </Form.Item>
      </Form>
    </Modal>
  </Page>
</template>

<style scoped>
.division-overview :deep(.ant-col) {
  display: flex;
  align-items: stretch;
}

.top-stat-card {
  width: 100%;
  height: 100%;
}

.top-stat-card :deep(.ant-card-body) {
  min-height: 80px;
  padding: 14px 16px;
}

.top-stat-title {
  margin-bottom: 6px;
  color: hsl(var(--muted-foreground));
  font-size: 13px;
}

.top-stat-value {
  font-size: 22px;
  font-weight: 600;
  line-height: 1.2;
}

.stat-total {
  color: hsl(var(--primary));
}

.stat-withdrawable {
  color: hsl(142 71% 40%);
}

.stat-freeze {
  color: hsl(var(--destructive));
}

.division-fee-card {
  width: 100%;
  height: 100%;
}

.division-fee-card :deep(.ant-card-body) {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 80px;
  padding: 8px 16px;
}

.division-fee-card p {
  margin: 1px 0;
  font-size: 13px;
  line-height: 1.35;
}

.apply-slot {
  display: flex;
  align-items: flex-start;
  width: 100%;
  height: 100%;
  min-height: 80px;
}

.mch-no {
  color: hsl(var(--primary));
  font-weight: 600;
}

.mch-name {
  margin-left: 4px;
}

.amount-apply {
  color: hsl(var(--primary));
}

.amount-receive {
  color: hsl(142 71% 40%);
}

.apply-form__text {
  font-weight: 500;
}
</style>

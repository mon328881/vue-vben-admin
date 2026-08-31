<script lang="ts" setup>
import type { WorkbenchQuickNavItem } from '@vben/common-ui';
import type { TableColumnsType } from 'ant-design-vue';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  AnalysisChartCard,
  Page,
  WorkbenchHeader,
  WorkbenchQuickNav,
} from '@vben/common-ui';
import { preferences } from '@vben/preferences';
import { useUserStore } from '@vben/stores';
import { openWindow } from '@vben/utils';
import { Col, Radio, Row, Table, Tag } from 'ant-design-vue';

import {
  fetchAgentInfoApi,
  fetchMchInfoListApi,
  fetchPassageInfoListApi,
} from '#/api';
import type {
  AgentInfo,
  MchAgentRow,
  PassageInfoRow,
} from '#/api/types/business';
import { shiftYMD, todayYMD } from '#/utils/date-range';
import {
  amountSignedClass,
  formatDateTime,
  formatSuccessRate,
  formatYuan,
} from '#/utils/format';

import AgentTopMetrics from '../components/AgentTopMetrics.vue';

defineOptions({ name: 'AgentMainPage' });

type DayTab = '1' | '2';

const userStore = useUserStore();
const router = useRouter();

const info = ref<AgentInfo | null>(null);
const merchantsByDay = ref<Record<DayTab, MchAgentRow[]>>({ '1': [], '2': [] });
const passagesByDay = ref<Record<DayTab, PassageInfoRow[]>>({
  '1': [],
  '2': [],
});
const loading = ref(false);
const mchDay = ref<DayTab>('1');
const passageDay = ref<DayTab>('1');

const today = todayYMD();
const yesterday = shiftYMD(today, -1);

const displayName = computed(
  () =>
    userStore.userInfo?.realName ||
    userStore.userInfo?.username ||
    info.value?.agentName ||
    '代理同学',
);

const quickNavItems: WorkbenchQuickNavItem[] = [
  {
    color: '#1fdaca',
    icon: 'ant-design:shop-outlined',
    title: '代理商户',
    url: '/mchs',
  },
  {
    color: '#3fb27f',
    icon: 'ant-design:ordered-list-outlined',
    title: '商户订单',
    url: '/payOrder',
  },
  {
    color: '#e18525',
    icon: 'ant-design:apartment-outlined',
    title: '通道订单',
    url: '/passagePayOrder',
  },
  {
    color: '#bf0c2c',
    icon: 'ant-design:wallet-outlined',
    title: '预付记录',
    url: '/mchPrepaidHistory',
  },
  {
    color: '#4daf1bc9',
    icon: 'ant-design:swap-outlined',
    title: '资金流水',
    url: '/history',
  },
  {
    color: '#00d8ff',
    icon: 'ant-design:bar-chart-outlined',
    title: '日终统计',
    url: '/dayStat',
  },
];

function navTo(nav: WorkbenchQuickNavItem) {
  if (nav.url?.startsWith('http')) {
    openWindow(nav.url);
    return;
  }
  if (nav.url?.startsWith('/')) {
    router.push(nav.url).catch((error) => {
      console.error('Navigation failed:', error);
    });
  }
}

function dateOf(tab: DayTab) {
  return tab === '1' ? today : yesterday;
}

function sumMerchantAmount(rows: MchAgentRow[]) {
  return rows.reduce(
    (sum, row) => sum + Number(row.stat?.totalSuccessAmount ?? 0),
    0,
  );
}

const todayAmount = computed(() =>
  sumMerchantAmount(merchantsByDay.value['1']),
);
const yesterdayAmount = computed(() =>
  sumMerchantAmount(merchantsByDay.value['2']),
);

async function loadDay(tab: DayTab) {
  const date = dateOf(tab);
  const [m, p] = await Promise.all([
    fetchMchInfoListApi({ pageNumber: 1, pageSize: 1000, date }),
    fetchPassageInfoListApi({ pageNumber: 1, pageSize: 1000, date }),
  ]);
  merchantsByDay.value[tab] = m.records ?? [];
  passagesByDay.value[tab] = p.records ?? [];
}

async function load() {
  loading.value = true;
  try {
    info.value = await fetchAgentInfoApi();
    await Promise.all([loadDay('1'), loadDay('2')]);
  } finally {
    loading.value = false;
  }
}

const merchants = computed(() => merchantsByDay.value[mchDay.value]);
const passages = computed(() => passagesByDay.value[passageDay.value]);

const merchantColumns: TableColumnsType<MchAgentRow> = [
  { dataIndex: 'name', title: '商户号/名称', width: 230, ellipsis: true },
  { dataIndex: 'balance', title: '余额(￥)', width: 130, align: 'right' },
  { dataIndex: 'totalOrderCount', title: '总单量', width: 90, align: 'center' },
  {
    dataIndex: 'orderSuccessCount',
    title: '成交单量',
    width: 100,
    align: 'center',
  },
  { dataIndex: 'successRate', title: '成功率', width: 100, align: 'center' },
  { dataIndex: 'fee', title: '代理收入(￥)', width: 130, align: 'right' },
];

const passageColumns: TableColumnsType<PassageInfoRow> = [
  { dataIndex: 'name', title: '通道ID/名称', width: 230, ellipsis: true },
  { dataIndex: 'amount', title: '成交额(￥)', width: 120, align: 'right' },
  { dataIndex: 'totalOrderCount', title: '总单量', width: 90, align: 'center' },
  {
    dataIndex: 'orderSuccessCount',
    title: '成交单量',
    width: 100,
    align: 'center',
  },
  { dataIndex: 'successRate', title: '成功率', width: 100, align: 'center' },
  { dataIndex: 'fee', title: '代理收入(￥)', width: 130, align: 'right' },
];

onMounted(load);
</script>

<template>
  <Page auto-content-height>
    <div class="dashboard-base-page">
      <WorkbenchHeader
        class="mb-4"
        :avatar="userStore.userInfo?.avatar || preferences.app.defaultAvatar"
      >
        <template #title>
          你好，{{ displayName }}，开始今天的代理工作吧
        </template>
        <template #description>
          <span>
            {{ info?.agentNo || '—' }} ·
            <Tag
              class="ml-1 align-middle"
              :color="info?.state === 1 ? 'success' : 'error'"
            >
              {{ info?.state === 1 ? '启用' : '禁用' }}
            </Tag>
            <span v-if="info?.createdAt" class="ml-2 text-foreground/70">
              创建于 {{ formatDateTime(info.createdAt) }}
            </span>
          </span>
        </template>
        <template #actions>
          <span />
        </template>
      </WorkbenchHeader>

      <AgentTopMetrics
        class="mb-4"
        :info="info"
        :today-amount="todayAmount"
        :yesterday-amount="yesterdayAmount"
      />

      <WorkbenchQuickNav
        class="mb-4"
        title="快捷入口"
        :items="quickNavItems"
        @click="navTo"
      />

      <Row :gutter="[16, 16]">
        <Col :lg="12" :span="24">
          <AnalysisChartCard title="我的商户">
            <div class="chart-toolbar">
              <Radio.Group v-model:value="mchDay" button-style="solid" size="small">
                <Radio.Button value="1">今日</Radio.Button>
                <Radio.Button value="2">昨日</Radio.Button>
              </Radio.Group>
            </div>
            <Table
              :columns="merchantColumns"
              :data-source="merchants"
              :loading="loading"
              :pagination="{ pageSize: 10, showSizeChanger: true }"
              row-key="mchNo"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'name'">
                  <span class="text-primary font-semibold">
                    [{{ record.mchNo }}]
                  </span>
                  {{ record.mchName }}
                </template>
                <template v-else-if="column.dataIndex === 'balance'">
                  <b :class="amountSignedClass(record.balance)">
                    {{ formatYuan(record.balance) }}
                  </b>
                </template>
                <template v-else-if="column.dataIndex === 'totalOrderCount'">
                  {{ record.stat?.totalOrderCount ?? 0 }}
                </template>
                <template v-else-if="column.dataIndex === 'orderSuccessCount'">
                  {{ record.stat?.orderSuccessCount ?? 0 }}
                </template>
                <template v-else-if="column.dataIndex === 'successRate'">
                  <b>{{
                    formatSuccessRate(
                      record.stat?.orderSuccessCount,
                      record.stat?.totalOrderCount,
                    )
                  }}</b>
                </template>
                <template v-else-if="column.dataIndex === 'fee'">
                  <b>{{ formatYuan(record.stat?.totalAgentIncome) }}</b>
                </template>
              </template>
            </Table>
          </AnalysisChartCard>
        </Col>
        <Col :lg="12" :span="24">
          <AnalysisChartCard title="我的通道">
            <div class="chart-toolbar">
              <Radio.Group
                v-model:value="passageDay"
                button-style="solid"
                size="small"
              >
                <Radio.Button value="1">今日</Radio.Button>
                <Radio.Button value="2">昨日</Radio.Button>
              </Radio.Group>
            </div>
            <Table
              :columns="passageColumns"
              :data-source="passages"
              :loading="loading"
              :pagination="{ pageSize: 10, showSizeChanger: true }"
              row-key="payPassageId"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'name'">
                  <span class="text-primary font-semibold">
                    [{{ record.payPassageId }}]
                  </span>
                  {{ record.payPassageName }}
                </template>
                <template v-else-if="column.dataIndex === 'amount'">
                  <b :class="amountSignedClass(record.todayAmount)">
                    {{ formatYuan(record.todayAmount) }}
                  </b>
                </template>
                <template v-else-if="column.dataIndex === 'successRate'">
                  <b>{{
                    formatSuccessRate(
                      record.orderSuccessCount,
                      record.totalOrderCount,
                    )
                  }}</b>
                </template>
                <template v-else-if="column.dataIndex === 'fee'">
                  <b>{{ formatYuan(record.agentIncome) }}</b>
                </template>
              </template>
            </Table>
          </AnalysisChartCard>
        </Col>
      </Row>
    </div>
  </Page>
</template>

<style scoped>
.chart-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}
</style>

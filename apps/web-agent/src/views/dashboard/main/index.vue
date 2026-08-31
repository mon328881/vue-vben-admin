<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import {
  Card,
  Col,
  Descriptions,
  Radio,
  Row,
  Statistic,
  Table,
  Tag,
} from 'ant-design-vue';

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
import {
  shiftYMD,
  todayYMD,
} from '#/utils/date-range';
import {
  amountSignedClass,
  formatDateTime,
  formatSuccessRate,
  formatYuan,
} from '#/utils/format';

defineOptions({ name: 'AgentMainPage' });

type DayTab = '1' | '2';

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

function dateOf(tab: DayTab) {
  return tab === '1' ? today : yesterday;
}

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
  <Page auto-content-height title="主页">
    <Row :gutter="[16, 16]" class="mb-5">
      <Col :lg="6" :md="12" :span="24">
        <Card>
          <div class="text-muted-foreground mb-2 text-sm">账户余额</div>
          <Statistic
            :precision="2"
            :value="(info?.balance ?? 0) / 100"
            prefix="¥"
          />
        </Card>
      </Col>
      <Col :lg="6" :md="12" :span="24">
        <Card>
          <div class="text-muted-foreground mb-2 text-sm">代理信息</div>
          <Descriptions :column="1" size="small">
            <Descriptions.Item label="代理商号">
              {{ info?.agentNo || '—' }}
            </Descriptions.Item>
            <Descriptions.Item label="代理名称">
              {{ info?.agentName || '—' }}
            </Descriptions.Item>
            <Descriptions.Item label="登录名">
              {{ info?.loginUserName || '—' }}
            </Descriptions.Item>
            <Descriptions.Item label="代理状态">
              <Tag :color="info?.state === 1 ? 'success' : 'error'">
                {{ info?.state === 1 ? '启用' : '禁用' }}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {{ formatDateTime(info?.createdAt) }}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </Col>
      <Col :lg="6" :md="12" :span="24">
        <Card>
          <div class="text-muted-foreground mb-2 text-sm">商户数</div>
          <div class="text-3xl font-semibold">{{ info?.mchCount ?? 0 }}</div>
        </Card>
      </Col>
      <Col :lg="6" :md="12" :span="24">
        <Card>
          <div class="text-muted-foreground mb-2 text-sm">通道数</div>
          <div class="text-3xl font-semibold">{{ info?.passageCount ?? 0 }}</div>
        </Card>
      </Col>
    </Row>

    <Row :gutter="[16, 16]">
      <Col :lg="12" :span="24">
        <Card title="我的商户">
          <template #extra>
            <Radio.Group v-model:value="mchDay" button-style="solid">
              <Radio.Button value="1">今日</Radio.Button>
              <Radio.Button value="2">昨日</Radio.Button>
            </Radio.Group>
          </template>
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
                <span class="text-primary font-semibold">[{{ record.mchNo }}]</span>
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
        </Card>
      </Col>
      <Col :lg="12" :span="24">
        <Card title="我的通道">
          <template #extra>
            <Radio.Group v-model:value="passageDay" button-style="solid">
              <Radio.Button value="1">今日</Radio.Button>
              <Radio.Button value="2">昨日</Radio.Button>
            </Radio.Group>
          </template>
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
        </Card>
      </Col>
    </Row>
  </Page>
</template>

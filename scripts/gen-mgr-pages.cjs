const fs = require('fs');
const path = require('path');
const root = 'apps/web-mgr/src/views';

function write(rel, content) {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, 'utf8');
  console.log('wrote', rel);
}

function historyPage(cfg) {
  const {
    name,
    title,
    listApi,
    statApi,
    filters,
    columns,
    moneyFields,
    extraImports = '',
    cellExtras = '',
    rowKey,
  } = cfg;

  const filterFields = filters
    .map((f) => {
      if (f.type === 'select') {
        return `        <Form.Item>
          <Select
            v-model:value="query.${f.field}"
            allow-clear
            placeholder="${f.placeholder}"
            style="width: 140px"
            :options="${f.options}"
          />
        </Form.Item>`;
      }
      if (f.type === 'range') {
        return `        <Form.Item>
          <RangePicker
            v-model:value="dateRange"
            show-time
            value-format="YYYY-MM-DD HH:mm:ss"
            :placeholder="['${f.startPh}', '${f.endPh}']"
          />
        </Form.Item>`;
      }
      return `        <Form.Item>
          <Input v-model:value="query.${f.field}" allow-clear placeholder="${f.placeholder}" />
        </Form.Item>`;
    })
    .join('\n');

  const cols = columns
    .map(
      (c) =>
        `  { dataIndex: '${c.field}', title: '${c.title}'${c.width ? `, width: ${c.width}` : ''}${c.ellipsis ? ', ellipsis: true' : ''} },`,
    )
    .join('\n');

  const queryInit = filters
    .filter((f) => f.type !== 'range')
    .map((f) => {
      const def =
        f.default === undefined
          ? "''"
          : typeof f.default === 'string'
            ? `'${f.default}'`
            : JSON.stringify(f.default);
      return `  ${f.field}: ${def} as any,`;
    })
    .join('\n');

  const resetLines = filters
    .filter((f) => f.type !== 'range')
    .map((f) => {
      const def =
        f.default === undefined
          ? "''"
          : typeof f.default === 'string'
            ? `'${f.default}'`
            : JSON.stringify(f.default);
      return `  query.${f.field} = ${def};`;
    })
    .join('\n');

  const moneyCells = moneyFields
    .map(
      (f) => `          <template v-else-if="column.dataIndex === '${f}'">
            {{ formatYuan(record.${f} as number) }}
          </template>`,
    )
    .join('\n');

  const apis = statApi ? `${listApi}, ${statApi}` : listApi;
  const key = rowKey || columns[0].field;

  return `<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  RangePicker,
  Row,
  Select,
  Space,
  Statistic,
  Table,
} from 'ant-design-vue';

import { ${apis} } from '#/api';
${extraImports}
import { formatDateTime, formatYuan } from '#/utils/format';

defineOptions({ name: '${name}' });

const loading = ref(false);
const dataSource = ref<Record<string, unknown>[]>([]);
const total = ref(0);
const pagination = reactive({ current: 1, pageSize: 20 });
const dateRange = ref<[string, string] | undefined>();
const query = reactive({
${queryInit}
});
const stat = ref<{ totalAmount?: number; totalCount?: number }>({});

const columns: TableColumnsType = [
${cols}
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

async function loadStat() {
  try {
    ${statApi ? `stat.value = (await ${statApi}(buildParams())) ?? {};` : ''}
  } catch {
    // ignore
  }
}

async function loadData(resetPage = false) {
  if (resetPage) pagination.current = 1;
  loading.value = true;
  try {
    ${statApi ? 'void loadStat();' : ''}
    const page = await ${listApi}(buildParams());
    dataSource.value = (page?.records as Record<string, unknown>[]) ?? [];
    total.value = page?.total ?? 0;
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  void loadData(true);
}

function onReset() {
${resetLines}
  dateRange.value = undefined;
  void loadData(true);
}

function onTableChange(pag: { current?: number; pageSize?: number }) {
  pagination.current = pag.current ?? 1;
  pagination.pageSize = pag.pageSize ?? 20;
  void loadData();
}

onMounted(() => {
  void loadData(true);
});
</script>

<template>
  <Page auto-content-height title="${title}">
    <Card class="mb-4">
      <Form layout="inline" @finish="onSearch">
${filterFields}
        <Form.Item>
          <Space>
            <Button html-type="submit" type="primary">查询</Button>
            <Button @click="onReset">重置</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
${
  statApi
    ? `    <Row :gutter="[12, 12]" class="mb-4">
      <Col :md="6" :span="12">
        <Card size="small">
          <Statistic title="变更金额汇总" :value="formatYuan(stat.totalAmount)" />
        </Card>
      </Col>
      <Col :md="6" :span="12">
        <Card size="small">
          <Statistic title="记录条数" :value="stat.totalCount ?? 0" />
        </Card>
      </Col>
    </Row>`
    : ''
}
    <Card>
      <Table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="{
          current: pagination.current,
          pageSize: pagination.pageSize,
          showSizeChanger: true,
          showTotal: (t: number) => \`共 \${t} 条\`,
          total,
        }"
        :row-key="(r: any, i: number) => String(r.${key} ?? i)"
        size="middle"
        :scroll="{ x: 1200 }"
        @change="onTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="false" />
${moneyCells}
          <template v-else-if="column.dataIndex === 'createdAt'">
            {{ formatDateTime(record.createdAt as string) }}
          </template>
${cellExtras}
        </template>
      </Table>
    </Card>
  </Page>
</template>
`;
}

function statPage(cfg) {
  const {
    name,
    title,
    listApi,
    countApi,
    filters,
    columns,
    moneyFields,
    rateFields = [],
    extraImports = '',
    cellExtras = '',
    statsCards = [],
    defaultWeek = true,
  } = cfg;

  const filterFields = filters
    .map((f) => {
      if (f.type === 'range') {
        return `        <Form.Item>
          <RangePicker
            v-model:value="dateRange"
            show-time
            value-format="YYYY-MM-DD HH:mm:ss"
            :placeholder="['${f.startPh}', '${f.endPh}']"
          />
        </Form.Item>`;
      }
      return `        <Form.Item>
          <Input v-model:value="query.${f.field}" allow-clear placeholder="${f.placeholder}" />
        </Form.Item>`;
    })
    .join('\n');

  const cols = columns
    .map(
      (c) =>
        `  { dataIndex: '${c.field}', title: '${c.title}'${c.width ? `, width: ${c.width}` : ''}${c.ellipsis ? ', ellipsis: true' : ''} },`,
    )
    .join('\n');

  const queryInit = filters
    .filter((f) => f.type !== 'range')
    .map((f) => `  ${f.field}: '',`)
    .join('\n');

  const resetLines = filters
    .filter((f) => f.type !== 'range')
    .map((f) => `  query.${f.field} = '';`)
    .join('\n');

  const moneyCells = moneyFields
    .map(
      (f) => `          <template v-else-if="column.dataIndex === '${f}'">
            {{ formatYuan(record.${f} as number) }}
          </template>`,
    )
    .join('\n');

  const rateCells = rateFields
    .map(
      (f) => `          <template v-else-if="column.dataIndex === '${f}'">
            {{ formatRateDecimal(record.${f} as number) }}
          </template>`,
    )
    .join('\n');

  const cards = statsCards
    .map(
      (c) => `      <Col :md="6" :span="12">
        <Card size="small">
          <Statistic title="${c.title}" :value="${c.valueExpr}" />
        </Card>
      </Col>`,
    )
    .join('\n');

  return `<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  RangePicker,
  Row,
  Space,
  Statistic,
  Table,
} from 'ant-design-vue';

import { ${listApi}, ${countApi} } from '#/api';
${extraImports}
import { defaultWeekRange } from '#/utils/date-range';
import { formatDateTime, formatRateDecimal, formatYuan } from '#/utils/format';

defineOptions({ name: '${name}' });

const loading = ref(false);
const dataSource = ref<Record<string, unknown>[]>([]);
const total = ref(0);
const pagination = reactive({ current: 1, pageSize: 20 });
const dateRange = ref<[string, string] | undefined>(${defaultWeek ? 'defaultWeekRange()' : 'undefined'});
const query = reactive({
${queryInit}
});
const stat = ref<Record<string, any>>({});

const columns: TableColumnsType = [
${cols}
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

async function loadStat() {
  try {
    stat.value = (await ${countApi}(buildParams())) ?? {};
  } catch {
    // ignore
  }
}

async function loadData(resetPage = false) {
  if (resetPage) pagination.current = 1;
  loading.value = true;
  try {
    void loadStat();
    const page = await ${listApi}(buildParams());
    dataSource.value = (page?.records as Record<string, unknown>[]) ?? [];
    total.value = page?.total ?? 0;
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  void loadData(true);
}

function onReset() {
${resetLines}
  dateRange.value = ${defaultWeek ? 'defaultWeekRange()' : 'undefined'};
  void loadData(true);
}

function onTableChange(pag: { current?: number; pageSize?: number }) {
  pagination.current = pag.current ?? 1;
  pagination.pageSize = pag.pageSize ?? 20;
  void loadData();
}

onMounted(() => {
  void loadData(true);
});
</script>

<template>
  <Page auto-content-height title="${title}">
    <Card class="mb-4">
      <Form layout="inline" @finish="onSearch">
${filterFields}
        <Form.Item>
          <Space>
            <Button html-type="submit" type="primary">查询</Button>
            <Button @click="onReset">重置</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
    <Row :gutter="[12, 12]" class="mb-4">
${cards}
    </Row>
    <Card>
      <Table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="{
          current: pagination.current,
          pageSize: pagination.pageSize,
          showSizeChanger: true,
          showTotal: (t: number) => \`共 \${t} 条\`,
          total,
        }"
        :row-key="(_r: any, i: number) => String(i)"
        size="middle"
        :scroll="{ x: 1200 }"
        @change="onTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="false" />
${moneyCells}
${rateCells}
          <template v-else-if="column.dataIndex === 'createdAt'">
            {{ formatDateTime(record.createdAt as string) }}
          </template>
${cellExtras}
        </template>
      </Table>
    </Card>
  </Page>
</template>
`;
}

// History pages
write(
  'payconfig/mch-history/index.vue',
  historyPage({
    name: 'MchHistoryListPage',
    title: '商户资金流水',
    listApi: 'fetchMchHistoryApi',
    statApi: 'fetchMchHistoryStatApi',
    extraImports:
      "import { FUND_DIRECTION_OPTIONS, MCH_BIZ_TYPE_OPTIONS, bizTypeLabel } from '#/constants/merchant';",
    filters: [
      { type: 'range', startPh: '创建时间开始', endPh: '创建时间结束' },
      { field: 'mchNo', placeholder: '商户号' },
      { field: 'mchName', placeholder: '商户名' },
      { field: 'payOrderId', placeholder: '订单号' },
      {
        type: 'select',
        field: 'fundDirection',
        placeholder: '资金变动方向',
        options: 'FUND_DIRECTION_OPTIONS',
      },
      {
        type: 'select',
        field: 'bizType',
        placeholder: '业务类型',
        options: 'MCH_BIZ_TYPE_OPTIONS',
      },
    ],
    columns: [
      { field: 'mchNo', title: '商户号', width: 130 },
      { field: 'mchName', title: '商户名', width: 140, ellipsis: true },
      { field: 'beforeBalance', title: '变更前余额', width: 120 },
      { field: 'amount', title: '变更金额', width: 120 },
      { field: 'afterBalance', title: '变更后余额', width: 120 },
      { field: 'payOrderId', title: '订单号', width: 180 },
      { field: 'payOrderAmount', title: '订单金额', width: 110 },
      { field: 'bizType', title: '业务类型', width: 100 },
      { field: 'createdAt', title: '创建日期', width: 170 },
      { field: 'remark', title: '备注', ellipsis: true },
    ],
    moneyFields: ['beforeBalance', 'amount', 'afterBalance', 'payOrderAmount'],
    cellExtras: `          <template v-else-if="column.dataIndex === 'bizType'">
            {{ bizTypeLabel(record.bizType as any, MCH_BIZ_TYPE_OPTIONS) }}
          </template>`,
  }),
);

write(
  'payconfig/agent-history/index.vue',
  historyPage({
    name: 'AgentHistoryListPage',
    title: '代理资金流水',
    listApi: 'fetchAgentHistoryApi',
    statApi: 'fetchAgentHistoryStatApi',
    extraImports:
      "import { FUND_DIRECTION_OPTIONS, AGENT_BIZ_TYPE_OPTIONS, bizTypeLabel } from '#/constants/merchant';",
    filters: [
      { type: 'range', startPh: '创建时间开始', endPh: '创建时间结束' },
      { field: 'agentNo', placeholder: '代理商账号' },
      { field: 'agentName', placeholder: '代理商名称' },
      { field: 'payOrderId', placeholder: '订单号' },
      {
        type: 'select',
        field: 'fundDirection',
        placeholder: '资金变动方向',
        options: 'FUND_DIRECTION_OPTIONS',
      },
      {
        type: 'select',
        field: 'bizType',
        placeholder: '业务类型',
        options: 'AGENT_BIZ_TYPE_OPTIONS',
      },
    ],
    columns: [
      { field: 'agentName', title: '代理商名称', width: 140 },
      { field: 'agentNo', title: '代理商账号', width: 130 },
      { field: 'beforeBalance', title: '变更前余额', width: 120 },
      { field: 'amount', title: '变更金额', width: 120 },
      { field: 'afterBalance', title: '变更后余额', width: 120 },
      { field: 'payOrderId', title: '订单号', width: 180 },
      { field: 'bizType', title: '业务类型', width: 100 },
      { field: 'createdAt', title: '创建日期', width: 170 },
      { field: 'remark', title: '备注', ellipsis: true },
    ],
    moneyFields: ['beforeBalance', 'amount', 'afterBalance'],
    cellExtras: `          <template v-else-if="column.dataIndex === 'bizType'">
            {{ bizTypeLabel(record.bizType as any, AGENT_BIZ_TYPE_OPTIONS) }}
          </template>`,
  }),
);

write(
  'payconfig/passage-history/index.vue',
  historyPage({
    name: 'PassageHistoryListPage',
    title: '通道资金流水',
    listApi: 'fetchPassageHistoryApi',
    statApi: 'fetchPassageHistoryStatApi',
    extraImports:
      "import { FUND_DIRECTION_OPTIONS, PASSAGE_BIZ_TYPE_OPTIONS, bizTypeLabel } from '#/constants/merchant';",
    filters: [
      { type: 'range', startPh: '创建时间开始', endPh: '创建时间结束' },
      { field: 'payPassageName', placeholder: '通道名' },
      { field: 'payPassageId', placeholder: '通道ID' },
      { field: 'payOrderId', placeholder: '订单号' },
      {
        type: 'select',
        field: 'fundDirection',
        placeholder: '资金变动方向',
        options: 'FUND_DIRECTION_OPTIONS',
      },
      {
        type: 'select',
        field: 'bizType',
        placeholder: '业务类型',
        options: 'PASSAGE_BIZ_TYPE_OPTIONS',
      },
    ],
    columns: [
      { field: 'payPassageId', title: '通道ID', width: 110 },
      { field: 'payPassageName', title: '通道名', width: 160, ellipsis: true },
      { field: 'payOrderId', title: '订单号', width: 180 },
      { field: 'beforeBalance', title: '变更前余额', width: 120 },
      { field: 'amount', title: '变更金额', width: 120 },
      { field: 'afterBalance', title: '变更后余额', width: 120 },
      { field: 'bizType', title: '业务类型', width: 100 },
      { field: 'createdAt', title: '创建日期', width: 170 },
      { field: 'remark', title: '备注', ellipsis: true },
    ],
    moneyFields: ['beforeBalance', 'amount', 'afterBalance'],
    cellExtras: `          <template v-else-if="column.dataIndex === 'bizType'">
            {{ bizTypeLabel(record.bizType as any, PASSAGE_BIZ_TYPE_OPTIONS) }}
          </template>`,
  }),
);

write(
  'merchant/prepaid-history/index.vue',
  historyPage({
    name: 'MchPrepaidHistoryListPage',
    title: '商户预付流水',
    listApi: 'fetchMchPrepaidHistoryApi',
    statApi: 'fetchMchPrepaidHistoryStatApi',
    extraImports:
      "import { FUND_DIRECTION_OPTIONS } from '#/constants/merchant';",
    filters: [
      { type: 'range', startPh: '创建时间开始', endPh: '创建时间结束' },
      { field: 'mchNo', placeholder: '商户号' },
      { field: 'mchName', placeholder: '商户名称' },
      {
        type: 'select',
        field: 'fundDirection',
        placeholder: '资金变动方向',
        options: 'FUND_DIRECTION_OPTIONS',
      },
    ],
    columns: [
      { field: 'mchNo', title: '商户号', width: 130 },
      { field: 'mchName', title: '商户名称', width: 140 },
      { field: 'beforeBalance', title: '变更前余额', width: 120 },
      { field: 'amount', title: '变更金额', width: 120 },
      { field: 'afterBalance', title: '变更后余额', width: 120 },
      { field: 'createdAt', title: '创建日期', width: 170 },
      { field: 'createdUid', title: '操作员', width: 100 },
      { field: 'remark', title: '备注', ellipsis: true },
    ],
    moneyFields: ['beforeBalance', 'amount', 'afterBalance'],
  }),
);

write(
  'payconfig/passage-prepaid-history/index.vue',
  historyPage({
    name: 'PassageGroupPrepaidHistoryListPage',
    title: '供应商预付流水',
    listApi: 'fetchPassagePrepaidHistoryApi',
    statApi: 'fetchPassagePrepaidHistoryStatApi',
    extraImports:
      "import { FUND_DIRECTION_OPTIONS } from '#/constants/merchant';",
    filters: [
      { type: 'range', startPh: '创建时间开始', endPh: '创建时间结束' },
      { field: 'passageGroupName', placeholder: '供应商名称' },
      {
        type: 'select',
        field: 'fundDirection',
        placeholder: '资金变动方向',
        options: 'FUND_DIRECTION_OPTIONS',
      },
    ],
    columns: [
      { field: 'passageGroupName', title: '供应商名称', width: 160 },
      { field: 'beforeBalance', title: '变更前余额', width: 120 },
      { field: 'amount', title: '变更金额', width: 120 },
      { field: 'afterBalance', title: '变更后余额', width: 120 },
      { field: 'createdAt', title: '创建日期', width: 170 },
      { field: 'createdUid', title: '操作员', width: 100 },
      { field: 'remark', title: '备注', ellipsis: true },
    ],
    moneyFields: ['beforeBalance', 'amount', 'afterBalance'],
  }),
);

// Stat pages
const stats = [
  {
    rel: 'payconfig/plat-stat/index.vue',
    name: 'PlatStatPage',
    title: '平台统计',
    listApi: 'fetchPlatStatApi',
    countApi: 'fetchPlatStatCountApi',
    filters: [{ type: 'range', startPh: '创建时间开始', endPh: '创建时间结束' }],
    columns: [
      { field: 'createdAt', title: '日期', width: 120 },
      { field: 'totalSuccessAmount', title: '成交额', width: 120 },
      { field: 'platTotalIncome', title: '平台收入', width: 120 },
      { field: 'successRate', title: '支付成功率', width: 110 },
      { field: 'totalOrderCount', title: '订单总笔数', width: 110 },
      { field: 'orderSuccessCount', title: '成交笔数', width: 100 },
    ],
    moneyFields: ['totalSuccessAmount', 'platTotalIncome'],
    rateFields: ['successRate'],
    statsCards: [
      { title: '成交订单金额', valueExpr: 'formatYuan(stat.totalSuccessAmount)' },
      { title: '成交订单数', valueExpr: 'stat.totalSuccessCount ?? 0' },
      { title: '平台利润', valueExpr: 'formatYuan(stat.totalIncome)' },
    ],
  },
  {
    rel: 'payconfig/mch-stat/index.vue',
    name: 'MchStatPage',
    title: '商户统计',
    listApi: 'fetchMchStatApi',
    countApi: 'fetchMchStatCountApi',
    filters: [
      { type: 'range', startPh: '创建时间开始', endPh: '创建时间结束' },
      { field: 'mchName', placeholder: '商户名称' },
      { field: 'mchNo', placeholder: '商户号' },
    ],
    columns: [
      { field: 'createdAt', title: '日期', width: 120 },
      { field: 'mchName', title: '商户名', width: 140 },
      { field: 'totalSuccessAmount', title: '成交金额', width: 120 },
      { field: 'totalMchCost', title: '手续费', width: 110 },
      { field: 'platTotalIncome', title: '平台收入', width: 110 },
      { field: 'totalOrderCount', title: '订单总笔数', width: 110 },
      { field: 'orderSuccessCount', title: '成交笔数', width: 100 },
      { field: 'successRate', title: '支付成功率', width: 110 },
    ],
    moneyFields: ['totalSuccessAmount', 'totalMchCost', 'platTotalIncome'],
    rateFields: ['successRate'],
    statsCards: [
      { title: '成交订单金额', valueExpr: 'formatYuan(stat.totalSuccessAmount)' },
      { title: '成交订单数', valueExpr: 'stat.totalSuccessCount ?? 0' },
      { title: '商户手续费', valueExpr: 'formatYuan(stat.totalMchCost)' },
      { title: '平台收入', valueExpr: 'formatYuan(stat.platTotalIncome)' },
    ],
  },
  {
    rel: 'payconfig/mch-product-stat/index.vue',
    name: 'MchProductStatPage',
    title: '商户产品统计',
    listApi: 'fetchMchProductStatApi',
    countApi: 'fetchMchProductStatCountApi',
    filters: [
      { type: 'range', startPh: '创建时间开始', endPh: '创建时间结束' },
      { field: 'mchName', placeholder: '商户名称' },
      { field: 'mchNo', placeholder: '商户号' },
      { field: 'productName', placeholder: '产品名称' },
      { field: 'productId', placeholder: '对应产品' },
    ],
    columns: [
      { field: 'createdAt', title: '日期', width: 120 },
      { field: 'mchName', title: '商户名', width: 140 },
      { field: 'totalSuccessAmount', title: '成交金额', width: 120 },
      { field: 'totalCost', title: '手续费', width: 110 },
      { field: 'platTotalIncome', title: '平台收入', width: 110 },
      { field: 'productName', title: '产品类型', width: 120 },
      { field: 'totalOrderCount', title: '订单总笔数', width: 110 },
      { field: 'orderSuccessCount', title: '成交笔数', width: 100 },
      { field: 'successRate', title: '支付成功率', width: 110 },
    ],
    moneyFields: ['totalSuccessAmount', 'totalCost', 'platTotalIncome'],
    rateFields: ['successRate'],
    statsCards: [
      { title: '成交订单金额', valueExpr: 'formatYuan(stat.totalSuccessAmount)' },
      { title: '成交订单数', valueExpr: 'stat.totalSuccessCount ?? 0' },
      { title: '手续费', valueExpr: 'formatYuan(stat.totalCost)' },
      { title: '平台收入', valueExpr: 'formatYuan(stat.platTotalIncome)' },
    ],
  },
  {
    rel: 'payconfig/passage-stat/index.vue',
    name: 'PassageStatPage',
    title: '通道统计',
    listApi: 'fetchPassageStatApi',
    countApi: 'fetchPassageStatCountApi',
    filters: [
      { type: 'range', startPh: '创建时间开始', endPh: '创建时间结束' },
      { field: 'payPassageName', placeholder: '通道名' },
      { field: 'payPassageId', placeholder: '对应通道' },
      { field: 'productId', placeholder: '对应产品' },
      { field: 'passageGroupName', placeholder: '通道供应商' },
    ],
    columns: [
      { field: 'createdAt', title: '日期', width: 120 },
      { field: 'payPassageName', title: '通道名', width: 160 },
      { field: 'totalSuccessAmount', title: '成交金额', width: 120 },
      { field: 'totalPassageCost', title: '通道成本', width: 110 },
      { field: 'productName', title: '产品类型', width: 120 },
      { field: 'totalOrderCount', title: '订单总笔数', width: 110 },
      { field: 'orderSuccessCount', title: '成交笔数', width: 100 },
      { field: 'successRate', title: '支付成功率', width: 110 },
    ],
    moneyFields: ['totalSuccessAmount', 'totalPassageCost'],
    rateFields: ['successRate'],
    statsCards: [
      { title: '成交订单金额', valueExpr: 'formatYuan(stat.totalSuccessAmount)' },
      { title: '成交订单数', valueExpr: 'stat.totalSuccessCount ?? 0' },
      { title: '通道成本', valueExpr: 'formatYuan(stat.totalCost)' },
    ],
  },
  {
    rel: 'payconfig/product-stat/index.vue',
    name: 'ProductStatPage',
    title: '产品统计',
    listApi: 'fetchProductStatApi',
    countApi: 'fetchProductStatCountApi',
    filters: [
      { type: 'range', startPh: '创建时间开始', endPh: '创建时间结束' },
      { field: 'productId', placeholder: '对应产品' },
    ],
    columns: [
      { field: 'createdAt', title: '日期', width: 120 },
      { field: 'productName', title: '产品类型', width: 140 },
      { field: 'totalSuccessAmount', title: '成交金额', width: 120 },
      { field: 'totalAmount', title: '订单总额', width: 120 },
      { field: 'platTotalIncome', title: '平台收入', width: 110 },
      { field: 'successRate', title: '支付成功率', width: 110 },
      { field: 'totalOrderCount', title: '订单总笔数', width: 110 },
      { field: 'orderSuccessCount', title: '成交笔数', width: 100 },
    ],
    moneyFields: ['totalSuccessAmount', 'totalAmount', 'platTotalIncome'],
    rateFields: ['successRate'],
    statsCards: [
      { title: '成交订单金额', valueExpr: 'formatYuan(stat.totalSuccessAmount)' },
      { title: '成交订单数', valueExpr: 'stat.totalSuccessCount ?? 0' },
      { title: '平台收入', valueExpr: 'formatYuan(stat.platTotalIncome)' },
    ],
  },
  {
    rel: 'payconfig/agent-stat/index.vue',
    name: 'AgentStatPage',
    title: '代理统计',
    listApi: 'fetchAgentStatApi',
    countApi: 'fetchAgentStatCountApi',
    filters: [
      { type: 'range', startPh: '创建时间开始', endPh: '创建时间结束' },
      { field: 'agentName', placeholder: '代理名称' },
      { field: 'agentNo', placeholder: '代理商号' },
    ],
    columns: [
      { field: 'createdAt', title: '日期', width: 120 },
      { field: 'agentNo', title: '代理号', width: 120 },
      { field: 'agentName', title: '代理名称', width: 140 },
      { field: 'totalSuccessAmount', title: '成交金额', width: 120 },
      { field: 'totalAmount', title: '订单金额', width: 120 },
      { field: 'totalAgentIncome', title: '代理分润', width: 110 },
      { field: 'successRate', title: '支付成功率', width: 110 },
      { field: 'totalOrderCount', title: '订单总笔数', width: 110 },
      { field: 'orderSuccessCount', title: '成交笔数', width: 100 },
    ],
    moneyFields: ['totalSuccessAmount', 'totalAmount', 'totalAgentIncome'],
    rateFields: ['successRate'],
    statsCards: [
      { title: '成交订单金额', valueExpr: 'formatYuan(stat.totalSuccessAmount)' },
      { title: '成交订单数', valueExpr: 'stat.totalSuccessCount ?? 0' },
      { title: '代理分润', valueExpr: 'formatYuan(stat.totalAgentIncome)' },
    ],
  },
];

for (const s of stats) {
  write(s.rel, statPage(s));
}

console.log('done batch1');

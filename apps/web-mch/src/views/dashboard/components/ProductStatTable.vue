<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { computed, ref, watch } from 'vue';

import { Radio, Table } from 'ant-design-vue';

import { fetchProductStatPageApi } from '#/api';
import type { MchProductStat } from '#/api/types/business';
import {
  amountSignedClass,
  formatSuccessRate,
  formatYuan,
} from '#/utils/format';

defineOptions({ name: 'ProductStatTable' });

const statRadio = ref<'1' | '2'>('1');
const list = ref<MchProductStat[]>([]);
const total = ref(0);
const pageNumber = ref(1);
const pageSize = ref(10);
const loading = ref(false);

const statDate = computed(() => {
  const d = new Date();
  if (statRadio.value === '2') d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
});

const columns: TableColumnsType<MchProductStat> = [
  { dataIndex: 'name', title: '产品ID/名称', ellipsis: true },
  { dataIndex: 'totalSuccessAmount', title: '成交额', width: 130 },
  { dataIndex: 'totalOrderCount', title: '总单量', width: 90 },
  { dataIndex: 'orderSuccessCount', title: '成交单量', width: 90 },
  { dataIndex: 'successRate', title: '成功率', width: 90 },
  { dataIndex: 'totalCost', title: '服务费', width: 110 },
];

async function load() {
  loading.value = true;
  try {
    const data = await fetchProductStatPageApi(
      pageNumber.value,
      pageSize.value,
      statDate.value,
    );
    list.value = data.records ?? [];
    total.value = data.total ?? 0;
  } catch (error) {
    console.error('加载产品统计失败', error);
  } finally {
    loading.value = false;
  }
}

async function onPageChange(current: number, size: number) {
  pageNumber.value = current;
  pageSize.value = size;
  await load();
}

watch(statRadio, () => {
  pageNumber.value = 1;
  void load();
});

defineExpose({ load });
</script>

<template>
  <div>
    <div class="table-toolbar">
      <Radio.Group v-model:value="statRadio" size="small">
        <Radio.Button value="1">今日</Radio.Button>
        <Radio.Button value="2">昨日</Radio.Button>
      </Radio.Group>
    </div>

    <Table
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :pagination="{
        current: pageNumber,
        pageSize,
        total,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50'],
      }"
      row-key="id"
      size="small"
      @change="
        (p) => onPageChange(p.current ?? 1, p.pageSize ?? 10)
      "
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'name'">
          <b>[{{ record.productId }}]</b> {{ record.productName }}
        </template>
        <template v-else-if="column.dataIndex === 'totalSuccessAmount'">
          <b :class="amountSignedClass(record.totalSuccessAmount)">
            {{ formatYuan(record.totalSuccessAmount) }}
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
        <template v-else-if="column.dataIndex === 'totalCost'">
          {{ formatYuan(record.totalCost) }}
        </template>
      </template>
    </Table>
  </div>
</template>

<style scoped>
.table-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.amount-positive {
  color: hsl(142 71% 40%);
}

.amount-negative {
  color: hsl(var(--destructive));
}
</style>

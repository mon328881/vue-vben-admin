<script lang="ts" setup>
import { computed, ref } from 'vue';

import { doPassagePayTestApi, type PayPassage } from '#/api';
import PayTestDrawerBase from '#/components/list/PayTestDrawerBase.vue';

defineOptions({ name: 'PassagePayTestDrawer' });

const visible = ref(false);
const passage = ref<PayPassage | null>(null);
const drawerRef = ref<{ resetState: () => void } | null>(null);

const hasProduct = computed(() => {
  const row = passage.value;
  if (!row) return false;
  return (
    String(row.productId ?? '').trim() !== '' ||
    String(row.productName ?? '').trim() !== ''
  );
});

function show(row: PayPassage) {
  passage.value = row;
  drawerRef.value?.resetState();
  visible.value = true;
}

function beforeSubmit() {
  return passage.value?.payPassageId ? null : '通道信息无效';
}

async function submitRequest(payload: {
  testOrderNo: string;
  amount: number;
  testOrderIn: number;
}) {
  return doPassagePayTestApi({
    testOrderNo: payload.testOrderNo,
    passageId: Number(passage.value?.payPassageId),
    amount: payload.amount,
    testOrderIn: payload.testOrderIn,
    productId: passage.value?.productId,
  });
}

defineExpose({ show });
</script>

<template>
  <PayTestDrawerBase
    ref="drawerRef"
    v-model="visible"
    title="通道下单测试"
    selector-label="当前通道"
    description="【启用】订单挂到测试商户，可走完整回调流程；【禁用】不入库，仅测三方是否能正常拉起。"
    show-test-order-in
    :before-submit="beforeSubmit"
    :submit-request="submitRequest"
  >
    <template #selector>
      <div v-if="passage?.payPassageId != null" class="current-passage">
        <div class="current-passage__main">
          <span class="current-passage__id">[{{ passage.payPassageId }}]</span>
          <span class="current-passage__name">{{
            passage.payPassageName || '—'
          }}</span>
        </div>
        <div v-if="hasProduct" class="current-passage__product">
          <span class="current-passage__product-id"
            >[{{ passage.productId || '—' }}]</span
          >
          <span class="current-passage__product-name">{{
            passage.productName || '—'
          }}</span>
        </div>
      </div>
    </template>
  </PayTestDrawerBase>
</template>

<style scoped>
.current-passage__main,
.current-passage__product {
  display: flex;
  gap: 8px;
  align-items: center;
}

.current-passage__id,
.current-passage__product-id {
  color: hsl(var(--primary));
}
</style>

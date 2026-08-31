<script lang="ts" setup>
import { ref } from 'vue';

import { doMchPayTestApi } from '#/api';
import type { MchInfo } from '#/api/types/business';
import PayTestDrawerBase from '#/components/list/PayTestDrawerBase.vue';
import PassageSelector from '#/components/selectors/PassageSelector.vue';

defineOptions({ name: 'MchPassageTestDrawer' });

const visible = ref(false);
const mchNo = ref('');
const passageId = ref<number | undefined>();
const drawerRef = ref<{ resetState: () => void } | null>(null);

function resetPassage() {
  passageId.value = undefined;
}

function show(row: MchInfo) {
  mchNo.value = row.mchNo;
  resetPassage();
  drawerRef.value?.resetState();
  visible.value = true;
}

function beforeSubmit() {
  if (passageId.value === undefined || Number.isNaN(Number(passageId.value))) {
    return '请先选择要测试的通道';
  }
  if (!mchNo.value) {
    return '商户号不存在，无法下单测试';
  }
  return null;
}

async function submitRequest(payload: {
  testOrderNo: string;
  amount: number;
}) {
  return doMchPayTestApi({
    testOrderNo: payload.testOrderNo,
    passageId: Number(passageId.value),
    amount: payload.amount,
    mchNo: mchNo.value,
  });
}

defineExpose({ show });
</script>

<template>
  <PayTestDrawerBase
    ref="drawerRef"
    v-model="visible"
    title="商户-通道下单测试"
    selector-label="请选择通道"
    description="在此处下单测试将模拟商户真实拉单，订单将自动入库。"
    :before-submit="beforeSubmit"
    :submit-request="submitRequest"
  >
    <template #selector>
      <PassageSelector
        v-model="passageId"
        placeholder="选择通道"
        style="width: 100%"
      />
    </template>
  </PayTestDrawerBase>
</template>

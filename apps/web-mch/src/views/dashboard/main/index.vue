<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { Col, Row } from 'ant-design-vue';

import { fetchMchInfoApi } from '#/api';
import type { MchInfoDetail } from '#/api/types/business';

import MchInfoCard from '../components/MchInfoCard.vue';
import ProductStatTable from '../components/ProductStatTable.vue';
import TopMetrics from '../components/TopMetrics.vue';

defineOptions({ name: 'MainDashboard' });

const loading = ref(false);
const mch = ref<MchInfoDetail | null>(null);
const productStatRef = ref<InstanceType<typeof ProductStatTable>>();

async function loadMchInfo() {
  loading.value = true;
  try {
    const data = await fetchMchInfoApi();
    mch.value = data?.mchInfo ?? null;
  } catch (error) {
    console.error('加载商户信息失败', error);
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await loadMchInfo();
  await productStatRef.value?.load();
});
</script>

<template>
  <Page auto-content-height title="主页">
    <TopMetrics class="mb-4" />

    <Row :gutter="[16, 16]">
      <Col :lg="16" :span="24">
        <ProductStatTable ref="productStatRef" />
      </Col>
      <Col :lg="8" :span="24">
        <MchInfoCard :loading="loading" :mch="mch" />
      </Col>
    </Row>
  </Page>
</template>

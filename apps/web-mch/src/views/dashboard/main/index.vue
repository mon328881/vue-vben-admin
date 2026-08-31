<script lang="ts" setup>
import type { WorkbenchQuickNavItem } from '@vben/common-ui';

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
import { Col, Row } from 'ant-design-vue';

import { fetchMchInfoApi } from '#/api';
import type { MchInfoDetail } from '#/api/types/business';

import MchInfoCard from '../components/MchInfoCard.vue';
import ProductStatTable from '../components/ProductStatTable.vue';
import TopMetrics from '../components/TopMetrics.vue';

defineOptions({ name: 'MainDashboard' });

const userStore = useUserStore();
const router = useRouter();
const loading = ref(false);
const mch = ref<MchInfoDetail | null>(null);
const productStatRef = ref<InstanceType<typeof ProductStatTable>>();

const displayName = computed(
  () =>
    userStore.userInfo?.realName ||
    userStore.userInfo?.username ||
    mch.value?.mchName ||
    '商户同学',
);

const quickNavItems: WorkbenchQuickNavItem[] = [
  {
    color: '#1fdaca',
    icon: 'ant-design:ordered-list-outlined',
    title: '订单管理',
    url: '/pay',
  },
  {
    color: '#3fb27f',
    icon: 'ant-design:swap-outlined',
    title: '资金流水',
    url: '/history',
  },
  {
    color: '#e18525',
    icon: 'ant-design:appstore-outlined',
    title: '支付产品',
    url: '/apps',
  },
  {
    color: '#bf0c2c',
    icon: 'ant-design:bar-chart-outlined',
    title: '日终统计',
    url: '/dayStat',
  },
  {
    color: '#4daf1bc9',
    icon: 'ant-design:red-envelope-outlined',
    title: '结算管理',
    url: '/division',
  },
  {
    color: '#00d8ff',
    icon: 'ant-design:user-outlined',
    title: '个人中心',
    url: '/current/userinfo',
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
  <Page auto-content-height>
    <div class="dashboard-base-page">
      <WorkbenchHeader
        class="mb-4"
        :avatar="userStore.userInfo?.avatar || preferences.app.defaultAvatar"
      >
        <template #title>
          你好，{{ displayName }}，开始今天的收款工作吧
        </template>
        <template #description>
          查看成交、产品表现与账户信息，快速进入常用业务页
        </template>
        <template #actions>
          <span />
        </template>
      </WorkbenchHeader>

      <TopMetrics class="mb-4" />

      <WorkbenchQuickNav
        class="mb-4"
        title="快捷入口"
        :items="quickNavItems"
        @click="navTo"
      />

      <Row :gutter="[16, 16]" class="dashboard-bottom">
        <Col :lg="16" :span="24" class="dashboard-bottom__col">
          <div class="dashboard-bottom__card-wrap">
            <AnalysisChartCard title="支付产品统计">
              <ProductStatTable ref="productStatRef" />
            </AnalysisChartCard>
          </div>
        </Col>
        <Col :lg="8" :span="24" class="dashboard-bottom__col">
          <div class="dashboard-bottom__card-wrap">
            <AnalysisChartCard title="商户信息">
              <MchInfoCard :loading="loading" :mch="mch" />
            </AnalysisChartCard>
          </div>
        </Col>
      </Row>
    </div>
  </Page>
</template>

<style scoped>
.dashboard-bottom__col {
  display: flex;
}

.dashboard-bottom__card-wrap {
  display: flex;
  flex: 1 1 auto;
  width: 100%;
  min-height: 100%;
}

.dashboard-bottom__card-wrap :deep([data-slot='card']) {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.dashboard-bottom__card-wrap :deep([data-slot='card-content']) {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
}

.dashboard-bottom__card-wrap :deep(.ant-spin-nested-loading),
.dashboard-bottom__card-wrap :deep(.ant-spin-container) {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  height: 100%;
}
</style>

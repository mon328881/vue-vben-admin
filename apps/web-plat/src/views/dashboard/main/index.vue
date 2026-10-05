<script lang="ts" setup>
import type { WorkbenchQuickNavItem } from '@vben/common-ui';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { preferences } from '@vben/preferences';
import { useUserStore } from '@vben/stores';

import { Avatar, Card, Col, Row, Statistic } from 'ant-design-vue';

import {
  fetchDistributeRecordsApi,
  fetchPayIfDefinesApi,
  fetchPlatUsersApi,
  fetchTenantsApi,
} from '#/api';
import { PLAT_ENT } from '#/constants/entitlements';
import { hasEnt, isAdmin } from '#/utils/access';

defineOptions({ name: 'PlatMainPage' });

const userStore = useUserStore();
const router = useRouter();

const loading = ref(false);
const tenantTotal = ref(0);
const tenantActive = ref(0);
const ifTotal = ref(0);
const distributeTotal = ref(0);
const userTotal = ref(0);
const showUsers = computed(() => isAdmin());

const quickNav = computed<WorkbenchQuickNavItem[]>(() => {
  const items: WorkbenchQuickNavItem[] = [];
  if (hasEnt(PLAT_ENT.TENANT_VIEW)) {
    items.push({
      color: '#3b82f6',
      icon: 'lucide:building',
      title: '运营租户',
      url: '/tenant/list',
    });
  }
  if (hasEnt(PLAT_ENT.IF_VIEW)) {
    items.push({
      color: '#10b981',
      icon: 'lucide:waypoints',
      title: '接口定义',
      url: '/pay-if/list',
    });
  }
  if (isAdmin()) {
    items.push({
      color: '#0ea5e9',
      icon: 'lucide:users',
      title: '管理账号',
      url: '/system/users',
    });
  }
  if (hasEnt(PLAT_ENT.AUDIT)) {
    items.push({
      color: '#64748b',
      icon: 'lucide:file-clock',
      title: '操作日志',
      url: '/system/audit-log',
    });
  }
  return items;
});

async function load() {
  loading.value = true;
  try {
    const [tenants, defines, logs, users] = await Promise.all([
      fetchTenantsApi(),
      fetchPayIfDefinesApi(),
      fetchDistributeRecordsApi(),
      isAdmin() ? fetchPlatUsersApi() : Promise.resolve({ total: 0, records: [] }),
    ]);
    tenantTotal.value = tenants.total;
    tenantActive.value = tenants.records.filter((item) => item.state === 1).length;
    ifTotal.value = defines.total;
    distributeTotal.value = logs.total;
    userTotal.value = users.total;
  } finally {
    loading.value = false;
  }
}

function onNav(item: WorkbenchQuickNavItem) {
  if (item.url) router.push(item.url);
}

onMounted(load);
</script>

<template>
  <Page auto-content-height title="首页">
    <div class="ap-page-stack">
      <Card :bordered="false" class="ap-page-form">
        <div class="home-hello">
          <Avatar
            :size="48"
            :src="userStore.userInfo?.avatar || preferences.app.defaultAvatar"
          />
          <div>
            <h2 class="ap-section-title">
              你好，{{ userStore.userInfo?.realName || '超管' }}
            </h2>
            <p class="ap-section-desc">
              管理运营租户，维护支付接口 Schema 并下发到各运营端。
            </p>
          </div>
        </div>
      </Card>

      <Row :gutter="[14, 14]">
        <Col :lg="6" :span="12">
          <Card :bordered="false" class="ap-page-form home-kpi">
            <div class="home-kpi__label">运营租户</div>
            <Statistic :loading="loading" :value="tenantTotal" suffix="个" />
            <div class="home-kpi__hint">启用中 {{ tenantActive }}</div>
          </Card>
        </Col>
        <Col :lg="6" :span="12">
          <Card :bordered="false" class="ap-page-form home-kpi">
            <div class="home-kpi__label">支付接口</div>
            <Statistic :loading="loading" :value="ifTotal" suffix="个" />
            <div class="home-kpi__hint">Schema 由超管统一定义</div>
          </Card>
        </Col>
        <Col :lg="6" :span="12">
          <Card :bordered="false" class="ap-page-form home-kpi">
            <div class="home-kpi__label">下发记录</div>
            <Statistic :loading="loading" :value="distributeTotal" suffix="条" />
            <div class="home-kpi__hint">累计下发任务</div>
          </Card>
        </Col>
        <Col v-if="showUsers" :lg="6" :span="12">
          <Card :bordered="false" class="ap-page-form home-kpi">
            <div class="home-kpi__label">管理账号</div>
            <Statistic :loading="loading" :value="userTotal" suffix="个" />
            <div class="home-kpi__hint">平台层操作员</div>
          </Card>
        </Col>
      </Row>

      <Card :bordered="false" class="ap-page-form">
        <div class="ap-section-head">
          <h3 class="ap-section-title">快捷入口</h3>
        </div>
        <div v-if="quickNav.length" class="home-nav">
          <button
            v-for="item in quickNav"
            :key="item.title"
            class="home-nav__item"
            type="button"
            @click="onNav(item)"
          >
            <IconifyIcon
              :icon="item.icon"
              class="home-nav__icon"
              :style="{ color: item.color }"
            />
            <span>{{ item.title }}</span>
          </button>
        </div>
      </Card>
    </div>
  </Page>
</template>

<style scoped>
.home-hello {
  display: flex;
  gap: 16px;
  align-items: center;
}

.home-kpi :deep(.ant-statistic-content) {
  font-size: 28px;
  line-height: 1.2;
}

.home-kpi__label {
  margin-bottom: 8px;
  font-size: 13px;
  line-height: 20px;
  color: hsl(var(--muted-foreground));
}

.home-kpi__hint {
  margin-top: 8px;
  font-size: 12px;
  line-height: 18px;
  color: hsl(var(--muted-foreground));
}

.home-nav {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.home-nav__item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: center;
  min-height: 88px;
  padding: 16px 12px;
  font-size: 13px;
  line-height: 20px;
  cursor: pointer;
  background: hsl(var(--muted) / 25%);
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
}

.home-nav__item:hover {
  background: hsl(var(--primary) / 6%);
  border-color: hsl(var(--primary) / 40%);
}

.home-nav__icon {
  font-size: 22px;
}
</style>

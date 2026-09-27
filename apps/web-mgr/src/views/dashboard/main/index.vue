<script lang="ts" setup>
import type { SystemInfo } from '#/api';

/**
 * 主页：KPI → 今日分析 → 排名/监控 → 轻量快捷入口
 */
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { Page, WorkbenchHeader } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { preferences } from '@vben/preferences';
import { useUserStore } from '@vben/stores';
import { openWindow } from '@vben/utils';

import { Popover } from 'ant-design-vue';

import { fetchSystemInfoApi } from '#/api';
import { formatYuan } from '#/utils/format';

import DashboardRankList from '../components/RankList.vue';
import DashboardTodayInsight from '../components/TodayInsight.vue';
import DashboardTopPanel from '../components/TopPanel.vue';

defineOptions({ name: 'MainDashboard' });

const LEASE_COOKIE_HOURS = 6;
const BALANCE_WARN = 500 * 100;
const EXPIRE_WARN_MS = 3 * 24 * 60 * 60 * 1000;

interface QuickNavItem {
  color: string;
  icon: string;
  title: string;
  url: string;
}

const userStore = useUserStore();
const router = useRouter();
const systemInfo = ref<null | SystemInfo>(null);
const popupVisible = ref(false);

const displayName = computed(
  () =>
    userStore.userInfo?.realName || userStore.userInfo?.username || '运营同学',
);

const quickNavItems: QuickNavItem[] = [
  {
    color: '#1fdaca',
    icon: 'ant-design:ordered-list-outlined',
    title: '支付订单',
    url: '/pay',
  },
  {
    color: '#3fb27f',
    icon: 'ant-design:shop-outlined',
    title: '商户列表',
    url: '/mch',
  },
  {
    color: '#e18525',
    icon: 'ant-design:appstore-outlined',
    title: '通道列表',
    url: '/apps',
  },
  {
    color: '#bf0c2c',
    icon: 'ant-design:wallet-outlined',
    title: '商户预付流水',
    url: '/mchPrepaidHistory',
  },
  {
    color: '#4daf1bc9',
    icon: 'ant-design:account-book-outlined',
    title: '供应商预付流水',
    url: '/passageGroupPrepaidHistory',
  },
  {
    color: '#00d8ff',
    icon: 'ant-design:bar-chart-outlined',
    title: '平台统计',
    url: '/platStat',
  },
];

function navTo(nav: QuickNavItem) {
  if (nav.url.startsWith('http')) {
    openWindow(nav.url);
    return;
  }
  if (nav.url.startsWith('/')) {
    router.push(nav.url).catch((error) => {
      console.error('Navigation failed:', error);
    });
  }
}

const typeLabel = computed(() => {
  const type = systemInfo.value?.type;
  if (type === 1) return '包月用户';
  if (type === 2) return '流水扣费';
  return '永久有效';
});

const leaseCorner = computed(() => {
  const info = systemInfo.value;
  if (!info) return null;
  if (info.type === 1) {
    return {
      prefix: '用户类型：',
      typeLabel: typeLabel.value,
      balanceLabel: '',
      balanceValue: '',
      expireLabel: ' 到期时间 ',
      expireValue: String(info.expireDate ?? '--').slice(0, 10),
    };
  }
  if (info.type === 2) {
    return {
      prefix: '用户类型：',
      typeLabel: typeLabel.value,
      balanceLabel: ' 当前余额 ',
      balanceValue: formatYuan(info.balance),
      expireLabel: ' 到期时间 ',
      expireValue: String(info.expireDate ?? '--').slice(0, 10),
    };
  }
  return {
    prefix: '用户类型：',
    typeLabel: typeLabel.value,
    balanceLabel: '',
    balanceValue: '',
    expireLabel: '',
    expireValue: '',
  };
});

const leaseFlags = computed(() => {
  const info = systemInfo.value;
  if (!info || (info.type !== 1 && info.type !== 2)) {
    return { insufficientBalance: false, expiringSoon: false };
  }
  const expireMs = info.expireDate
    ? new Date(info.expireDate).getTime()
    : Number.NaN;
  const expiringSoon =
    Number.isFinite(expireMs) && expireMs - Date.now() <= EXPIRE_WARN_MS;
  const insufficientBalance =
    info.type === 2 && (info.balance ?? 0) < BALANCE_WARN;
  return { insufficientBalance, expiringSoon };
});

const leaseMessage = computed(() => {
  const info = systemInfo.value;
  if (!info) return '';
  const balanceText = `当前余额 ${formatYuan(info.balance)}`;
  const expireText = `到期时间 ${String(info.expireDate ?? '--').slice(0, 10)}`;
  if (leaseFlags.value.insufficientBalance && leaseFlags.value.expiringSoon) {
    return `系统余额不足，且有效期不足 3 天。${balanceText}，${expireText}，请尽快处理。`;
  }
  if (leaseFlags.value.insufficientBalance) {
    return `系统余额不足。${balanceText}，请及时充值。`;
  }
  if (leaseFlags.value.expiringSoon) {
    return `系统有效期不足 3 天。${expireText}，请及时续期。`;
  }
  return '';
});

function leaseCookieKey() {
  const name = String(
    userStore.userInfo?.username || userStore.userInfo?.realName || '',
  ).trim();
  return name ? `dashboard-system-lease-tooltip-${name}` : null;
}

function isLeaseDismissed() {
  const key = leaseCookieKey();
  if (!key) return false;
  const raw = localStorage.getItem(key);
  if (!raw) return false;
  const until = Number(raw);
  return Number.isFinite(until) && Date.now() <= until;
}

function closeLeasePopup() {
  popupVisible.value = false;
  const key = leaseCookieKey();
  if (key) {
    localStorage.setItem(
      key,
      String(Date.now() + LEASE_COOKIE_HOURS * 3600 * 1000),
    );
  }
}

async function ensureSystemInfoLoaded() {
  if (systemInfo.value) return;
  try {
    systemInfo.value = (await fetchSystemInfoApi()) ?? null;
  } catch (error) {
    console.error('获取系统信息失败:', error);
  }
}

const leaseActive = computed(
  () => leaseFlags.value.insufficientBalance || leaseFlags.value.expiringSoon,
);

watch(
  [
    leaseActive,
    () =>
      String(
        userStore.userInfo?.username || userStore.userInfo?.realName || '',
      ).trim(),
  ],
  ([active, username]) => {
    if (!username || !active) {
      popupVisible.value = false;
      return;
    }
    if (!isLeaseDismissed()) popupVisible.value = true;
  },
  { immediate: true },
);

onMounted(() => {
  void ensureSystemInfoLoaded();
});
</script>

<template>
  <Page>
    <div class="dashboard-base-page">
      <WorkbenchHeader
        class="row-container dashboard-header"
        :avatar="userStore.userInfo?.avatar || preferences.app.defaultAvatar"
      >
        <template #title>
          你好，{{ displayName }}，开始今天的运营工作吧
        </template>
        <template #description> 实时概览成交、通道与商户表现 </template>
        <template #actions>
          <!-- 租约信息放欢迎区右侧：与账号身份同层，避免沉在页底 -->
          <Popover
            v-if="leaseCorner"
            v-model:open="popupVisible"
            placement="bottomRight"
            trigger="click"
            :overlay-style="{ maxWidth: '420px' }"
          >
            <template #content>
              <div class="lease-reminder-popup">
                <div class="lease-reminder-popup__header">
                  <span class="lease-reminder-popup__title">系统提醒</span>
                  <button
                    type="button"
                    class="lease-reminder-popup__close"
                    @click="closeLeasePopup"
                  >
                    ×
                  </button>
                </div>
                <div class="lease-reminder-popup__body">{{ leaseMessage }}</div>
              </div>
            </template>
            <div class="dashboard-lease-meta">
              <span>{{ leaseCorner.prefix }}</span>
              <span class="dashboard-lease-meta__type">{{
                leaseCorner.typeLabel
              }}</span>
              <template v-if="leaseCorner.balanceLabel">
                <span class="dashboard-lease-meta__sep">·</span>
                <span>{{ leaseCorner.balanceLabel.trim() }}</span>
                <span
                  :class="{
                    'dashboard-lease-meta__highlight':
                      leaseFlags.insufficientBalance,
                  }"
                >
                  {{ leaseCorner.balanceValue }}
                </span>
              </template>
              <template v-if="leaseCorner.expireLabel">
                <span class="dashboard-lease-meta__sep">·</span>
                <span>{{ leaseCorner.expireLabel.trim() }}</span>
                <span
                  :class="{
                    'dashboard-lease-meta__highlight': leaseFlags.expiringSoon,
                  }"
                >
                  {{ leaseCorner.expireValue }}
                </span>
              </template>
            </div>
          </Popover>
        </template>
      </WorkbenchHeader>

      <DashboardTopPanel class="row-container" />

      <DashboardTodayInsight class="row-container" />

      <DashboardRankList class="row-container dashboard-rank" />

      <section class="row-container quick-nav" aria-label="快捷入口">
        <div class="quick-nav__label">快捷入口</div>
        <div class="quick-nav__list">
          <button
            v-for="item in quickNavItems"
            :key="item.title"
            type="button"
            class="quick-nav__item"
            @click="navTo(item)"
          >
            <span
              class="quick-nav__icon"
              :style="{ color: item.color, background: `${item.color}18` }"
            >
              <IconifyIcon :icon="item.icon" class="size-4" />
            </span>
            <span class="quick-nav__title">{{ item.title }}</span>
          </button>
        </div>
      </section>
    </div>
  </Page>
</template>

<style scoped>
.dashboard-base-page {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.row-container {
  margin-bottom: 0;
}

.dashboard-header :deep(.flex) {
  align-items: center;
}

.dashboard-rank :deep([data-slot='card']) {
  border-color: hsl(var(--border) / 70%);
}

.dashboard-rank :deep([data-slot='card-title']) {
  font-size: 1.05rem;
  font-weight: 650;
  letter-spacing: -0.01em;
}

.quick-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: center;
  padding: 12px 14px;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border) / 70%);
  border-radius: 12px;
}

.quick-nav__label {
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 600;
  color: hsl(var(--muted-foreground));
}

.quick-nav__list {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

.quick-nav__item {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  padding: 6px 10px 6px 6px;
  cursor: pointer;
  background: hsl(var(--background) / 55%);
  border: 1px solid hsl(var(--border) / 65%);
  border-radius: 999px;
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease,
    transform 0.18s ease;
}

.quick-nav__item:hover {
  background: hsl(var(--primary) / 6%);
  border-color: hsl(var(--primary) / 35%);
  transform: translateY(-1px);
}

.quick-nav__icon {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 999px;
}

.quick-nav__title {
  font-size: 13px;
  color: hsl(var(--foreground));
  white-space: nowrap;
}

.dashboard-lease-meta {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px 6px;
  align-items: center;
  justify-content: flex-end;
  max-width: min(420px, 100%);
  padding: 6px 10px;
  font-size: 12px;
  line-height: 1.4;
  color: hsl(var(--muted-foreground));
  text-align: right;
  overflow-wrap: anywhere;
  cursor: default;
  background: hsl(var(--background) / 60%);
  border: 1px solid hsl(var(--border) / 70%);
  border-radius: 999px;
}

.dashboard-lease-meta__type {
  font-weight: 600;
  color: hsl(var(--foreground));
}

.dashboard-lease-meta__sep {
  opacity: 0.45;
}

.dashboard-lease-meta__highlight {
  font-weight: 700;
  color: hsl(var(--destructive));
}

.lease-reminder-popup {
  min-width: 280px;
  max-width: 420px;
  padding: 4px 2px;
}

.lease-reminder-popup__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.lease-reminder-popup__title {
  font-weight: 600;
  color: hsl(var(--foreground));
}

.lease-reminder-popup__close {
  font-size: 18px;
  line-height: 1;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  background: transparent;
  border: 0;
}

.lease-reminder-popup__body {
  font-size: 13px;
  line-height: 1.6;
  color: hsl(var(--foreground));
}
</style>

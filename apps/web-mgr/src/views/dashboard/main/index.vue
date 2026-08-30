<script lang="ts" setup>
/**
 * 对齐旧端 MainPage：
 * TopPanel（六卡 KPI）+ RankList（排名/并发 + 通道监控）+ 租赁到期提醒
 */
import { computed, onMounted, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';
import { Popover } from 'ant-design-vue';

import { fetchSystemInfoApi, type SystemInfo } from '#/api';

import DashboardRankList from '../components/RankList.vue';
import DashboardTopPanel from '../components/TopPanel.vue';

defineOptions({ name: 'MainDashboard' });

const LEASE_COOKIE_HOURS = 6;
const BALANCE_WARN = 500 * 100;
const EXPIRE_WARN_MS = 3 * 24 * 60 * 60 * 1000;

const userStore = useUserStore();
const systemInfo = ref<SystemInfo | null>(null);
const popupVisible = ref(false);

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
      balanceValue: ((info.balance ?? 0) / 100).toFixed(2),
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
  const balanceText = `当前余额 ${(info.balance ?? 0) / 100} 元`;
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
      <DashboardTopPanel class="row-container" />
      <DashboardRankList class="row-container" />

      <Popover
        v-if="leaseCorner"
        v-model:open="popupVisible"
        placement="topLeft"
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
        <div class="dashboard-lease-corner">
          <span>{{ leaseCorner.prefix }}</span>
          <span>{{ leaseCorner.typeLabel }}</span>
          <template v-if="leaseCorner.balanceLabel">
            <span>{{ leaseCorner.balanceLabel }}</span>
            <span
              :class="{
                'dashboard-lease-corner__highlight':
                  leaseFlags.insufficientBalance,
              }"
            >
              {{ leaseCorner.balanceValue }}
            </span>
          </template>
          <template v-if="leaseCorner.expireLabel">
            <span>{{ leaseCorner.expireLabel }}</span>
            <span
              :class="{
                'dashboard-lease-corner__highlight': leaseFlags.expiringSoon,
              }"
            >
              {{ leaseCorner.expireValue }}
            </span>
          </template>
        </div>
      </Popover>
    </div>
  </Page>
</template>

<style scoped>
.dashboard-base-page {
  position: relative;
  padding-bottom: 36px;
}

.row-container:not(:last-child) {
  margin-bottom: 16px;
}

.dashboard-lease-corner {
  max-width: min(560px, 100%);
  font-size: 12px;
  color: hsl(var(--muted-foreground));
  line-height: 1.5;
  word-break: break-word;
  margin-top: 8px;
  cursor: default;
}

.dashboard-lease-corner__highlight {
  color: hsl(var(--destructive));
  font-weight: 700;
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
  border: 0;
  background: transparent;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  color: hsl(var(--muted-foreground));
}

.lease-reminder-popup__body {
  font-size: 13px;
  line-height: 1.6;
  color: hsl(var(--foreground));
}
</style>

<script lang="ts" setup>
import type { ThemeConfig } from 'ant-design-vue/es/config-provider/context';

import type { CashierProduct } from '#/api/modules/cashier';

import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { IconifyIcon } from '@vben/icons';

import {
  theme as antTheme,
  Button,
  ConfigProvider,
  InputNumber,
  message,
  Select,
} from 'ant-design-vue';

import { fetchCashierProductListApi, placeCashierOrderRawApi } from '#/api';
import { formatYuanWithSymbol } from '#/utils/format';

defineOptions({ name: 'CashierPage' });

const route = useRoute();

const mchNoFromUrl = computed(() => String(route.query.mchNo || '').trim());
const secretFromUrl = computed(() => String(route.query.secret || '').trim());
const publicMode = computed(
  () => !!mchNoFromUrl.value && !!secretFromUrl.value,
);

const loading = ref(false);
const paying = ref(false);
const loadError = ref('');

const products = ref<CashierProduct[]>([]);
const amountYuan = ref<number | undefined>(undefined);
const productId = ref<number>();
const payType = ref<1 | 2 | 3>(1);
const created = ref(false);
const payData = ref('');
const mchOrderNo = ref('');

const cashierTheme: ThemeConfig = {
  algorithm: antTheme.defaultAlgorithm,
  token: {
    colorPrimary: '#0052d9',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorText: '#0f172a',
    colorTextSecondary: '#475569',
    colorBorder: '#e2e8f0',
    colorBorderSecondary: '#e2e8f0',
    borderRadius: 8,
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, "PingFang SC", "Noto Sans SC", sans-serif',
    controlHeight: 44,
  },
};

let htmlThemeClass = '';
let htmlColorScheme = '';

function lockPublicLightTheme() {
  const html = document.documentElement;
  htmlThemeClass = html.className;
  htmlColorScheme = html.style.colorScheme;
  html.classList.remove('dark');
  html.classList.add('light');
  html.style.colorScheme = 'light';
}

function restoreTheme() {
  const html = document.documentElement;
  if (htmlThemeClass) html.className = htmlThemeClass;
  html.style.colorScheme = htmlColorScheme;
}

const payModes = [
  {
    value: 1 as const,
    label: '链接跳转',
    hint: '打开付款页',
    icon: 'lucide:external-link',
  },
  {
    value: 2 as const,
    label: '手机扫码',
    hint: '展示二维码',
    icon: 'lucide:qr-code',
  },
  {
    value: 3 as const,
    label: '仅测试',
    hint: '只验证拉起',
    icon: 'lucide:flask-conical',
  },
];

const canSubmit = computed(
  () =>
    productId.value !== null &&
    productId.value !== undefined &&
    amountYuan.value !== null &&
    amountYuan.value !== undefined &&
    Number(amountYuan.value) > 0 &&
    !Number.isNaN(Number(amountYuan.value)),
);

const productOptions = computed(() =>
  products.value.map((p) => ({
    label: `[${p.productId}] ${p.productName}`,
    value: Number(p.productId),
  })),
);

const selectedProduct = computed(() =>
  products.value.find((p) => Number(p.productId) === Number(productId.value)),
);

const productPlaceholder = computed(() => {
  if (loading.value) return '加载支付产品中...';
  if (products.value.length === 0) return '暂无可用支付产品';
  if (products.value.length === 1) return '已自动选择唯一支付产品';
  return '请选择支付产品';
});

const amountLabel = computed(() => {
  if (
    amountYuan.value === null ||
    amountYuan.value === undefined ||
    Number.isNaN(Number(amountYuan.value))
  ) {
    return '¥0.00';
  }
  return formatYuanWithSymbol(Math.round(Number(amountYuan.value) * 100));
});

const payButtonText = computed(() => {
  if (payType.value === 1) return '生成付款链接';
  if (payType.value === 2) return '生成付款二维码';
  return '测试拉起';
});

const qrSrc = computed(() => {
  if (!payData.value) return '';
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(absolutePayUrl(payData.value))}`;
});

function absolutePayUrl(raw: string) {
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${window.location.origin}${raw.startsWith('/') ? raw : `/${raw}`}`;
}

function yuanToCent(value?: number) {
  if (value === null || value === undefined) return 0;
  return Math.round(Number.parseFloat(String(value)) * 100);
}

function errorText(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === 'object' && 'msg' in error) {
    const msg = (error as { msg?: unknown }).msg;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  return fallback;
}

async function loadProducts() {
  if (!mchNoFromUrl.value || !secretFromUrl.value) return;
  loading.value = true;
  loadError.value = '';
  try {
    const list = await fetchCashierProductListApi(
      mchNoFromUrl.value,
      secretFromUrl.value,
    );
    products.value = Array.isArray(list) ? list : [];
    if (products.value.length === 1) {
      productId.value = Number(products.value[0]?.productId);
    }
  } catch (error) {
    loadError.value = errorText(error, '获取支付产品失败');
    products.value = [];
  } finally {
    loading.value = false;
  }
}

async function createPay() {
  if (
    !canSubmit.value ||
    productId.value === null ||
    productId.value === undefined
  )
    return;
  paying.value = true;
  try {
    const n = await placeCashierOrderRawApi({
      amount: yuanToCent(amountYuan.value),
      mchNo: mchNoFromUrl.value,
      productId: Number(productId.value),
      secret: secretFromUrl.value,
    });
    if (n && n.code === 0 && n.data && n.data.orderState === 1) {
      created.value = true;
      payData.value = n.data.payData || '';
      mchOrderNo.value = n.data.mchOrderNo || '';
      if (payType.value === 1) {
        message.success('拉起成功，即将自动跳转');
        setTimeout(() => openPay(), 1000);
      } else if (payType.value === 2) {
        message.success('二维码已生成');
      } else {
        message.success('测试拉起成功');
      }
    } else {
      message.error(n?.data?.errMsg || n?.msg || '出码失败');
    }
  } catch {
    // 线上契约：请求异常（含缺参 401 空体）静默
  } finally {
    paying.value = false;
  }
}

function openPay() {
  if (!payData.value) return;
  window.open(absolutePayUrl(payData.value), '_blank');
}

async function copyPayData() {
  const text = payData.value ? absolutePayUrl(payData.value) : '';
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    message.success('链接已复制');
  } catch {
    message.error('复制失败');
  }
}

function resetCreated() {
  amountYuan.value = undefined;
  if (products.value.length !== 1) productId.value = undefined;
  created.value = false;
  payData.value = '';
  mchOrderNo.value = '';
}

onMounted(() => {
  lockPublicLightTheme();
  if (publicMode.value) void loadProducts();
});

onUnmounted(() => {
  restoreTheme();
});
</script>

<template>
  <ConfigProvider :theme="cashierTheme">
    <div class="cashier">
      <main class="cashier__shell">
        <article class="cashier__card" aria-labelledby="cashier-title">
          <header class="cashier__header">
            <div class="cashier__brand">
              <span class="cashier__mark" aria-hidden="true">A</span>
              <div>
                <h1 id="cashier-title" class="cashier__title">收银台</h1>
                <p class="cashier__sub">
                  <template v-if="mchNoFromUrl">
                    商户 {{ mchNoFromUrl }}
                  </template>
                  <template v-else>亚洲支付</template>
                </p>
              </div>
            </div>
            <p class="cashier__secure">
              <IconifyIcon icon="lucide:lock" class="cashier__secure-icon" />
              加密传输
            </p>
          </header>

          <div
            v-if="loading"
            class="cashier__body"
            aria-busy="true"
            aria-live="polite"
          >
            <div class="cashier__skeleton cashier__skeleton--lg"></div>
            <div class="cashier__skeleton"></div>
            <div class="cashier__skeleton"></div>
            <div class="cashier__skeleton cashier__skeleton--btn"></div>
            <p class="cashier__hint">正在加载支付产品…</p>
          </div>

          <div v-else-if="!publicMode" class="cashier__empty" role="status">
            <IconifyIcon icon="lucide:link-2-off" class="cashier__empty-icon" />
            <h2 class="cashier__empty-title">无法打开收银台</h2>
            <p class="cashier__empty-text">
              请从运营端复制完整收银台地址，链接需包含商户号和密钥。
            </p>
          </div>

          <div v-else-if="loadError" class="cashier__empty" role="alert">
            <IconifyIcon
              icon="lucide:circle-alert"
              class="cashier__empty-icon"
            />
            <h2 class="cashier__empty-title">暂时无法收款</h2>
            <p class="cashier__empty-text">{{ loadError }}</p>
            <Button type="primary" @click="loadProducts">重新加载</Button>
          </div>

          <form
            v-else-if="!created"
            class="cashier__body"
            @submit.prevent="createPay"
          >
            <section class="cashier__amount" aria-label="应付金额">
              <p class="cashier__amount-label">应付金额</p>
              <p class="cashier__amount-value">{{ amountLabel }}</p>
            </section>

            <label class="cashier__field">
              <span class="cashier__label">支付产品</span>
              <Select
                v-model:value="productId"
                :disabled="products.length <= 1"
                :options="productOptions"
                :placeholder="productPlaceholder"
                size="large"
              />
              <span v-if="products.length === 1" class="cashier__hint">
                已自动选择唯一产品
              </span>
            </label>

            <label class="cashier__field">
              <span class="cashier__label">订单金额</span>
              <InputNumber
                v-model:value="amountYuan"
                :min="0.01"
                :max="999999"
                :precision="2"
                :step="1"
                :controls="false"
                size="large"
                class="cashier__amount-input"
                placeholder="0.00"
                addon-before="¥"
              />
            </label>

            <fieldset class="cashier__field">
              <legend class="cashier__label">支付方式</legend>
              <div
                class="cashier__modes"
                role="radiogroup"
                aria-label="支付方式"
              >
                <button
                  v-for="mode in payModes"
                  :key="mode.value"
                  type="button"
                  class="cashier__mode"
                  :class="{ 'is-active': payType === mode.value }"
                  role="radio"
                  :aria-checked="payType === mode.value"
                  @click="payType = mode.value"
                >
                  <IconifyIcon :icon="mode.icon" class="cashier__mode-icon" />
                  <span class="cashier__mode-label">{{ mode.label }}</span>
                  <span class="cashier__mode-hint">{{ mode.hint }}</span>
                </button>
              </div>
            </fieldset>

            <Button
              block
              type="primary"
              size="large"
              html-type="submit"
              class="cashier__cta"
              :disabled="!canSubmit"
              :loading="paying"
            >
              {{ payButtonText }}
            </Button>
          </form>

          <div v-else class="cashier__result">
            <div class="cashier__ok" aria-hidden="true">
              <IconifyIcon icon="lucide:check" />
            </div>
            <h2 class="cashier__result-title">订单已拉起</h2>
            <p class="cashier__amount-value cashier__amount-value--sm">
              {{ amountLabel }}
            </p>
            <dl class="cashier__meta">
              <div>
                <dt>支付产品</dt>
                <dd>{{ selectedProduct?.productName || '—' }}</dd>
              </div>
              <div>
                <dt>商户单号</dt>
                <dd>{{ mchOrderNo || '—' }}</dd>
              </div>
            </dl>

            <div v-if="payType === 2" class="cashier__qr">
              <img
                v-if="qrSrc"
                :src="qrSrc"
                width="180"
                height="180"
                alt="付款二维码"
              />
              <p class="cashier__hint">请使用手机扫描二维码完成支付</p>
            </div>

            <a
              v-if="payData"
              class="cashier__link"
              :href="absolutePayUrl(payData)"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ absolutePayUrl(payData) }}
            </a>

            <div class="cashier__actions">
              <Button
                v-if="payType !== 2"
                type="primary"
                size="large"
                block
                @click="openPay"
              >
                打开付款页面
              </Button>
              <Button size="large" block @click="copyPayData">复制链接</Button>
              <Button
                type="link"
                block
                class="cashier__again"
                @click="resetCreated"
              >
                再下一单
              </Button>
            </div>
          </div>
        </article>

        <p class="cashier__foot">支付技术由亚洲支付提供</p>
      </main>
    </div>
  </ConfigProvider>
</template>

<style scoped>
.cashier {
  --cashier-bg: #eef2f6;
  --cashier-card: #fff;
  --cashier-ink: #0f172a;
  --cashier-muted: #64748b;
  --cashier-line: #e2e8f0;
  --cashier-primary: #0052d9;
  --cashier-primary-soft: rgb(0 82 217 / 8%);
  --cashier-ok: #0f766e;

  min-height: 100vh;
  min-height: 100dvh;
  color: var(--cashier-ink);
  color-scheme: light;
  background:
    radial-gradient(
      1200px 420px at 50% -80px,
      rgb(0 82 217 / 12%),
      transparent 60%
    ),
    var(--cashier-bg);
}

.cashier__shell {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  min-height: 100dvh;
  padding: max(16px, env(safe-area-inset-top)) 16px
    max(24px, env(safe-area-inset-bottom));
}

.cashier__card {
  width: 100%;
  max-width: 420px;
  padding: 24px;
  background: var(--cashier-card);
  border: 1px solid var(--cashier-line);
  border-radius: 12px;
  box-shadow:
    0 1px 2px rgb(15 23 42 / 4%),
    0 12px 32px rgb(15 23 42 / 6%);
}

.cashier__header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
  padding-bottom: 20px;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--cashier-line);
}

.cashier__brand {
  display: flex;
  gap: 12px;
  align-items: center;
  min-width: 0;
}

.cashier__mark {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  background: var(--cashier-primary);
  border-radius: 8px;
}

.cashier__title {
  margin: 0;
  font-size: 18px;
  font-weight: 650;
  line-height: 1.3;
  letter-spacing: -0.02em;
}

.cashier__sub {
  margin: 2px 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  line-height: 1.4;
  color: var(--cashier-muted);
  white-space: nowrap;
}

.cashier__secure {
  display: inline-flex;
  flex-shrink: 0;
  gap: 4px;
  align-items: center;
  margin: 0;
  font-size: 12px;
  font-weight: 500;
  color: var(--cashier-ok);
}

.cashier__secure-icon {
  width: 14px;
  height: 14px;
}

.cashier__body,
.cashier__result {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cashier__amount {
  padding: 16px;
  text-align: center;
  background: var(--cashier-primary-soft);
  border-radius: 8px;
}

.cashier__amount-label {
  margin: 0 0 4px;
  font-size: 12px;
  color: var(--cashier-muted);
  letter-spacing: 0.04em;
}

.cashier__amount-value {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.15;
  letter-spacing: -0.04em;
}

.cashier__amount-value--sm {
  font-size: 24px;
}

.cashier__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0;
  margin: 0;
  border: 0;
}

.cashier__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--cashier-ink);
}

.cashier__amount-input {
  width: 100%;
}

.cashier :deep(.ant-select-selector),
.cashier :deep(.ant-input-number),
.cashier :deep(.ant-input-number-input),
.cashier :deep(.ant-input-number-group-addon) {
  color: var(--cashier-ink) !important;
  background: #fff !important;
  border-color: var(--cashier-line) !important;
}

.cashier :deep(.ant-btn-primary:disabled),
.cashier :deep(.ant-btn-primary[disabled]) {
  color: #fff !important;
  background: #94a3b8 !important;
  border-color: #94a3b8 !important;
  opacity: 1;
}

.cashier__hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--cashier-muted);
}

.cashier__modes {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.cashier__mode {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  min-height: 76px;
  padding: 10px 6px;
  color: var(--cashier-ink);
  text-align: center;
  cursor: pointer;
  background: #f8fafc;
  border: 1px solid var(--cashier-line);
  border-radius: 8px;
  transition:
    border-color 180ms ease,
    background-color 180ms ease,
    box-shadow 180ms ease;
}

.cashier__mode:hover {
  border-color: rgb(0 82 217 / 40%);
}

.cashier__mode:focus-visible {
  outline: 2px solid var(--cashier-primary);
  outline-offset: 2px;
}

.cashier__mode.is-active {
  background: var(--cashier-primary-soft);
  border-color: var(--cashier-primary);
  box-shadow: inset 0 0 0 1px var(--cashier-primary);
}

.cashier__mode-icon {
  width: 18px;
  height: 18px;
  color: var(--cashier-primary);
}

.cashier__mode-label {
  font-size: 12px;
  font-weight: 650;
  line-height: 1.3;
}

.cashier__mode-hint {
  font-size: 11px;
  line-height: 1.3;
  color: var(--cashier-muted);
}

.cashier__cta {
  height: 48px;
  margin-top: 4px;
  font-weight: 650;
}

.cashier__empty {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  padding: 24px 8px 8px;
  text-align: center;
}

.cashier__empty-icon {
  width: 28px;
  height: 28px;
  color: var(--cashier-muted);
}

.cashier__empty-title {
  margin: 8px 0 0;
  font-size: 16px;
  font-weight: 650;
}

.cashier__empty-text {
  max-width: 32ch;
  margin: 0 0 8px;
  font-size: 13px;
  line-height: 1.55;
  color: var(--cashier-muted);
}

.cashier__ok {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  margin: 8px auto 0;
  color: #fff;
  background: var(--cashier-ok);
  border-radius: 999px;
}

.cashier__ok :deep(svg) {
  width: 20px;
  height: 20px;
}

.cashier__result-title {
  margin: 0;
  font-size: 18px;
  font-weight: 650;
  text-align: center;
}

.cashier__meta {
  display: grid;
  gap: 12px;
  padding: 12px 0 0;
  margin: 0;
  border-top: 1px solid var(--cashier-line);
}

.cashier__meta div {
  display: flex;
  gap: 12px;
  justify-content: space-between;
  font-size: 13px;
}

.cashier__meta dt {
  color: var(--cashier-muted);
}

.cashier__meta dd {
  margin: 0;
  font-weight: 550;
  text-align: right;
  word-break: break-all;
}

.cashier__qr {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  padding: 16px;
  background: #f8fafc;
  border: 1px solid var(--cashier-line);
  border-radius: 8px;
}

.cashier__qr img {
  display: block;
  width: 180px;
  height: 180px;
  background: #fff;
}

.cashier__link {
  font-size: 12px;
  line-height: 1.5;
  color: var(--cashier-primary);
  word-break: break-all;
}

.cashier__actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cashier__again {
  height: 44px;
}

.cashier__foot {
  margin: 16px 0 0;
  font-size: 12px;
  color: var(--cashier-muted);
}

.cashier__skeleton {
  height: 44px;
  background: linear-gradient(90deg, #eef2f6 25%, #f8fafc 37%, #eef2f6 63%);
  background-size: 400% 100%;
  border-radius: 8px;
  animation: cashier-shimmer 1.2s ease-in-out infinite;
}

.cashier__skeleton--lg {
  height: 88px;
}

.cashier__skeleton--btn {
  height: 48px;
}

@keyframes cashier-shimmer {
  0% {
    background-position: 100% 0;
  }

  100% {
    background-position: 0 0;
  }
}

@media (max-width: 380px) {
  .cashier__card {
    padding: 20px 16px;
  }

  .cashier__amount-value {
    font-size: 28px;
  }

  .cashier__mode-hint {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cashier__mode,
  .cashier__skeleton {
    transition: none;
    animation: none;
  }
}
</style>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { IconifyIcon } from '@vben/icons';
import {
  Button,
  Empty,
  Form,
  InputNumber,
  Radio,
  Select,
  Space,
  Spin,
  message,
} from 'ant-design-vue';

import {
  fetchCashierOrderApi,
  fetchCashierProductListApi,
  payCashierOrderApi,
  placeCashierOrderApi,
} from '#/api';
import type { CashierOrder, CashierProduct } from '#/api/modules/cashier';
import { formatYuan } from '#/utils/format';

defineOptions({ name: 'CashierPage' });

const route = useRoute();

const payOrderId = computed(() => String(route.query.payOrderId || ''));
const mchNoFromUrl = computed(() => String(route.query.mchNo || ''));
const secretFromUrl = computed(() => String(route.query.secret || ''));
const publicMode = computed(
  () => !payOrderId.value && !!mchNoFromUrl.value && !!secretFromUrl.value,
);

const order = ref<CashierOrder | null>(null);
const loading = ref(false);
const paying = ref(false);
const paid = ref(false);

const products = ref<CashierProduct[]>([]);
const amountYuan = ref<number>();
const productId = ref<number>();
const payType = ref<1 | 2 | 3>(1);
const created = ref(false);
const payData = ref('');
const mchOrderNo = ref('');

const canSubmit = computed(
  () =>
    productId.value != null &&
    amountYuan.value != null &&
    Number(amountYuan.value) > 0 &&
    !Number.isNaN(Number(amountYuan.value)),
);

const productOptions = computed(() =>
  products.value.map((p) => ({
    label: p.productName,
    value: Number(p.productId),
  })),
);

const productPlaceholder = computed(() => {
  if (products.value.length === 0) return '加载支付产品中...';
  if (products.value.length === 1) return '已自动选择唯一支付产品';
  return '请选择支付产品';
});

const payButtonText = computed(() => {
  if (payType.value === 1) return '生成付款链接';
  if (payType.value === 2) return '生成付款二维码';
  if (payType.value === 3) return '仅测试拉起';
  return '立即支付';
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
  if (value == null) return 0;
  return Math.round(Number.parseFloat(String(value)) * 100);
}

async function loadSettleOrder() {
  if (!payOrderId.value) {
    message.error('缺少订单号');
    return;
  }
  loading.value = true;
  try {
    order.value = await fetchCashierOrderApi(payOrderId.value);
    if (order.value.state === 2) paid.value = true;
  } catch (error) {
    message.error(error instanceof Error ? error.message : '订单查询失败');
  } finally {
    loading.value = false;
  }
}

async function settlePay() {
  if (!order.value) return;
  paying.value = true;
  try {
    await payCashierOrderApi(order.value.payOrderId, order.value.cashierToken);
    paid.value = true;
    message.success('支付成功');
    await loadSettleOrder();
  } catch (error) {
    message.error(error instanceof Error ? error.message : '支付失败');
  } finally {
    paying.value = false;
  }
}

async function loadProducts() {
  if (!mchNoFromUrl.value || !secretFromUrl.value) {
    message.error('缺少必要的参数');
    return;
  }
  loading.value = true;
  try {
    const list = await fetchCashierProductListApi(
      mchNoFromUrl.value,
      secretFromUrl.value,
    );
    products.value = Array.isArray(list) ? list : [];
    if (products.value.length === 1) {
      productId.value = Number(products.value[0]?.productId);
      message.success('已自动选择唯一支付产品');
    }
  } catch (error) {
    message.error(error instanceof Error ? error.message : '获取支付产品失败');
  } finally {
    loading.value = false;
  }
}

async function createPay() {
  if (!canSubmit.value || productId.value == null) return;
  paying.value = true;
  try {
    const data = await placeCashierOrderApi({
      amount: yuanToCent(amountYuan.value),
      mchNo: mchNoFromUrl.value,
      productId: Number(productId.value),
      secret: secretFromUrl.value,
    });
    if (data && data.orderState === 1) {
      created.value = true;
      payData.value = data.payData || '';
      mchOrderNo.value = data.mchOrderNo || '';
      if (payType.value === 1) {
        message.success('拉起成功，即将自动跳转');
        setTimeout(() => openPay(), 1000);
      } else if (payType.value === 2) {
        message.success('二维码生成成功');
      } else {
        message.success('测试拉起成功');
      }
    } else {
      message.error(data?.errMsg || '出码失败');
    }
  } catch (error) {
    message.error(error instanceof Error ? error.message : '出码失败');
  } finally {
    paying.value = false;
  }
}

function openPay() {
  if (!payData.value) return;
  window.open(absolutePayUrl(payData.value), '_blank');
  message.success('已自动跳转到付款页面');
}

async function copyPayData() {
  const text = payData.value ? absolutePayUrl(payData.value) : '';
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    message.info('已复制');
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
  if (payOrderId.value) {
    void loadSettleOrder();
    return;
  }
  void loadProducts();
});
</script>

<template>
  <div class="cashier-page">
    <div class="cashier-card">
      <div class="header">
        <span class="brand">亚洲支付系统Pro</span>
        <span class="sub">收银台</span>
      </div>

      <Spin v-if="loading" size="large" tip="加载中..." />

      <template v-else-if="payOrderId">
        <div v-if="order" class="content">
          <div class="row">
            <span class="label">收款方</span>
            <span class="value">{{ order.mchName }}</span>
          </div>
          <div class="row">
            <span class="label">支付方式</span>
            <span class="value">{{ order.productName }}</span>
          </div>
          <div class="amount">
            <span class="amount-num">{{ formatYuan(order.amount) }}</span>
            <span class="amount-unit">元</span>
          </div>
          <div class="row">
            <span class="label">订单号</span>
            <span class="value">{{ order.payOrderId }}</span>
          </div>
          <div v-if="paid" class="paid-tip">
            <IconifyIcon class="text-4xl text-green-600" icon="ant-design:check-circle-filled" />
            <p>支付成功</p>
          </div>
          <Button
            v-else
            block
            size="large"
            type="primary"
            :loading="paying"
            @click="settlePay"
          >
            立即支付
          </Button>
        </div>
        <Empty v-else description="订单不存在或已过期" />
      </template>

      <template v-else-if="publicMode">
        <div v-if="!created" class="content">
          <Form layout="vertical">
            <Form.Item label="支付产品">
              <Select
                v-model:value="productId"
                :disabled="products.length <= 1"
                :options="productOptions"
                :placeholder="productPlaceholder"
              />
            </Form.Item>
            <Form.Item label="金额(元)">
              <InputNumber
                v-model:value="amountYuan"
                :min="0.01"
                :precision="2"
                class="!w-full"
                placeholder="请输入金额"
              />
            </Form.Item>
            <Form.Item label="拉起方式">
              <Radio.Group v-model:value="payType">
                <Radio :value="1">链接跳转</Radio>
                <Radio :value="2">手机扫码</Radio>
                <Radio :value="3">仅测试拉起</Radio>
              </Radio.Group>
            </Form.Item>
          </Form>
          <Button
            block
            size="large"
            type="primary"
            :disabled="!canSubmit"
            :loading="paying"
            @click="createPay"
          >
            {{ payButtonText }}
          </Button>
        </div>
        <div v-else class="content">
          <div class="row">
            <span class="label">商户订单号</span>
            <span class="value">{{ mchOrderNo || '—' }}</span>
          </div>
          <div v-if="payType === 2" class="qr-wrap">
            <img v-if="qrSrc" :src="qrSrc" alt="付款二维码" />
          </div>
          <div class="pay-url">{{ payData ? absolutePayUrl(payData) : '' }}</div>
          <Space class="w-full" direction="vertical">
            <Button v-if="payType !== 2" block type="primary" @click="openPay">
              打开付款页面
            </Button>
            <Button block @click="copyPayData">复制链接</Button>
            <Button block type="link" @click="resetCreated">再下一单</Button>
          </Space>
        </div>
      </template>

      <Empty v-else description="缺少必要的参数" />
    </div>
  </div>
</template>

<style scoped>
.cashier-page {
  align-items: center;
  background: linear-gradient(135deg, #0052d9 0%, #00a870 100%);
  display: flex;
  justify-content: center;
  min-height: 100vh;
  padding: 16px;
}

.cashier-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgb(0 0 0 / 15%);
  max-width: 420px;
  padding: 24px 20px;
  width: 100%;
}

.header {
  margin-bottom: 20px;
  text-align: center;
}

.header .brand {
  color: #0052d9;
  font-size: 20px;
  font-weight: 600;
}

.header .sub {
  color: #999;
  display: block;
  font-size: 13px;
  margin-top: 4px;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.row {
  align-items: center;
  display: flex;
  font-size: 14px;
  justify-content: space-between;
}

.label {
  color: #999;
}

.value {
  color: #333;
  font-weight: 500;
}

.amount {
  margin: 16px 0;
  text-align: center;
}

.amount-num {
  color: #0052d9;
  font-size: 36px;
  font-weight: 700;
}

.amount-unit {
  color: #666;
  font-size: 16px;
  margin-left: 4px;
}

.paid-tip {
  color: #00a870;
  padding: 24px 0;
  text-align: center;
}

.paid-tip p {
  font-size: 16px;
  font-weight: 600;
  margin-top: 8px;
}

.qr-wrap {
  text-align: center;
}

.qr-wrap img {
  height: 180px;
  width: 180px;
}

.pay-url {
  color: #666;
  font-size: 12px;
  word-break: break-all;
}
</style>

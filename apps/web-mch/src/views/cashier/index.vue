<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

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
  fetchCashierProductListApi,
  placeCashierOrderRawApi,
} from '#/api';
import type { CashierProduct } from '#/api/modules/cashier';

defineOptions({ name: 'CashierPage' });

const route = useRoute();

const mchNoFromUrl = computed(() => String(route.query.mchNo || '').trim());
const secretFromUrl = computed(() => String(route.query.secret || '').trim());
const publicMode = computed(() => !!mchNoFromUrl.value && !!secretFromUrl.value);

const loading = ref(false);
const paying = ref(false);

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
    label: `[${p.productId}] ${p.productName}`,
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
    if (error instanceof Error && error.message) {
      message.error(error.message);
    } else {
      message.error('获取支付产品失败');
    }
  } finally {
    loading.value = false;
  }
}

async function createPay() {
  if (!canSubmit.value || productId.value == null) return;
  paying.value = true;
  try {
    // 线上契约：信封层判 code===0 && data.orderState===1；失败取 data.errMsg → 信封 msg → 「出码失败」
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
        message.success('二维码生成成功');
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

      <Spin v-if="loading" size="large" tip="加载支付产品中..." />

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

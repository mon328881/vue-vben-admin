<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import {
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Typography,
  message,
} from 'ant-design-vue';

import type { MchAppItem } from '#/api/types/business';
import { copyRaw } from '#/utils/copy';

defineOptions({ name: 'PayTestDrawer' });

const props = defineProps<{
  open: boolean;
  product: MchAppItem | null;
  mchNo: string;
  submitRequest: (payload: {
    testOrderNo: string;
    amount: number;
  }) => Promise<{
    code?: number;
    data?: { payData?: string; mchOrderNo?: string };
    msg?: string;
  }>;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const router = useRouter();
const amount = ref<number>();
const testOrderNo = ref('');
const rawResult = ref('');
const payOk = ref(false);
const payData = ref('');
const submitting = ref(false);

const visible = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
});

const productIdLabel = computed(() => {
  const id = props.product?.productId;
  return id == null || String(id).trim() === '' ? '—' : String(id);
});

const productNameLabel = computed(() => {
  const name = props.product?.productName;
  return typeof name === 'string' && name.trim() !== '' ? name.trim() : '—';
});

function resetState() {
  amount.value = undefined;
  testOrderNo.value = '';
  rawResult.value = '';
  payOk.value = false;
  payData.value = '';
  submitting.value = false;
}

function genTestOrderNo() {
  return `T${Date.now()}${Math.floor(Math.random() * 9000 + 1000)}`;
}

async function submit() {
  const yuan = Number(amount.value);
  if (!yuan || Number.isNaN(yuan) || yuan <= 0) {
    message.error('金额不能为空或小于等于 0');
    return;
  }
  if (!props.mchNo) {
    message.error('商户号不存在，无法下单测试');
    return;
  }
  const orderNo = genTestOrderNo();
  submitting.value = true;
  try {
    const res = await props.submitRequest({ amount: yuan, testOrderNo: orderNo });
    testOrderNo.value = orderNo;
    rawResult.value = JSON.stringify(res ?? {}, null, 2);
    const link = res?.data?.payData;
    const hasLink = link != null && String(link).trim() !== '';
    if (res?.code === 0 && hasLink) {
      payData.value = String(link);
      payOk.value = true;
      message.success('下单成功');
      return;
    }
    payOk.value = false;
    payData.value = '';
    message.error(res?.msg || '下单失败：返回 code 非 0 或缺少支付数据');
  } catch (error) {
    rawResult.value = error instanceof Error ? error.message : String(error);
    message.error(rawResult.value);
  } finally {
    submitting.value = false;
  }
}

async function copyPayData() {
  if (!payData.value) return;
  const ok = await copyRaw(payData.value);
  if (ok) message.success('复制成功');
  else message.error('复制失败，请手动复制');
}

function goPayOrder() {
  if (!testOrderNo.value) return;
  visible.value = false;
  router.push({ path: '/pay', query: { unionOrderId: testOrderNo.value } });
}

watch(visible, (open) => {
  if (!open) resetState();
});
</script>

<template>
  <Drawer
    v-model:open="visible"
    title="支付测试"
    width="800"
    :mask-closable="false"
    destroy-on-close
  >
    <div class="pay-test-drawer">
      <section class="pay-test-drawer__section">
        <Form layout="vertical" :label-col="{ style: { width: '190px' } }">
          <Form.Item label="当前产品">
            <div class="product-context">
              <span class="product-context__id">[{{ productIdLabel }}]</span>
              <span class="product-context__name">{{ productNameLabel }}</span>
            </div>
          </Form.Item>
          <Form.Item label="支付金额">
            <InputNumber
              v-model:value="amount"
              :min="-999999999"
              :max="999999999"
              :precision="2"
              :step="0.01"
              class="!w-64"
              placeholder="请输入金额"
            />
          </Form.Item>
          <Form.Item label="说明">
            <p class="help-text">
              请选择要测试的支付通道并填写金额；下单将模拟商户真实拉单，订单将自动入库。
            </p>
          </Form.Item>
          <Form.Item>
            <Button type="primary" :loading="submitting" @click="submit">
              下单测试
            </Button>
          </Form.Item>
        </Form>
      </section>

      <section class="pay-test-drawer__section pay-test-drawer__result">
        <div class="result-card">
          <Form layout="vertical" :label-col="{ style: { width: '180px' } }">
            <Form.Item label="测试商户订单号">
              <div class="result-order-row">
                <Input :value="testOrderNo" readonly class="result-input" />
                <Button v-if="payOk" danger size="small" @click="goPayOrder">
                  去订单页查看
                </Button>
              </div>
            </Form.Item>
            <Form.Item label="下单返回参数">
              <Input.TextArea
                :value="rawResult"
                readonly
                :rows="8"
                class="result-textarea font-mono"
              />
            </Form.Item>
            <template v-if="payOk">
              <Form.Item label="支付链接（点击直接跳转）">
                <Typography.Link
                  v-if="payData"
                  :href="payData"
                  target="_blank"
                  class="pay-link"
                >
                  {{ payData }}
                </Typography.Link>
              </Form.Item>
              <Form.Item label="手动跳转">
                <Button size="small" type="primary" @click="copyPayData">
                  一键复制链接
                </Button>
              </Form.Item>
            </template>
          </Form>
        </div>
      </section>
    </div>
  </Drawer>
</template>

<style scoped>
.pay-test-drawer {
  display: flex;
  flex-direction: column;
}

.pay-test-drawer__section {
  padding: 12px 0;
}

.pay-test-drawer__section + .pay-test-drawer__section {
  border-top: 1px solid hsl(var(--border) / 60%);
}

.product-context {
  font-size: 14px;
  line-height: 1.5;
}

.product-context__id {
  font-weight: 600;
  margin-right: 6px;
}

.product-context__name {
  word-break: break-all;
}

.help-text {
  color: hsl(var(--muted-foreground));
  font-size: 12px;
  line-height: 1.5;
  margin: 0;
}

.result-card {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border) / 60%);
  border-radius: 8px;
  padding: 16px;
}

.result-order-row {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.result-input {
  max-width: 280px;
}

.result-textarea {
  width: 100%;
}

.pay-link {
  word-break: break-all;
}
</style>

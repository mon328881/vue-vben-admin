<script lang="ts" setup>
import type { MchAppItem } from '#/api/types/business';

import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { IconifyIcon } from '@vben/icons';

import {
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  message,
  Tooltip,
  Typography,
} from 'ant-design-vue';

import { copyRaw } from '#/utils/copy';

defineOptions({ name: 'PayTestDrawer' });

const props = defineProps<{
  mchNo: string;
  open: boolean;
  product: MchAppItem | null;
  submitRequest: (payload: { amount: number; testOrderNo: string }) => Promise<{
    code?: number;
    data?: { mchOrderNo?: string; payData?: string };
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
  return id === null || id === undefined || String(id).trim() === ''
    ? '—'
    : String(id);
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
  // 对齐 demo bundle $()：订单号永远自动生成（T{ts}{1000-9999}），无用户输入路径；「请输入」是只读展示空态默认 placeholder
  const orderNo = genTestOrderNo();
  submitting.value = true;
  try {
    const res = await props.submitRequest({
      amount: yuan,
      testOrderNo: orderNo,
    });
    testOrderNo.value = orderNo;
    rawResult.value = JSON.stringify(res ?? {}, null, 2);
    const link = res?.data?.payData;
    const hasLink =
      link !== null && link !== undefined && String(link).trim() !== '';
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

async function copyText(text: string) {
  if (!text) return;
  const ok = await copyRaw(text);
  if (ok) message.success('复制成功');
  else message.error('复制失败，请手动复制');
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
        <Form layout="vertical" class="ap-form-label-wide">
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
          <Form layout="vertical" class="ap-form-label-wide">
            <Form.Item label="测试商户订单号">
              <div class="result-order-row">
                <div class="pay-test-display result-input">
                  <Tooltip v-if="testOrderNo" title="复制内容">
                    <Button
                      class="pay-test-display__copy"
                      size="small"
                      type="text"
                      @click="copyText(testOrderNo)"
                    >
                      <IconifyIcon icon="ant-design:copy-outlined" />
                    </Button>
                  </Tooltip>
                  <Input
                    :value="testOrderNo"
                    readonly
                    class="pay-test-display__readonly-input"
                    placeholder="请输入"
                  />
                </div>
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
  margin-right: 6px;
  font-weight: 600;
}

.product-context__name {
  word-break: break-all;
}

.help-text {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: hsl(var(--muted-foreground));
}

.result-card {
  padding: 16px;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border) / 60%);
  border-radius: 8px;
}

.result-order-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
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

.pay-test-display {
  position: relative;
  width: 100%;
}

.pay-test-display__copy {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 1;
}

.pay-test-display__readonly-input :deep(input),
.pay-test-display__readonly-input {
  cursor: default;
}

.pay-test-display:has(.pay-test-display__copy) :deep(input) {
  padding-right: 32px;
}
</style>

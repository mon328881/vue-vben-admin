<script lang="ts" setup>
/**
 * 下单测试抽屉底座（对齐 mgr-web PayTestDrawerBase）
 */
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import {
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Radio,
  Tooltip,
  message,
} from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    title: string;
    selectorLabel: string;
    description: string;
    showTestOrderIn?: boolean;
    beforeSubmit?: () => string | null | undefined;
    submitRequest: (payload: {
      testOrderNo: string;
      amount: number;
      testOrderIn: number;
    }) => Promise<{ payData?: string } | null | undefined>;
  }>(),
  {
    showTestOrderIn: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

defineOptions({ name: 'PayTestDrawerBase' });

const router = useRouter();
const amount = ref<number | undefined>();
const testOrderIn = ref(1);
const testOrderNo = ref('');
const rawResult = ref('');
const payOk = ref(false);
const payData = ref('');
const submitting = ref(false);

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

function resetState() {
  amount.value = undefined;
  testOrderIn.value = 1;
  testOrderNo.value = '';
  rawResult.value = '';
  payOk.value = false;
  payData.value = '';
  submitting.value = false;
}

function genTestOrderNo() {
  return `T${Date.now()}${Math.floor(Math.random() * 9000 + 1000)}`;
}

async function copyText(text: string) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    message.success('复制成功');
  } catch {
    message.error('复制失败，请手动复制');
  }
}

async function submit() {
  const yuan = Number(amount.value);
  if (!yuan || Number.isNaN(yuan) || yuan <= 0) {
    message.error('金额不能为空或小于等于 0');
    return;
  }
  const blocked = props.beforeSubmit?.();
  if (blocked) {
    message.error(blocked);
    return;
  }
  const orderNo = genTestOrderNo();
  submitting.value = true;
  try {
    const res = await props.submitRequest({
      testOrderNo: orderNo,
      amount: yuan,
      testOrderIn: testOrderIn.value,
    });
    testOrderNo.value = orderNo;
    rawResult.value = JSON.stringify(res ?? {}, null, 2);
    const link = res?.payData;
    const linkText = link == null ? '' : String(link).trim();
    const isSkipIndb = linkText === 'TEST_SKIP_INDB';
    const hasLink = linkText !== '' && !isSkipIndb;
    if (isSkipIndb) {
      payData.value = '';
      payOk.value = true;
      message.success('拉起测试通过（未入库）');
      return;
    }
    if (hasLink) {
      payData.value = String(link);
      payOk.value = true;
      message.success('下单成功');
      return;
    }
    payOk.value = false;
    payData.value = '';
    message.error('下单失败：返回 code 非 0 或缺少支付数据');
  } catch (error) {
    payOk.value = false;
    payData.value = '';
    if (!rawResult.value) {
      rawResult.value =
        error instanceof Error ? error.message : String(error ?? '');
    }
  } finally {
    submitting.value = false;
  }
}

async function copyPayData() {
  await copyText(payData.value);
}

function goPayOrder() {
  if (!testOrderNo.value) return;
  visible.value = false;
  void router.push({
    path: '/pay',
    query: { unionOrderId: testOrderNo.value },
  });
}

watch(visible, (open) => {
  if (!open) resetState();
});

defineExpose({ resetState });
</script>

<template>
  <Drawer
    v-model:open="visible"
    :title="title"
    :width="800"
    :mask-closable="false"
    destroy-on-close
    :footer="false"
  >
    <div class="pay-test-drawer">
      <div class="pay-test-drawer__section">
        <Form layout="vertical" class="ap-drawer-form">
          <Form.Item :label="selectorLabel">
            <div class="pay-test-drawer__selector">
              <slot name="selector" />
            </div>
          </Form.Item>
          <Form.Item label="支付金额">
            <InputNumber
              v-model:value="amount"
              :precision="2"
              :step="0.01"
              :min="-999999999"
              :max="999999999"
              style="width: 260px"
              placeholder="请输入金额"
            />
          </Form.Item>
          <Form.Item v-if="showTestOrderIn" label="测试订单入库">
            <Radio.Group v-model:value="testOrderIn">
              <Radio :value="1">启用</Radio>
              <Radio :value="0">禁用</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="说明">
            <p class="pay-test-drawer__help">{{ description }}</p>
          </Form.Item>
          <Form.Item>
            <Button type="primary" :loading="submitting" @click="submit">
              下单测试
            </Button>
          </Form.Item>
        </Form>
      </div>

      <div class="pay-test-drawer__section pay-test-drawer__result">
        <div class="pay-test-drawer__result-card">
          <Form layout="vertical">
            <Form.Item label="测试商户订单号">
              <div class="pay-test-drawer__order-row">
                <div class="pay-test-display pay-test-display--single">
                  <Tooltip title="复制内容">
                    <Button
                      class="pay-test-display__copy"
                      size="small"
                      type="text"
                      @click="copyText(testOrderNo)"
                    >
                      <IconifyIcon icon="ant-design:copy-outlined" />
                    </Button>
                  </Tooltip>
                  <Input :value="testOrderNo" readonly />
                </div>
                <Button
                  v-if="payOk && payData"
                  danger
                  ghost
                  size="small"
                  @click="goPayOrder"
                >
                  去订单页查看
                </Button>
              </div>
            </Form.Item>
            <Form.Item label="下单返回参数">
              <div class="pay-test-display pay-test-display--multi">
                <Tooltip title="复制内容">
                  <Button
                    class="pay-test-display__copy"
                    size="small"
                    type="text"
                    @click="copyText(rawResult)"
                  >
                    <IconifyIcon icon="ant-design:copy-outlined" />
                  </Button>
                </Tooltip>
                <Input.TextArea
                  :value="rawResult"
                  readonly
                  class="pay-test-display__mono"
                  :auto-size="{ minRows: 6, maxRows: 12 }"
                />
              </div>
            </Form.Item>
            <template v-if="payOk && payData">
              <Form.Item label="支付链接（点击直接跳转）">
                <a
                  class="pay-test-drawer__pay-link"
                  :href="payData"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {{ payData }}
                </a>
              </Form.Item>
              <Form.Item label="手动跳转">
                <Button type="primary" size="small" @click="copyPayData">
                  一键复制链接
                </Button>
              </Form.Item>
            </template>
          </Form>
        </div>
      </div>
    </div>
  </Drawer>
</template>

<style scoped>
.pay-test-drawer {
  display: flex;
  flex-direction: column;
  padding: 4px 0 12px;
}

.pay-test-drawer__section {
  padding: 12px 0;
}

.pay-test-drawer__section + .pay-test-drawer__section {
  border-top: 1px solid hsl(var(--border) / 60%);
}

.pay-test-drawer__selector {
  max-width: 360px;
}

.pay-test-drawer__help {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: hsl(var(--muted-foreground));
}

.pay-test-drawer__result {
  padding-top: 16px;
}

.pay-test-drawer__result-card {
  padding: 16px;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  background: hsl(var(--card));
}

.pay-test-drawer__order-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.pay-test-drawer__pay-link {
  word-break: break-all;
  color: hsl(var(--primary));
}

.pay-test-display {
  position: relative;
  width: 100%;
}

.pay-test-display--single {
  width: 280px;
  max-width: 100%;
}

.pay-test-display__copy {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 1;
}

.pay-test-display--single .pay-test-display__copy {
  top: 2px;
}

.pay-test-display__mono :deep(textarea) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  padding-right: 32px;
  background: hsl(var(--muted));
  cursor: default;
}

.pay-test-display--single :deep(.ant-input) {
  padding-right: 32px;
  background: hsl(var(--muted));
  cursor: default;
}
</style>

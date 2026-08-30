<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import {
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Radio,
  Space,
  message,
} from 'ant-design-vue';

import { doPassagePayTestApi, type PayPassage } from '#/api';

const visible = ref(false);
const passage = ref<PayPassage | null>(null);
const amount = ref<number | undefined>();
const testOrderIn = ref(1);
const testOrderNo = ref('');
const rawResult = ref('');
const payOk = ref(false);
const payData = ref('');
const submitting = ref(false);
const router = useRouter();

const hasProduct = computed(() => {
  const row = passage.value;
  if (!row) return false;
  return (
    String(row.productId ?? '').trim() !== '' ||
    String(row.productName ?? '').trim() !== ''
  );
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

function show(row: PayPassage) {
  passage.value = row;
  resetState();
  visible.value = true;
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
  if (!passage.value?.payPassageId) {
    message.error('通道信息无效');
    return;
  }
  const orderNo = genTestOrderNo();
  submitting.value = true;
  try {
    const data = await doPassagePayTestApi({
      testOrderNo: orderNo,
      passageId: Number(passage.value.payPassageId),
      amount: yuan,
      testOrderIn: testOrderIn.value,
      productId: passage.value.productId,
    });
    testOrderNo.value = orderNo;
    rawResult.value = JSON.stringify(data ?? {}, null, 2);
    const link = data?.payData;
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
    message.error('下单失败：返回缺少支付数据');
  } catch (error) {
    payOk.value = false;
    payData.value = '';
    if (!rawResult.value) rawResult.value = String(error ?? '');
  } finally {
    submitting.value = false;
  }
}

async function copyPayData() {
  if (!payData.value) return;
  try {
    await navigator.clipboard.writeText(payData.value);
    message.success('复制成功');
  } catch {
    message.error('复制失败，请手动复制');
  }
}

function goPayOrder() {
  if (!testOrderNo.value) return;
  visible.value = false;
  void router.push({ path: '/order/pay', query: { unionOrderId: testOrderNo.value } });
}

watch(visible, (open) => {
  if (!open) resetState();
});

defineExpose({ show });
</script>

<template>
  <Drawer
    v-model:open="visible"
    title="通道下单测试"
    :width="640"
    :mask-closable="false"
    destroy-on-close
    :footer="false"
  >
    <Form layout="vertical">
      <Form.Item label="当前通道">
        <div v-if="passage?.payPassageId != null">
          <div>
            <span class="text-primary">[{{ passage.payPassageId }}]</span>
            {{ passage.payPassageName || '—' }}
          </div>
          <div v-if="hasProduct" class="text-muted-foreground text-xs">
            [{{ passage.productId || '—' }}]
            {{ passage.productName || '—' }}
          </div>
        </div>
      </Form.Item>
      <Form.Item>
        <template #label>
          <span>
            说明：【启用】订单挂到测试商户，可走完整回调流程；【禁用】不入库，仅测三方是否能正常拉起。
          </span>
        </template>
        <Radio.Group v-model:value="testOrderIn">
          <Radio :value="1">启用入库</Radio>
          <Radio :value="0">禁用入库</Radio>
        </Radio.Group>
      </Form.Item>
      <Form.Item label="支付金额" required>
        <InputNumber
          v-model:value="amount"
          :min="0.01"
          :precision="2"
          :step="0.01"
          style="width: 100%"
          placeholder="请输入金额（元）"
        />
      </Form.Item>
      <Form.Item>
        <Button type="primary" :loading="submitting" @click="submit">
          发起测试
        </Button>
      </Form.Item>
      <Form.Item v-if="testOrderNo" label="测试订单号">
        <Input :value="testOrderNo" readonly />
      </Form.Item>
      <Form.Item v-if="payOk && payData" label="支付链接">
        <Space>
          <Input :value="payData" readonly style="width: 360px" />
          <Button @click="copyPayData">复制</Button>
          <Button type="link" @click="goPayOrder">查看订单</Button>
        </Space>
      </Form.Item>
      <Form.Item v-if="rawResult" label="原始返回">
        <Input.TextArea :value="rawResult" :rows="8" readonly />
      </Form.Item>
    </Form>
  </Drawer>
</template>

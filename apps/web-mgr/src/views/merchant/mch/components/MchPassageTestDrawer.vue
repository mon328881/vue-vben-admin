<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import {
  Button,
  Drawer,
  Form,
  InputNumber,
  Select,
  Space,
  Textarea,
  message,
} from 'ant-design-vue';

import {
  doMchPayTestApi,
  fetchPassageListShortApi,
  type PassageShort,
} from '#/api';
import type { MchInfo } from '#/api/types/business';

const visible = ref(false);
const submitting = ref(false);
const mchNo = ref('');
const passageId = ref<number | undefined>();
const amount = ref<number | undefined>();
const testOrderNo = ref('');
const payData = ref('');
const rawResult = ref('');
const passages = ref<PassageShort[]>([]);
const passageLoading = ref(false);

async function loadPassages() {
  passageLoading.value = true;
  try {
    const rows = (await fetchPassageListShortApi()) ?? [];
    passages.value = rows.map((item) => ({
      payPassageId: Number(item.payPassageId),
      payPassageName: item.payPassageName,
    }));
  } catch {
    passages.value = [];
  } finally {
    passageLoading.value = false;
  }
}

function resetState() {
  passageId.value = undefined;
  amount.value = undefined;
  testOrderNo.value = '';
  payData.value = '';
  rawResult.value = '';
  submitting.value = false;
}

function show(row: MchInfo) {
  mchNo.value = row.mchNo;
  resetState();
  visible.value = true;
  void loadPassages();
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
  if (passageId.value === undefined || Number.isNaN(Number(passageId.value))) {
    message.error('请先选择要测试的通道');
    return;
  }
  if (!mchNo.value) {
    message.error('商户号不存在，无法下单测试');
    return;
  }
  const orderNo = genTestOrderNo();
  submitting.value = true;
  try {
    const data = await doMchPayTestApi({
      testOrderNo: orderNo,
      passageId: Number(passageId.value),
      amount: yuan,
      mchNo: mchNo.value,
    });
    testOrderNo.value = orderNo;
    rawResult.value = JSON.stringify(data ?? {}, null, 2);
    const link = data?.payData;
    const linkText = link == null ? '' : String(link).trim();
    if (linkText && linkText !== 'TEST_SKIP_INDB') {
      payData.value = linkText;
      message.success('下单成功');
    } else if (linkText === 'TEST_SKIP_INDB') {
      payData.value = '';
      message.success('拉起测试通过（未入库）');
    } else {
      payData.value = '';
      message.success('下单成功');
    }
  } catch (error) {
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

onMounted(() => {
  // passages loaded on show
});

defineExpose({ show });
</script>

<template>
  <Drawer
    v-model:open="visible"
    title="商户-通道下单测试"
    :width="520"
    destroy-on-close
  >
    <div class="ap-drawer-body">
      <div class="ap-drawer-section text-muted-foreground text-sm">
        在此处下单测试将模拟商户真实拉单，订单将自动入库。
      </div>
      <div class="ap-drawer-section">
        <Form layout="vertical">
          <Form.Item label="请选择通道" required>
            <Select
              v-model:value="passageId"
              allow-clear
              show-search
              placeholder="选择通道"
              :loading="passageLoading"
              :options="
                passages.map((p) => ({
                  value: p.payPassageId,
                  label: `${p.payPassageName ?? ''} [ID: ${p.payPassageId}]`,
                }))
              "
              :filter-option="
                (input: string, option?: { label?: unknown }) =>
                  String(option?.label ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
              "
              style="width: 100%"
            />
          </Form.Item>
          <Form.Item label="金额（元）" required>
            <InputNumber
              v-model:value="amount"
              :min="0.01"
              :precision="2"
              :step="0.01"
              placeholder="请输入金额"
              style="width: 100%"
            />
          </Form.Item>
          <Form.Item v-if="testOrderNo" label="测试单号">
            {{ testOrderNo }}
          </Form.Item>
          <Form.Item v-if="payData" label="支付数据">
            <Textarea :value="payData" :rows="4" readonly />
            <Button class="mt-2" size="small" @click="copyPayData">
              复制
            </Button>
          </Form.Item>
          <Form.Item v-if="rawResult" label="原始返回">
            <Textarea :value="rawResult" :rows="6" readonly class="font-mono text-xs" />
          </Form.Item>
        </Form>
      </div>
    </div>
    <template #footer>
      <Space>
        <Button @click="visible = false">关闭</Button>
        <Button type="primary" :loading="submitting" @click="submit">
          提交测试
        </Button>
      </Space>
    </template>
  </Drawer>
</template>

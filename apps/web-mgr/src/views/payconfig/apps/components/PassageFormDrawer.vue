<script lang="ts" setup>
import { computed, reactive, ref } from 'vue';

import {
  Button,
  Divider,
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Textarea,
  message,
} from 'ant-design-vue';

import {
  createMchAppApi,
  fetchMchAppApi,
  fetchPayIfCodeApi,
  fetchPayWaysApi,
  fetchPassageGroupListApi,
  fetchIsvListApi,
  updateMchAppApi,
} from '#/api';

const emit = defineEmits<{ success: [] }>();

const PAY_TYPE_OPTIONS = [
  { value: 1, label: '区间范围 [例如:10-50000]' },
  { value: 2, label: '固定金额 [例如:10|20 或 50]' },
];

const visible = ref(false);
const creating = ref(true);
const saving = ref(false);
const ifLoading = ref(false);
const productLoading = ref(false);
const groupLoading = ref(false);
const agentLoading = ref(false);
const editingId = ref<string | null>(null);
const formRef = ref();

const ifOptions = ref<{ label: string; value: string }[]>([]);
const productOptions = ref<{ label: string; value: string }[]>([]);
const groupOptions = ref<{ label: string; value: string }[]>([]);
const agentOptions = ref<{ label: string; value: string }[]>([]);

const emptyForm = {
  payPassageName: '',
  productId: undefined as string | undefined,
  ifCode: undefined as string | undefined,
  payType: 1,
  payRules: '',
  rate: 0,
  passageGroup: undefined as string | undefined,
  agentNo: undefined as string | undefined,
  agentRate: 0,
  state: 1,
  balance: 0,
  weights: 1,
};

const form = reactive({ ...emptyForm });

function isNumberLike(value: string) {
  return /^\d+(?:\.\d+)?$/.test(value.trim());
}

function validatePayRules(_rule: unknown, value: string) {
  const text = String(value ?? '').trim();
  const payType = Number(form.payType);
  if (!text) return Promise.reject(new Error('请输入收款规则'));
  if (payType === 1) {
    const parts = text.split('-');
    if (parts.length !== 2) {
      return Promise.reject(new Error('收款规则格式错误,例如:10-50000'));
    }
    const min = parts[0]?.trim() ?? '';
    const max = parts[1]?.trim() ?? '';
    if (!isNumberLike(min) || !isNumberLike(max)) {
      return Promise.reject(new Error('收款规则格式错误,例如:10-50000'));
    }
    if (Number(min) > Number(max)) {
      return Promise.reject(new Error('收款规则范围错误,例如:10-50000'));
    }
  } else {
    for (const part of text.split('|')) {
      const item = part.trim();
      if (!item || !isNumberLike(item)) {
        return Promise.reject(new Error('收款规则格式错误,例如:10|20 或 50'));
      }
    }
  }
  return Promise.resolve();
}

const rules = computed(() => ({
  payPassageName: [
    { required: true, message: '请输入支付通道名称', trigger: 'blur' as const },
  ],
  productId: [
    { required: true, message: '请选择所属产品', trigger: 'change' as const },
  ],
  ifCode: [
    { required: true, message: '请选择支付接口', trigger: 'change' as const },
  ],
  payType: [
    {
      required: true,
      message: '请选择收款规则类型',
      trigger: 'change' as const,
    },
  ],
  payRules: [
    {
      required: true,
      validator: validatePayRules,
      trigger: 'blur' as const,
    },
  ],
  rate: creating.value
    ? [
        {
          required: true,
          message: '请输入通道费率（可为负，最多两位小数）',
          trigger: 'blur' as const,
        },
      ]
    : [],
}));

async function loadSelectors() {
  ifLoading.value = true;
  productLoading.value = true;
  groupLoading.value = true;
  agentLoading.value = true;
  try {
    const [ifs, products, groups, agents] = await Promise.all([
      fetchPayIfCodeApi(),
      fetchPayWaysApi({ pageNumber: 1, pageSize: 500 }),
      fetchPassageGroupListApi({ pageNumber: 1, pageSize: 500 }),
      fetchIsvListApi({ pageNumber: 1, pageSize: 500 }),
    ]);
    ifOptions.value = (ifs ?? []).map((item) => ({
      value: item.ifCode,
      label: `${item.ifName} [ 接口代码: ${item.ifCode} ]`,
    }));
    productOptions.value = (products?.records ?? []).map((item) => ({
      value: String(item.productId),
      label: `[${item.productId}] ${item.productName}`,
    }));
    groupOptions.value = (groups?.records ?? []).map((item) => ({
      value: item.passageGroupName,
      label: item.passageGroupName,
    }));
    agentOptions.value = (agents?.records ?? []).map((item) => ({
      value: item.agentNo,
      label: `[${item.agentNo}] ${item.agentName || ''}`,
    }));
  } finally {
    ifLoading.value = false;
    productLoading.value = false;
    groupLoading.value = false;
    agentLoading.value = false;
  }
}

function resetForm() {
  Object.assign(form, { ...emptyForm });
  formRef.value?.clearValidate?.();
}

async function show(payPassageId?: number | string) {
  creating.value = payPassageId == null || payPassageId === '';
  saving.value = false;
  resetForm();
  await loadSelectors();
  if (!creating.value && payPassageId != null) {
    editingId.value = String(payPassageId);
    const detail = await fetchMchAppApi(payPassageId);
    if (detail) {
      form.payPassageName = detail.payPassageName ?? '';
      form.productId = detail.productId ? String(detail.productId) : undefined;
      form.ifCode = detail.ifCode || undefined;
      form.payType = Number(detail.payType ?? 1);
      form.payRules = detail.payRules ?? '';
      form.passageGroup =
        detail.passageGroup || detail.passageGroupName || undefined;
      form.agentNo = detail.agentNo || undefined;
      form.agentRate = Number(detail.agentRate ?? 0) * 100;
      form.rate = Number(detail.rate ?? 0) * 100;
    }
  } else {
    editingId.value = null;
    form.state = 1;
  }
  visible.value = true;
}

function closeDrawer() {
  visible.value = false;
}

async function save() {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  if (!form.payPassageName) {
    message.error('通道名不能为空');
    return;
  }
  if (!form.productId) {
    message.error('请选择所属产品');
    return;
  }
  saving.value = true;
  try {
    if (creating.value) {
      const payload: Record<string, unknown> = {
        ...form,
        productId: form.productId,
        rate: Number(form.rate || 0) / 100,
        passageGroup: form.passageGroup ?? '',
      };
      if (form.agentNo) {
        payload.agentRate = Number(form.agentRate || 0) / 100;
      } else {
        payload.agentNo = '';
        payload.agentRate = 0;
      }
      await createMchAppApi(payload);
      message.success('新增成功');
    } else if (editingId.value) {
      await updateMchAppApi(editingId.value, {
        payPassageId: editingId.value,
        payPassageName: form.payPassageName,
        productId: form.productId,
        ifCode: form.ifCode,
        payType: form.payType,
        payRules: form.payRules,
        passageGroup: form.passageGroup ?? '',
      });
      message.success('修改成功');
    }
    visible.value = false;
    emit('success');
  } finally {
    saving.value = false;
  }
}

defineExpose({ show });
</script>

<template>
  <Drawer
    v-model:open="visible"
    :title="creating ? '新增通道' : '修改通道'"
    :width="520"
    :destroy-on-close="true"
    :mask-closable="false"
    @close="closeDrawer"
  >
    <Form
      ref="formRef"
      class="ap-drawer-body"
      :model="form"
      :rules="rules as any"
      layout="vertical"
    >
      <Divider orientation="left">基础信息</Divider>
      <Form.Item label="通道名称" name="payPassageName">
        <Input v-model:value="form.payPassageName" placeholder="请输入" />
      </Form.Item>
      <Form.Item label="所属产品" name="productId">
        <Select
          v-model:value="form.productId"
          allow-clear
          show-search
          :loading="productLoading"
          :options="productOptions"
          option-filter-prop="label"
          placeholder="对应产品"
        />
      </Form.Item>
      <Form.Item label="所属支付接口" name="ifCode">
        <Select
          v-model:value="form.ifCode"
          allow-clear
          show-search
          :loading="ifLoading"
          :options="ifOptions"
          option-filter-prop="label"
          placeholder="请选择对应支付接口"
        />
      </Form.Item>
      <Form.Item label="收款方式" name="payType">
        <Select
          v-model:value="form.payType"
          :options="PAY_TYPE_OPTIONS"
          placeholder="请选择收款方式"
        />
      </Form.Item>
      <Form.Item label="收款规则" name="payRules">
        <Textarea
          v-model:value="form.payRules"
          :auto-size="{ minRows: 3 }"
          placeholder="请输入收款规则，例如:10-50000 或 10|20 或 50"
        />
      </Form.Item>
      <Form.Item v-if="creating" label="通道费率" name="rate">
        <InputNumber
          v-model:value="form.rate"
          :max="200"
          :min="-200"
          :precision="2"
          :step="0.01"
          addon-after="%"
          style="width: 260px"
          placeholder="请输入通道费率"
        />
      </Form.Item>
      <Form.Item label="通道供应商" name="passageGroup">
        <Select
          v-model:value="form.passageGroup"
          allow-clear
          show-search
          :loading="groupLoading"
          :options="groupOptions"
          option-filter-prop="label"
          placeholder="请选择通道供应商"
        />
      </Form.Item>
      <template v-if="creating">
        <Divider orientation="left">代理配置</Divider>
        <Form.Item label="代理商户号" name="agentNo">
          <Select
            v-model:value="form.agentNo"
            allow-clear
            show-search
            :loading="agentLoading"
            :options="agentOptions"
            option-filter-prop="label"
            placeholder="请选择代理商"
          />
        </Form.Item>
        <Form.Item v-if="form.agentNo" label="代理费率" name="agentRate">
          <InputNumber
            v-model:value="form.agentRate"
            :max="200"
            :min="-200"
            :precision="2"
            :step="0.01"
            addon-after="%"
            style="width: 260px"
            placeholder="请输入代理费率"
          />
        </Form.Item>
      </template>
    </Form>
    <template #footer>
      <Space>
        <Button type="primary" :loading="saving" @click="save">保存</Button>
        <Button @click="closeDrawer">取消</Button>
      </Space>
    </template>
  </Drawer>
</template>

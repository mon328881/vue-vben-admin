<script lang="ts" setup>
import type { PayPassage } from '#/api';

import { computed, reactive, ref, watch } from 'vue';

import { Form, InputNumber, message, Modal, Select } from 'ant-design-vue';

import { fetchIsvListApi, updateMchAppApi } from '#/api';
import {
  percentFromRate,
  PRODUCT_RATE_PRECISION,
  PRODUCT_RATE_RE,
  toProductRate,
} from '#/constants/payWays';

const emit = defineEmits<{ success: [] }>();

const visible = ref(false);
const saving = ref(false);
const agentLoading = ref(false);
const row = ref<null | PayPassage>(null);
const agentOptions = ref<{ label: string; value: string }[]>([]);
const form = reactive({
  agentNo: undefined as string | undefined,
  agentRate: undefined as number | undefined,
});

const header = computed(() =>
  row.value ? `设置通道[代理] - ${row.value.payPassageName}` : '设置通道[代理]',
);

watch(
  () => form.agentNo,
  (value) => {
    if (!value) form.agentRate = undefined;
  },
);

async function loadAgents() {
  agentLoading.value = true;
  try {
    const page = await fetchIsvListApi({ pageNumber: 1, pageSize: 500 });
    agentOptions.value = (page?.records ?? []).map((item) => ({
      value: item.agentNo,
      label: `[${item.agentNo}] ${item.agentName || ''}`,
    }));
  } finally {
    agentLoading.value = false;
  }
}

function open(target: PayPassage) {
  row.value = target;
  form.agentNo = target.agentNo ? String(target.agentNo) : undefined;
  const pct = percentFromRate(target.agentRate);
  form.agentRate = pct === '' ? undefined : Number(pct);
  saving.value = false;
  visible.value = true;
  void loadAgents();
}

async function submit() {
  if (!row.value) return;
  if (form.agentNo) {
    if (form.agentRate === null || form.agentRate === undefined) {
      message.error('请输入代理费率');
      return;
    }
    if (!PRODUCT_RATE_RE.test(String(form.agentRate))) {
      message.error('代理费率格式错误（可为负，最多六位小数）');
      return;
    }
  }
  saving.value = true;
  try {
    await updateMchAppApi(row.value.payPassageId, {
      payPassageId: row.value.payPassageId,
      agentNo: form.agentNo || '',
      agentRate: form.agentNo ? toProductRate(form.agentRate) : 0,
    });
    message.success('代理配置修改成功');
    visible.value = false;
    emit('success');
  } finally {
    saving.value = false;
  }
}

defineExpose({ open });
</script>

<template>
  <Modal
    v-model:open="visible"
    :title="header"
    width="600px"
    :confirm-loading="saving"
    ok-text="确定"
    cancel-text="取消"
    destroy-on-close
    @ok="submit"
  >
    <Form layout="vertical">
      <Form.Item label="通道号">{{ row?.payPassageId }}</Form.Item>
      <Form.Item label="通道名称">{{ row?.payPassageName }}</Form.Item>
      <Form.Item label="代理商户号">
        <Select
          v-model:value="form.agentNo"
          allow-clear
          show-search
          :loading="agentLoading"
          :options="agentOptions"
          option-filter-prop="label"
          placeholder="请选择代理商"
          style="width: 100%"
        />
      </Form.Item>
      <Form.Item v-if="form.agentNo" label="代理费率" required>
        <InputNumber
          v-model:value="form.agentRate"
          :min="-200"
          :max="200"
          :precision="PRODUCT_RATE_PRECISION"
          :step="0.000001"
          addon-after="%"
          style="width: 300px"
          placeholder="请输入代理费率"
        />
      </Form.Item>
    </Form>
  </Modal>
</template>

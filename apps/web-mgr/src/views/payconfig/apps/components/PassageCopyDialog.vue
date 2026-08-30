<script lang="ts" setup>
import { ref } from 'vue';

import {
  Alert,
  Descriptions,
  Input,
  Modal,
  Tag,
  message,
} from 'ant-design-vue';

import { createMchAppApi, fetchMchAppApi, type PayPassage } from '#/api';
import { formatRateDecimal } from '#/utils/format';
import {
  clonePassageForCreate,
  defaultCopyName,
  validateCopyName,
} from '#/utils/passage-copy-name';

const emit = defineEmits<{ success: [] }>();

const visible = ref(false);
const saving = ref(false);
const source = ref<PayPassage | null>(null);
const newName = ref('');

function parseConfig(row: PayPassage | null) {
  if (!row) return { mchNo: '-', payType: '-' };
  const raw = row.payInterfaceConfig;
  if (raw == null || String(raw).trim() === '') return { mchNo: '-', payType: '-' };
  try {
    const parsed = JSON.parse(String(raw));
    if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { mchNo: '-', payType: '-' };
    }
    return {
      mchNo:
        parsed.mchNo != null && String(parsed.mchNo).trim() !== ''
          ? String(parsed.mchNo)
          : '-',
      payType:
        parsed.payType != null && String(parsed.payType).trim() !== ''
          ? String(parsed.payType)
          : '-',
    };
  } catch {
    return { mchNo: '-', payType: '-' };
  }
}

function timeLimitText(row: PayPassage | null) {
  if (!row || row.timeLimit !== 1) return '未启用';
  const rules = String(row.timeRules ?? '').trim();
  if (!rules || rules === '|' || !rules.includes('|')) {
    return '已启用（未设置时段）';
  }
  const [start, end] = rules.split('|');
  return `已启用 ${start?.trim() || '--'} ~ ${end?.trim() || '--'}`;
}

function payRulesType(row: PayPassage | null) {
  const rules = String(row?.payRules ?? '').trim();
  if (!rules) return '--';
  if (rules.includes('-')) return '区间范围';
  return '固定金额';
}

function show(row: PayPassage) {
  source.value = row;
  newName.value = defaultCopyName(String(row.payPassageName ?? ''));
  saving.value = false;
  visible.value = true;
}

async function submit() {
  if (!source.value) return;
  const check = validateCopyName(newName.value, source.value.payPassageName);
  if (!check.valid) {
    message.error(check.message ?? '请检查新通道名称');
    return;
  }
  saving.value = true;
  try {
    const detail = await fetchMchAppApi(source.value.payPassageId);
    const row = (detail ?? source.value) as unknown as Record<string, unknown>;
    await createMchAppApi(clonePassageForCreate(row, newName.value));
    message.success('新增成功');
    visible.value = false;
    emit('success');
  } finally {
    saving.value = false;
  }
}

defineExpose({ show });
</script>

<template>
  <Modal
    v-model:open="visible"
    title="通道一键复制"
    width="640px"
    :confirm-loading="saving"
    ok-text="确定复制"
    @ok="submit"
  >
    <div v-if="source">
      <Alert
        class="mb-4"
        type="info"
        show-icon
        message="以下配置将复制到新通道；新通道余额为 0，状态为 启用。商户绑定、机器人绑定不会复制，需在新通道上单独配置。"
      />
      <div class="mb-2 flex items-center gap-2">
        <span class="font-semibold">新通道名称</span>
        <Tag color="warning">必填</Tag>
      </div>
      <Input
        v-model:value="newName"
        allow-clear
        size="large"
        placeholder="请输入新通道名称"
      />
      <p class="text-muted-foreground mt-2 text-xs">
        系统自动生成默认名称，建议根据实际情况修改
      </p>
      <div class="my-3 font-medium">原通道信息（将继承）</div>
      <Descriptions :column="2" bordered size="small">
        <Descriptions.Item label="原通道">
          [{{ source.payPassageId }}] {{ source.payPassageName }}
        </Descriptions.Item>
        <Descriptions.Item label="所属产品">
          [{{ source.productId }}] {{ source.productName || '--' }}
        </Descriptions.Item>
        <Descriptions.Item label="支付接口">
          {{ source.ifCode || '--' }}
        </Descriptions.Item>
        <Descriptions.Item label="通道费率">
          {{ formatRateDecimal(source.rate) }}
        </Descriptions.Item>
        <Descriptions.Item label="收款规则类型">
          {{ payRulesType(source) }}
        </Descriptions.Item>
        <Descriptions.Item label="收款规则">
          {{ source.payRules || '--' }}
        </Descriptions.Item>
        <Descriptions.Item label="轮询权重">
          {{ source.weights ?? '--' }}
        </Descriptions.Item>
        <Descriptions.Item label="通道供应商">
          {{ source.passageGroup || '--' }}
        </Descriptions.Item>
        <Descriptions.Item label="代理商户号">
          {{ source.agentNo || '无' }}
        </Descriptions.Item>
        <Descriptions.Item label="代理费率">
          {{
            source.agentNo ? formatRateDecimal(source.agentRate) : '--'
          }}
        </Descriptions.Item>
        <Descriptions.Item label="通道定时">
          {{ timeLimitText(source) }}
        </Descriptions.Item>
        <Descriptions.Item label="三方商户号">
          {{ parseConfig(source).mchNo }}
        </Descriptions.Item>
        <Descriptions.Item label="三方通道标识">
          {{ parseConfig(source).payType }}
        </Descriptions.Item>
      </Descriptions>
    </div>
  </Modal>
</template>

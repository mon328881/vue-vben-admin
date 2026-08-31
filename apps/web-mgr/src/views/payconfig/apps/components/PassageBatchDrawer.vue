<script lang="ts" setup>
import { computed, reactive, ref } from 'vue';

import {
  Alert,
  Button,
  Col,
  Divider,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Radio,
  Row,
  Select,
  Space,
  Tag,
  Textarea,
  TimePicker,
  message,
} from 'ant-design-vue';

import {
  fetchPayIfCodeApi,
  postMchAppsMultipleSetApi,
} from '#/api';
import PassageGroupSelector from '#/components/selectors/PassageGroupSelector.vue';
import ProductSelector from '#/components/selectors/ProductSelector.vue';

const PAY_TYPE_OPTIONS = [
  { value: 1, label: '区间范围 [例如:10-50000]' },
  { value: 2, label: '固定金额 [例如:10|20 或 50]' },
];

type DialogKey =
  | 'state'
  | 'product'
  | 'ifCode'
  | 'rate'
  | 'payRules'
  | 'weights'
  | 'gate'
  | 'ip'
  | 'mchNo'
  | 'secret'
  | 'timeLimitState'
  | 'timeLimitRules'
  | 'passageGroup';

const emit = defineEmits<{
  success: [];
  'batch-copy': [];
  deleted: [];
}>();

const visible = ref(false);
const saving = ref(false);
const selectedIds = ref<number[]>([]);
const labels = ref<string[]>([]);
const summaryText = computed(() => labels.value.join('\n'));
const ifOptions = ref<{ value: string; label: string }[]>([]);
const ifLoading = ref(false);

const dialogs = reactive<Record<DialogKey, boolean>>({
  state: false,
  product: false,
  ifCode: false,
  rate: false,
  payRules: false,
  weights: false,
  gate: false,
  ip: false,
  mchNo: false,
  secret: false,
  timeLimitState: false,
  timeLimitRules: false,
  passageGroup: false,
});

const form = reactive({
  state: undefined as number | undefined,
  productId: undefined as number | string | undefined,
  ifCode: undefined as string | undefined,
  rate: undefined as number | undefined,
  payType: 1 as number,
  payRules: '',
  weights: undefined as number | undefined,
  gate: '',
  ip: '',
  mchNo: '',
  secret: '',
  timeLimit: undefined as number | undefined,
  start: '' as string,
  end: '' as string,
  passageGroup: undefined as string | undefined,
});

function resetForm() {
  Object.assign(form, {
    state: undefined,
    productId: undefined,
    ifCode: undefined,
    rate: undefined,
    payType: 1,
    payRules: '',
    weights: undefined,
    gate: '',
    ip: '',
    mchNo: '',
    secret: '',
    timeLimit: undefined,
    start: '',
    end: '',
    passageGroup: undefined,
  });
}

function closeDialogs() {
  (Object.keys(dialogs) as DialogKey[]).forEach((key) => {
    dialogs[key] = false;
  });
}

function show(ids: Array<string | number>, names: string[]) {
  selectedIds.value = ids.map((id) => Number(id));
  labels.value = names;
  resetForm();
  closeDialogs();
  visible.value = true;
  void loadIfCodes();
}

async function loadIfCodes() {
  ifLoading.value = true;
  try {
    const list = (await fetchPayIfCodeApi()) ?? [];
    ifOptions.value = list.map((item) => ({
      value: item.ifCode,
      label: `${item.ifName} [ ${item.ifCode} ]`,
    }));
  } finally {
    ifLoading.value = false;
  }
}

function closeAndReset() {
  visible.value = false;
  selectedIds.value = [];
  labels.value = [];
  resetForm();
  closeDialogs();
}

function onDrawerClose() {
  const count = selectedIds.value.length;
  visible.value = false;
  if (count > 0) {
    message.warning(
      `批量操作窗口已关闭，列表仍选中 ${count} 条通道，进行其他操作前请特别注意。`,
    );
  }
  emit('success');
}

function openTimeLimitRules() {
  form.start = '';
  form.end = '';
  dialogs.timeLimitRules = true;
}

function openDialog(key: DialogKey) {
  resetForm();
  dialogs[key] = true;
}

function isValidGate(value: string) {
  const gate = value.trim();
  if (!gate || !gate.startsWith('http')) return false;
  try {
    // eslint-disable-next-line no-new
    new URL(gate);
    return true;
  } catch {
    return false;
  }
}

function isValidCallbackIp(value: string) {
  const parts = value
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean);
  if (parts.length === 0) return false;
  return parts.every((ip) => {
    if (ip === '*') return true;
    const segs = ip.split('.');
    if (segs.length !== 4) return false;
    return segs.every((seg) => {
      if (!/^\d{1,3}$/.test(seg)) return false;
      const n = Number(seg);
      return n >= 0 && n <= 255;
    });
  });
}

function isNumberLike(value: string) {
  return /^\d+(?:\.\d+)?$/.test(value.trim());
}

function validatePayRules(payType: number, rules: unknown): string | null {
  const text = String(rules ?? '').trim();
  if (!text) return '请输入收款规则';
  if (payType === 1) {
    const parts = text.split('-');
    if (parts.length !== 2) return '收款规则格式错误,例如:10-50000';
    const min = parts[0]?.trim() ?? '';
    const max = parts[1]?.trim() ?? '';
    if (!min || !max || !isNumberLike(min) || !isNumberLike(max)) {
      return '收款规则格式错误,例如:10-50000';
    }
    if (Number(min) > Number(max)) return '收款规则范围错误,例如:10-50000';
  } else {
    for (const part of text.split('|')) {
      const item = part.trim();
      if (!item || !isNumberLike(item)) {
        return '收款规则格式错误,例如:10|20 或 50';
      }
    }
  }
  return null;
}

async function run(
  action: string,
  payload: Record<string, unknown>,
  options?: {
    validate?: () => string | null;
    successMsg?: string;
    closeKey?: DialogKey;
    closeDrawer?: boolean;
    afterSuccess?: () => void;
  },
) {
  const blocked = options?.validate?.();
  if (blocked) {
    message.error(blocked);
    return false;
  }
  saving.value = true;
  try {
    await postMchAppsMultipleSetApi(action, {
      ...payload,
      selectedIds: selectedIds.value,
    });
    message.success(options?.successMsg ?? '操作成功');
    if (options?.closeKey) dialogs[options.closeKey] = false;
    options?.afterSuccess?.();
    if (options?.closeDrawer) {
      closeAndReset();
    } else {
      resetForm();
      closeDialogs();
    }
    emit('success');
    return true;
  } finally {
    saving.value = false;
  }
}

async function submitState() {
  await run(
    'multipleSetState',
    { state: form.state },
    {
      closeKey: 'state',
      validate: () => (form.state == null ? '请先选择状态' : null),
    },
  );
}

async function submitProduct() {
  await run(
    'multipleSetProduct',
    { productId: form.productId },
    {
      closeKey: 'product',
      validate: () => (!form.productId ? '请选择所属产品' : null),
    },
  );
}

async function submitIfCode() {
  await run(
    'multipleSetIfCode',
    { ifCode: form.ifCode },
    {
      closeKey: 'ifCode',
      validate: () => (!form.ifCode ? '请选择所属接口' : null),
    },
  );
}

async function submitRate() {
  await run(
    'multipleSetRate',
    { rate: Number(form.rate || 0) / 100 },
    {
      closeKey: 'rate',
      validate: () => {
        if (form.rate == null) return '请输入通道费率';
        if (!/^-?\d+(?:\.\d{1,2})?$/.test(String(form.rate))) {
          return '费率格式错误（可为负，最多两位小数）';
        }
        return null;
      },
    },
  );
}

async function submitPayRules() {
  await run(
    'multipleSetPayRules',
    { payType: form.payType, payRules: String(form.payRules ?? '').trim() },
    {
      closeKey: 'payRules',
      validate: () => {
        if (form.payType !== 1 && form.payType !== 2) return '请选择收款方式';
        return validatePayRules(form.payType, form.payRules);
      },
    },
  );
}

async function submitWeights() {
  await run(
    'multipleSetWeights',
    { weights: form.weights },
    {
      closeKey: 'weights',
      validate: () => {
        if (form.weights == null) return '请输入轮询权重';
        const n = Math.trunc(Number(form.weights));
        if (!Number.isFinite(n) || n < 1 || n > 10000) {
          return '请输入 1-10000 的整数';
        }
        return null;
      },
    },
  );
}

async function submitGate() {
  await run(
    'multipleSetGate',
    { payGate: form.gate.trim() },
    {
      closeKey: 'gate',
      validate: () =>
        !isValidGate(form.gate) ? '下单地址格式错误，请核实' : null,
    },
  );
}

async function submitIp() {
  await run(
    'multipleSetIP',
    { ip: form.ip.trim() },
    {
      closeKey: 'ip',
      validate: () =>
        !isValidCallbackIp(form.ip) ? '回调 IP 格式错误，请核实' : null,
    },
  );
}

async function submitMchNo() {
  await run(
    'multipleSetMchNo',
    { mchNo: form.mchNo.trim() },
    {
      closeKey: 'mchNo',
      validate: () => (!form.mchNo.trim() ? '商户号为空，请核实' : null),
    },
  );
}

async function submitSecret() {
  await run(
    'multipleSetSecret',
    { secret: form.secret.trim() },
    {
      closeKey: 'secret',
      validate: () => (!form.secret.trim() ? '密钥为空，请核实' : null),
    },
  );
}

async function submitTimeLimitState() {
  await run(
    'multipleSetTimeLimitState',
    { timeLimit: form.timeLimit },
    {
      closeKey: 'timeLimitState',
      validate: () =>
        form.timeLimit !== 0 && form.timeLimit !== 1
          ? '请先选择状态'
          : null,
    },
  );
}

async function submitTimeLimitRules() {
  await run(
    'multipleSetTimeLimitRules',
    { timeRules: `${form.start}|${form.end}` },
    {
      closeKey: 'timeLimitRules',
      validate: () => {
        if (!form.start || !form.end) return '请选择开启、关闭时间';
        if (form.start === form.end) return '开启、关闭时间不能相同';
        return null;
      },
    },
  );
}

async function clearTimeRules() {
  await run('multipleSetTimeRulesDelete', {}, { closeKey: 'timeLimitRules' });
}

async function submitPassageGroup() {
  await run(
    'multipleSetPassageGroup',
    { passageGroup: form.passageGroup ?? '' },
    { closeKey: 'passageGroup' },
  );
}

async function clearBalance() {
  await run('multipleSetBalanceZero', {});
}

async function deleteSelected() {
  const ok = await run('multipleSetDelete', {}, {
    successMsg: '删除成功',
    closeDrawer: true,
  });
  if (ok) emit('deleted');
}

function copySelected() {
  emit('batch-copy');
}

defineExpose({ show, closeAndReset });
</script>

<template>
  <Drawer
    v-model:open="visible"
    title="批量操作通道"
    :width="640"
    destroy-on-close
    class="passage-batch-drawer-wrap"
    @close="onDrawerClose"
  >
    <div class="pbd">
      <div class="pbd-summary">
        <Divider orientation="left">
          <Tag color="blue">已选通道（{{ selectedIds.length }} 条）</Tag>
        </Divider>
        <Textarea
          :value="summaryText"
          readonly
          class="pbd-summary__list"
          :auto-size="{ minRows: 6, maxRows: 14 }"
          placeholder="所选通道将显示在此处"
        />
      </div>

      <section class="pbd-section">
        <Divider orientation="left">
          <Tag color="blue">常用操作</Tag>
        </Divider>
        <Row :gutter="[8, 8]">
          <Col :span="12">
            <Button type="primary" ghost @click="openDialog('state')">
              批量开启/关闭
            </Button>
          </Col>
          <Col :span="12">
            <Popconfirm
              title="确认清空所选通道余额？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="clearBalance"
            >
              <Button danger ghost :loading="saving">清空通道余额</Button>
            </Popconfirm>
          </Col>
        </Row>
      </section>

      <section class="pbd-section">
        <Divider orientation="left">
          <Tag color="blue">通道属性</Tag>
        </Divider>
        <Row :gutter="[8, 8]">
          <Col :span="12">
            <Button ghost @click="openDialog('product')">修改所属产品</Button>
          </Col>
          <Col :span="12">
            <Button ghost @click="openDialog('rate')">设置通道费率</Button>
          </Col>
        </Row>
        <Row :gutter="[8, 8]" class="mt-2">
          <Col :span="12">
            <Button ghost @click="openDialog('payRules')">修改收款规则</Button>
          </Col>
          <Col :span="12">
            <Button ghost @click="openDialog('weights')">修改轮询权重</Button>
          </Col>
        </Row>
        <Row :gutter="[8, 8]" class="mt-2">
          <Col :span="24">
            <Button ghost @click="openDialog('ifCode')">修改支付接口</Button>
          </Col>
        </Row>
      </section>

      <section class="pbd-section">
        <Divider orientation="left">
          <Tag color="blue">支付配置</Tag>
        </Divider>
        <Row :gutter="[8, 8]">
          <Col :span="12">
            <Button ghost @click="openDialog('mchNo')">修改通道商户号</Button>
          </Col>
          <Col :span="12">
            <Button ghost @click="openDialog('secret')">修改商户密钥</Button>
          </Col>
        </Row>
        <Row :gutter="[8, 8]" class="mt-2">
          <Col :span="12">
            <Button ghost @click="openDialog('gate')">修改下单网关</Button>
          </Col>
          <Col :span="12">
            <Button ghost @click="openDialog('ip')">修改通道回调 IP</Button>
          </Col>
        </Row>
      </section>

      <section class="pbd-section">
        <Divider orientation="left">
          <Tag color="blue">定时策略</Tag>
        </Divider>
        <Row :gutter="[8, 8]">
          <Col :span="12">
            <Button ghost @click="openDialog('timeLimitState')">
              开关通道定时
            </Button>
          </Col>
          <Col :span="12">
            <Button ghost @click="openTimeLimitRules">修改定时配置</Button>
          </Col>
        </Row>
      </section>

      <section class="pbd-section">
        <Divider orientation="left">
          <Tag color="blue">供应商</Tag>
        </Divider>
        <Row :gutter="[8, 8]">
          <Col :span="24">
            <Button ghost @click="openDialog('passageGroup')">
              修改所属供应商
            </Button>
          </Col>
        </Row>
      </section>

      <section class="pbd-section pbd-section--risk">
        <Divider orientation="left">
          <Tag color="blue">谨慎操作</Tag>
        </Divider>
        <p class="pbd-risk-hint">
          批量复制将继承通道配置；批量删除须所选通道余额均为 0
        </p>
        <Row :gutter="[8, 8]">
          <Col :span="12">
            <Button ghost class="pbd-warn-btn" @click="copySelected">
              批量一键复制
            </Button>
          </Col>
          <Col :span="12">
            <Popconfirm
              title="确认删除所选通道？所选通道余额须均为 0。"
              ok-text="确定"
              cancel-text="取消"
              @confirm="deleteSelected"
            >
              <Button danger ghost :loading="saving">批量删除通道</Button>
            </Popconfirm>
          </Col>
        </Row>
      </section>
    </div>

    <template #footer>
      <Button @click="onDrawerClose">关闭</Button>
    </template>
  </Drawer>

  <Modal
    v-model:open="dialogs.state"
    title="批量开关通道"
    :width="640"
    :confirm-loading="saving"
    :ok-button-props="{ disabled: form.state == null }"
    ok-text="确定"
    cancel-text="取消"
    destroy-on-close
    @ok="submitState"
  >
    <Form layout="vertical">
      <Form.Item label="通道操作">
        <Radio.Group v-model:value="form.state">
          <Radio :value="1">启用</Radio>
          <Radio :value="0">禁用</Radio>
        </Radio.Group>
      </Form.Item>
    </Form>
  </Modal>

  <Modal
    v-model:open="dialogs.product"
    title="批量设置产品"
    :width="640"
    :confirm-loading="saving"
    ok-text="确定"
    cancel-text="取消"
    destroy-on-close
    @ok="submitProduct"
  >
    <Form layout="vertical">
      <Form.Item label="所属产品">
        <ProductSelector
          v-model="form.productId"
          placeholder="对应产品"
          style="width: 100%"
        />
      </Form.Item>
    </Form>
  </Modal>

  <Modal
    v-model:open="dialogs.ifCode"
    title="批量设置支付接口"
    :width="640"
    :confirm-loading="saving"
    ok-text="确定"
    cancel-text="取消"
    destroy-on-close
    @ok="submitIfCode"
  >
    <Form layout="vertical">
      <Form.Item label="支付接口">
        <Select
          v-model:value="form.ifCode"
          allow-clear
          show-search
          option-filter-prop="label"
          :loading="ifLoading"
          :options="ifOptions"
          placeholder="请选择支付接口"
          style="width: 100%"
        />
      </Form.Item>
    </Form>
  </Modal>

  <Modal
    v-model:open="dialogs.rate"
    title="批量设置费率"
    :width="640"
    :confirm-loading="saving"
    ok-text="确定"
    cancel-text="取消"
    destroy-on-close
    @ok="submitRate"
  >
    <Alert
      type="warning"
      show-icon
      message="请先核对后谨慎操作"
      class="mb-3"
    />
    <Form layout="vertical">
      <Form.Item label="通道费率（%）">
        <InputNumber
          v-model:value="form.rate"
          :precision="2"
          :step="0.01"
          :min="-200"
          :max="200"
          addon-after="%"
          style="width: 100%"
          placeholder="请输入通道费率"
        />
      </Form.Item>
    </Form>
  </Modal>

  <Modal
    v-model:open="dialogs.payRules"
    title="批量设置收款规则"
    :width="640"
    :confirm-loading="saving"
    ok-text="确定"
    cancel-text="取消"
    destroy-on-close
    @ok="submitPayRules"
  >
    <Alert
      type="warning"
      show-icon
      message="将覆盖所选通道的收款方式与收款规则"
      class="mb-3"
    />
    <Form layout="vertical">
      <Form.Item label="收款方式">
        <Select
          v-model:value="form.payType"
          :options="PAY_TYPE_OPTIONS"
          :allow-clear="false"
          placeholder="请选择收款方式"
          style="width: 100%"
        />
      </Form.Item>
      <Form.Item label="收款规则">
        <Textarea
          v-model:value="form.payRules"
          placeholder="区间范围例如:10-50000；固定金额例如:10|20 或 50"
          :auto-size="{ minRows: 3, maxRows: 6 }"
        />
      </Form.Item>
    </Form>
  </Modal>

  <Modal
    v-model:open="dialogs.weights"
    title="批量设置轮询权重"
    :width="640"
    :confirm-loading="saving"
    ok-text="确定"
    cancel-text="取消"
    destroy-on-close
    @ok="submitWeights"
  >
    <Form layout="vertical">
      <Form.Item label="轮询权重">
        <InputNumber
          v-model:value="form.weights"
          :min="1"
          :max="10000"
          :precision="0"
          style="width: 100%"
          placeholder="1-10000 的整数"
        />
      </Form.Item>
    </Form>
  </Modal>

  <Modal
    v-model:open="dialogs.gate"
    title="批量设置下单网关"
    :width="640"
    :confirm-loading="saving"
    ok-text="确定"
    cancel-text="取消"
    destroy-on-close
    @ok="submitGate"
  >
    <Alert
      type="warning"
      show-icon
      message="请先核对后谨慎操作"
      class="mb-3"
    />
    <Form layout="vertical">
      <Form.Item label="下单网关（需 http 开头）">
        <Input v-model:value="form.gate" placeholder="请输入完整 URL" />
      </Form.Item>
    </Form>
  </Modal>

  <Modal
    v-model:open="dialogs.ip"
    title="批量设置回调 IP"
    :width="640"
    :confirm-loading="saving"
    ok-text="确定"
    cancel-text="取消"
    destroy-on-close
    @ok="submitIp"
  >
    <Alert
      type="info"
      show-icon
      message="多个地址以 | 分隔，* 表示允许全部 IP"
      class="mb-3"
    />
    <Form layout="vertical">
      <Form.Item label="回调 IP">
        <Input v-model:value="form.ip" placeholder="请输入" />
      </Form.Item>
    </Form>
  </Modal>

  <Modal
    v-model:open="dialogs.mchNo"
    title="批量设置商户号"
    :width="640"
    :confirm-loading="saving"
    ok-text="确定"
    cancel-text="取消"
    destroy-on-close
    @ok="submitMchNo"
  >
    <Form layout="vertical">
      <Form.Item label="商户号">
        <Input v-model:value="form.mchNo" placeholder="请输入" />
      </Form.Item>
    </Form>
  </Modal>

  <Modal
    v-model:open="dialogs.secret"
    title="批量设置密钥"
    :width="640"
    :confirm-loading="saving"
    ok-text="确定"
    cancel-text="取消"
    destroy-on-close
    @ok="submitSecret"
  >
    <Form layout="vertical">
      <Form.Item label="密钥">
        <Input v-model:value="form.secret" placeholder="请输入" />
      </Form.Item>
    </Form>
  </Modal>

  <Modal
    v-model:open="dialogs.timeLimitState"
    title="批量开关通道定时"
    :width="640"
    :confirm-loading="saving"
    ok-text="确定"
    cancel-text="取消"
    destroy-on-close
    @ok="submitTimeLimitState"
  >
    <Form layout="vertical">
      <Form.Item label="定时状态">
        <Radio.Group v-model:value="form.timeLimit">
          <Radio :value="1">启用</Radio>
          <Radio :value="0">禁用</Radio>
        </Radio.Group>
      </Form.Item>
    </Form>
  </Modal>

  <Modal
    v-model:open="dialogs.timeLimitRules"
    title="通道定时开启设置"
    :width="640"
    :footer="null"
    destroy-on-close
  >
    <Alert
      type="info"
      show-icon
      class="mb-3"
      message="设置可用时间段，例如 08:00–23:00；23:00–07:00 表示跨天时段。"
    />
    <Form layout="vertical" class="pbd-time-rules-form">
      <Form.Item label="开启时间">
        <TimePicker
          v-model:value="form.start"
          format="HH:mm"
          value-format="HH:mm"
          placeholder="例如 08:00"
          allow-clear
          style="width: 100%"
        />
      </Form.Item>
      <Form.Item label="关闭时间">
        <TimePicker
          v-model:value="form.end"
          format="HH:mm"
          value-format="HH:mm"
          placeholder="例如 23:00"
          allow-clear
          style="width: 100%"
        />
      </Form.Item>
    </Form>
    <div class="pbd-dialog-footer-row">
      <Popconfirm
        title="确认后将清除定时设置并关闭定时开关"
        ok-text="确定"
        cancel-text="取消"
        @confirm="clearTimeRules"
      >
        <Button ghost class="pbd-warn-btn" :loading="saving">清除定时</Button>
      </Popconfirm>
      <Space>
        <Button @click="dialogs.timeLimitRules = false">取消</Button>
        <Button type="primary" :loading="saving" @click="submitTimeLimitRules">
          确定
        </Button>
      </Space>
    </div>
  </Modal>

  <Modal
    v-model:open="dialogs.passageGroup"
    title="通道供应商批量设置"
    :width="640"
    :confirm-loading="saving"
    ok-text="确定"
    cancel-text="取消"
    destroy-on-close
    @ok="submitPassageGroup"
  >
    <Alert
      type="warning"
      show-icon
      message="设置后将直接覆盖所选通道的原设置"
      class="mb-3"
    />
    <Form layout="vertical">
      <Form.Item label="所属通道供应商">
        <PassageGroupSelector
          v-model="form.passageGroup"
          placeholder="对应通道供应商"
          style="width: 100%"
        />
      </Form.Item>
    </Form>
  </Modal>
</template>

<style scoped>
.passage-batch-drawer-wrap :deep(.ant-drawer-body) {
  padding: 24px;
  overflow-y: auto;
}

.pbd {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 4px;
}

.pbd-summary {
  padding: 0 16px 16px;
  background: var(--ant-color-fill-quaternary, #fafafa);
  border: 1px solid var(--ant-color-border-secondary, #f0f0f0);
  border-radius: 6px;
}

.pbd-summary__list :deep(textarea.ant-input) {
  font-family: ui-monospace, 'Cascadia Code', Menlo, monospace;
  font-size: 12px;
  line-height: 1.5;
  color: var(--ant-color-text-secondary, #64748b);
}

.pbd-section :deep(.ant-col) {
  display: flex;
  align-items: flex-start;
  min-width: 0;
}

.pbd-section :deep(.ant-btn) {
  max-width: 100%;
}

.pbd-section--risk {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0 12px 16px;
  background-color: color-mix(in srgb, #ff4d4f 8%, transparent);
  border: 1px dashed color-mix(in srgb, #ff4d4f 45%, transparent);
  border-radius: 6px;
}

.pbd-section--risk :deep(.ant-divider) {
  width: 100%;
  box-sizing: border-box;
}

.pbd-risk-hint {
  margin: -8px 0 12px;
  font-size: 12px;
  color: var(--ant-color-text-secondary, #64748b);
  line-height: 1.45;
}

.pbd-warn-btn {
  color: #d48806;
  border-color: #d48806;
}

.pbd-warn-btn:hover {
  color: #ad6800;
  border-color: #ad6800;
}

.pbd-dialog-footer-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
}

.pbd-time-rules-form {
  margin-bottom: 8px;
}

.mt-2 {
  margin-top: 8px;
}

.mb-3 {
  margin-bottom: 12px;
}
</style>

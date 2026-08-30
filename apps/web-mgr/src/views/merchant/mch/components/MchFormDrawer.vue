<script lang="ts" setup>
import { computed, reactive, ref } from 'vue';

import {
  Button,
  Divider,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Space,
  Tag,
  Textarea,
  message,
} from 'ant-design-vue';

import {
  createMchInfoApi,
  fetchMchCashierApi,
  fetchMchInfoApi,
  resetMchLoginAuthApi,
  updateMchInfoApi,
  updateMchLoginWhiteListApi,
} from '#/api';
import { LOCKED_MCH_NO, isValidWhiteList, randomSecret } from '#/constants/merchant';

const emit = defineEmits<{ success: [] }>();

const visible = ref(false);
const creating = ref(true);
const saving = ref(false);
const loaded = ref(false);
const editingNo = ref<string | null>(null);
const limitMode = ref<'limited' | 'unlimited'>('unlimited');
const savedLimit = ref<number | null>(null);
const formRef = ref();

const emptyForm = {
  mchNo: '',
  mchName: '',
  loginUserName: '',
  agentNo: '',
  mchGroup: '',
  orderCountLimit: -1,
  state: 1,
  secret: '',
  remark: '',
  canPush: 1,
  canNotify: 1,
  canRateNotify: 1,
  cashierState: 0,
  loginWhiteList: '',
};

const form = reactive({ ...emptyForm });
const locked = computed(() => form.mchNo === LOCKED_MCH_NO);

const whiteOpen = ref(false);
const whiteSaving = ref(false);
const whiteText = ref('');

function emptyToStr(value?: null | string) {
  return value ?? '';
}

function applyLimit(value?: number) {
  const n = Number(value);
  if (Number.isInteger(n) && n > 0) {
    limitMode.value = 'limited';
    savedLimit.value = n;
    form.orderCountLimit = n;
    return;
  }
  limitMode.value = 'unlimited';
  savedLimit.value = null;
  form.orderCountLimit = -1;
}

function onLimitModeChange(mode: string) {
  if (mode === 'unlimited') {
    const current = Number(form.orderCountLimit);
    if (Number.isInteger(current) && current > 0) {
      savedLimit.value = current;
    }
    form.orderCountLimit = -1;
  } else {
    form.orderCountLimit = savedLimit.value ?? 1;
  }
}

function fill(row: Record<string, unknown>) {
  Object.assign(form, {
    mchNo: row.mchNo,
    mchName: row.mchName ?? '',
    loginUserName: row.loginUserName ?? '',
    agentNo: row.agentNo ?? '',
    mchGroup: row.mchGroup ?? '',
    orderCountLimit: row.orderCountLimit ?? -1,
    state: row.state ?? 1,
    secret: row.secret ?? '',
    remark: row.remark ?? '',
    canPush: row.canPush ?? 1,
    canNotify: row.canNotify ?? 1,
    canRateNotify: row.canRateNotify ?? 1,
    cashierState: row.cashierState ?? 0,
    loginWhiteList: row.loginWhiteList ?? '',
  });
  applyLimit(row.orderCountLimit as number | undefined);
}

async function show(mchNo?: string) {
  creating.value = !mchNo;
  saving.value = false;
  formRef.value?.clearValidate?.();
  Object.assign(form, { ...emptyForm });
  applyLimit(form.orderCountLimit);
  if (mchNo) {
    editingNo.value = mchNo;
    loaded.value = true;
    fill((await fetchMchInfoApi(mchNo)) as unknown as Record<string, unknown>);
  } else {
    editingNo.value = null;
    loaded.value = false;
    form.secret = randomSecret();
  }
  visible.value = true;
}

async function save() {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  if (!locked.value) {
    if (limitMode.value === 'limited') {
      const n = Number(form.orderCountLimit);
      if (!Number.isInteger(n) || n <= 0) {
        message.error('并发限制数量必须是大于 0 的正整数');
        return;
      }
    }
    if (!/^[a-z0-9]{128}$/i.test(form.secret)) {
      message.error('私钥须为128位字母数字');
      return;
    }
  }
  saving.value = true;
  try {
    if (creating.value) {
      await createMchInfoApi({
        mchName: form.mchName,
        loginUserName: form.loginUserName,
        agentNo: emptyToStr(form.agentNo),
        mchGroup: emptyToStr(form.mchGroup),
        orderCountLimit: Number(form.orderCountLimit),
        state: form.state,
        secret: form.secret,
        remark: emptyToStr(form.remark),
      });
      message.success('新增成功');
      visible.value = false;
      emit('success');
    } else if (editingNo.value) {
      const payload: Record<string, unknown> = {
        agentNo: emptyToStr(form.agentNo),
        mchGroup: emptyToStr(form.mchGroup),
        remark: emptyToStr(form.remark),
      };
      if (!locked.value) {
        Object.assign(payload, {
          mchName: form.mchName,
          orderCountLimit: Number(form.orderCountLimit),
          state: form.state,
          secret: form.secret,
          canPush: form.canPush,
          canNotify: form.canNotify,
          canRateNotify: form.canRateNotify,
          cashierState: form.cashierState,
        });
      }
      await updateMchInfoApi(editingNo.value, payload as never);
      message.success('修改成功');
      visible.value = false;
      emit('success');
    }
  } finally {
    saving.value = false;
  }
}

function confirmResetAuth() {
  Modal.confirm({
    title: '确认重置密码并解绑谷歌验证',
    content: '确定要重置该商户的登录密码并解绑谷歌验证吗？操作后恢复默认密码。',
    okText: '确定',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      await resetMchLoginAuthApi(form.mchNo);
      message.success('密码已恢复为默认密码，并已解绑谷歌验证');
    },
  });
}

function openWhiteList() {
  whiteText.value = form.loginWhiteList || '';
  whiteOpen.value = true;
}

async function saveWhiteList() {
  const text = whiteText.value.trim();
  if (!isValidWhiteList(text)) {
    message.error('白名单格式错误（多个 IP 用 | 分隔，或填 *）');
    return;
  }
  whiteSaving.value = true;
  try {
    await updateMchLoginWhiteListApi(form.mchNo, text);
    form.loginWhiteList = text;
    message.success('修改成功');
    whiteOpen.value = false;
  } finally {
    whiteSaving.value = false;
  }
}

async function openCashier() {
  const url = await fetchMchCashierApi(form.mchNo);
  if (url) window.open(url, '_blank');
}

function onClose() {
  visible.value = false;
  saving.value = false;
  loaded.value = false;
}

defineExpose({ show });
</script>

<template>
  <Drawer
    v-model:open="visible"
    :title="creating ? '新增商户' : '修改商户'"
    :width="560"
    :mask-closable="false"
    destroy-on-close
    class="mch-form-drawer"
    @close="onClose"
  >
    <div class="ap-drawer-body">
    <Form
      ref="formRef"
      :model="form"
      layout="vertical"
      class="ap-drawer-form"
    >
      <Divider orientation="left">
        <Tag color="processing">基础信息</Tag>
      </Divider>
      <Form.Item
        label="商户名称"
        name="mchName"
        :rules="[{ required: true, message: '请输入商户名称' }]"
      >
        <Input
          v-model:value="form.mchName"
          placeholder="请输入商户名称"
          :disabled="locked"
        />
      </Form.Item>
      <Form.Item
        label="登录名"
        name="loginUserName"
        :rules="[
          { required: true, message: '请输入登录名' },
          {
            pattern: /^[a-z][a-z0-9]{5,17}$/i,
            message: '字母开头，长度为6-18位',
          },
        ]"
      >
        <Input
          v-model:value="form.loginUserName"
          placeholder="请输入商户登录名（字母开头，6-18位）"
          :disabled="!creating"
        />
      </Form.Item>
      <Form.Item label="代理商号" name="agentNo">
        <Input v-model:value="form.agentNo" placeholder="请选择代理商" allow-clear />
      </Form.Item>
      <Form.Item label="所属分组" name="mchGroup">
        <Input
          v-model:value="form.mchGroup"
          placeholder="请选择商户分组（可不选）"
          allow-clear
        />
        <div class="text-muted-foreground mt-1 text-xs">
          不选择表示该商户不属于任何分组；已停用的当前分组仍会保留显示。
        </div>
      </Form.Item>
      <template v-if="!locked">
        <Form.Item label="并发限制" name="orderCountLimit">
          <Space>
            <Radio.Group
              v-model:value="limitMode"
              @change="(e: any) => onLimitModeChange(e.target.value)"
            >
              <Radio value="unlimited">不限</Radio>
              <Radio value="limited">限制</Radio>
            </Radio.Group>
            <InputNumber
              v-if="limitMode === 'limited'"
              v-model:value="form.orderCountLimit"
              :min="1"
              :max="2147483647"
              :precision="0"
              placeholder="请输入正整数"
              style="width: 160px"
            />
          </Space>
          <div class="text-muted-foreground mt-1 text-xs">
            按自然分钟统计下单数量；选择“限制”后，请设置每分钟允许的最大订单数。
          </div>
        </Form.Item>
        <Form.Item label="状态" name="state">
          <Radio.Group v-model:value="form.state">
            <Radio :value="1">启用</Radio>
            <Radio :value="0">禁用</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          label="商户私钥"
          name="secret"
          :rules="[{ required: true, message: '请点击生成私钥' }]"
        >
          <Textarea
            v-model:value="form.secret"
            placeholder="请输入（128位，可点击随机生成）"
            :rows="4"
          />
          <Button
            class="mt-2"
            size="small"
            type="primary"
            ghost
            @click="form.secret = randomSecret()"
          >
            随机生成私钥
          </Button>
        </Form.Item>
      </template>
      <Form.Item label="备注" name="remark">
        <Textarea
          v-model:value="form.remark"
          placeholder="请输入内容"
          :rows="4"
        />
      </Form.Item>
      <template v-if="!locked && !creating">
        <Divider orientation="left">
          <Tag color="error">账户安全</Tag>
        </Divider>
        <Form.Item v-if="loaded" label="商户登录IP白名单">
          <Textarea
            v-model:value="form.loginWhiteList"
            placeholder="登录白名单(多个IP | 隔开，允许所有IP登录为 *"
            :rows="4"
            disabled
          />
          <Button class="mt-2" size="small" type="primary" ghost @click="openWhiteList">
            修改IP白名单
          </Button>
        </Form.Item>
        <Form.Item v-if="loaded" label="重置密码">
          <Button danger ghost @click="confirmResetAuth">
            重置密码并解绑谷歌验证
          </Button>
        </Form.Item>
        <Divider orientation="left">
          <Tag color="error">其他设置</Tag>
        </Divider>
        <Form.Item label="启用推送" name="canPush">
          <Space>
            <Radio.Group v-model:value="form.canPush">
              <Radio :value="1">启用</Radio>
              <Radio :value="0">禁用</Radio>
            </Radio.Group>
            <span class="text-muted-foreground text-xs">是否接收群发消息</span>
          </Space>
        </Form.Item>
        <Form.Item label="启用通知" name="canNotify">
          <Space>
            <Radio.Group v-model:value="form.canNotify">
              <Radio :value="1">启用</Radio>
              <Radio :value="0">禁用</Radio>
            </Radio.Group>
            <span class="text-muted-foreground text-xs">是否接收动账、预付等</span>
          </Space>
        </Form.Item>
        <Form.Item label="启用费率变动提醒" name="canRateNotify">
          <Radio.Group v-model:value="form.canRateNotify">
            <Radio :value="1">启用</Radio>
            <Radio :value="0">禁用</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item label="是否启用收银台" name="cashierState">
          <Radio.Group v-model:value="form.cashierState">
            <Radio :value="1">启用</Radio>
            <Radio :value="0">禁用</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item label="收银台地址">
          <Button size="small" type="primary" ghost @click="openCashier">
            打开收银台地址
          </Button>
        </Form.Item>
      </template>
    </Form>
    </div>
    <template #footer>
      <Space>
        <Button type="primary" :loading="saving" @click="save">保存</Button>
        <Button @click="onClose">取消</Button>
      </Space>
    </template>
  </Drawer>

  <Modal
    v-model:open="whiteOpen"
    title="修改IP白名单"
    :confirm-loading="whiteSaving"
    ok-text="确定"
    cancel-text="取消"
    @ok="saveWhiteList"
  >
    <Textarea
      v-model:value="whiteText"
      placeholder="登录白名单(多个IP | 隔开，允许所有IP登录为 *"
      :rows="6"
    />
  </Modal>
</template>

<style scoped>
.mch-form-drawer :deep(.ant-drawer-body) {
  padding-top: 8px;
  padding-bottom: 16px;
}

.ap-drawer-form :deep(.ant-form-item) {
  margin-bottom: 18px;
}

.ap-drawer-form :deep(.ant-divider) {
  margin: 8px 0 20px;
}
</style>

<script lang="ts" setup>
import type { PlatTenant } from '#/api';
import type { TenantPlanType } from '#/mock/types';

import { reactive, ref } from 'vue';

import {
  Button,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Radio,
  Space,
} from 'ant-design-vue';

const emit = defineEmits<{
  success: [
    payload: {
      contactMobile?: string;
      contactName?: string;
      initialPassword?: string;
      mgrAdminUsername?: string;
      mgrDomain?: string;
      monthlyFee?: number;
      planBalance?: number;
      planEffectiveOn: string;
      planExpireOn?: string;
      planType: TenantPlanType;
      ratePercent?: number;
      remark?: string;
      state?: 0 | 1;
      tenantCode: string;
      tenantId?: string;
      tenantName: string;
    },
  ];
}>();

const visible = ref(false);
const creating = ref(true);
const originalPlanType = ref<TenantPlanType>('perpetual');

function today() {
  return new Date().toISOString().slice(0, 10);
}

function defaultExpire() {
  const d = new Date(`${today()}T00:00:00`);
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

const form = reactive({
  tenantId: '',
  tenantCode: '',
  tenantName: '',
  mgrDomain: '',
  contactName: '',
  contactMobile: '',
  mgrAdminUsername: '',
  initialPassword: '',
  state: 1 as 0 | 1,
  planType: 'perpetual' as TenantPlanType,
  monthlyFee: undefined as number | undefined,
  ratePercent: undefined as number | undefined,
  planEffectiveOn: today(),
  planExpireOn: defaultExpire(),
  planBalance: undefined as number | undefined,
  remark: '',
});

function reset() {
  Object.assign(form, {
    tenantId: '',
    tenantCode: '',
    tenantName: '',
    mgrDomain: '',
    contactName: '',
    contactMobile: '',
    mgrAdminUsername: '',
    initialPassword: '',
    state: 1,
    planType: 'perpetual',
    monthlyFee: undefined,
    ratePercent: undefined,
    planEffectiveOn: today(),
    planExpireOn: defaultExpire(),
    planBalance: undefined,
    remark: '',
  });
  originalPlanType.value = 'perpetual';
}

function showCreate() {
  creating.value = true;
  reset();
  visible.value = true;
}

function showEdit(row: PlatTenant) {
  creating.value = false;
  originalPlanType.value = row.planType;
  Object.assign(form, {
    tenantId: row.tenantId,
    tenantCode: row.tenantCode,
    tenantName: row.tenantName,
    mgrDomain: row.mgrDomain,
    contactName: row.contactName,
    contactMobile: row.contactMobile,
    mgrAdminUsername: row.mgrAdminUsername,
    initialPassword: '',
    state: row.state,
    planType: row.planType,
    monthlyFee: row.monthlyFee,
    ratePercent: row.ratePercent,
    planEffectiveOn: row.planEffectiveOn || today(),
    planExpireOn: row.planExpireOn || defaultExpire(),
    planBalance: row.planBalance,
    remark: row.remark ?? '',
  });
  visible.value = true;
}

function onPlanTypeChange(next: TenantPlanType) {
  if (form.planType === next) return;
  if (!creating.value && originalPlanType.value !== next) {
    Modal.confirm({
      title: '确认更换用户类型',
      content:
        '更换后按运营端主页规则展示：包月用户只显示到期；流水扣费显示余额与到期；永久有效两者都不显示。',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        form.planType = next;
      },
    });
    return;
  }
  form.planType = next;
}

function submit() {
  if (!form.tenantCode.trim() || !form.tenantName.trim()) {
    message.error('请填写租户编码与名称');
    return;
  }
  if (creating.value) {
    if (!form.mgrAdminUsername.trim()) {
      message.error('请填写运营端主账号');
      return;
    }
    if (form.initialPassword.trim().length < 6) {
      message.error('主账号初始密码至少 6 位');
      return;
    }
  }
  if (form.planType !== 'perpetual') {
    if (!form.planEffectiveOn) {
      message.error('请选择生效日');
      return;
    }
    if (!form.planExpireOn) {
      message.error('请选择到期日');
      return;
    }
  }
  if (form.planType === 'monthly') {
    const fee = Number(form.monthlyFee);
    if (!Number.isFinite(fee) || fee <= 0) {
      message.error('请填写大于 0 的月费金额');
      return;
    }
  } else if (form.planType === 'rate') {
    const percent = Number(form.ratePercent);
    if (!Number.isFinite(percent) || percent <= 0) {
      message.error('请填写大于 0 的抽成比例');
      return;
    }
    if (creating.value) {
      const balance = Number(form.planBalance ?? 0);
      if (!Number.isFinite(balance) || balance < 0) {
        message.error('租户余额不能为负数');
        return;
      }
    }
  }
  emit('success', { ...form });
  visible.value = false;
}

defineExpose({ showCreate, showEdit });
</script>

<template>
  <Drawer
    v-model:open="visible"
    :title="creating ? '新建运营端' : '编辑运营端'"
    :width="480"
    destroy-on-close
  >
    <div class="ap-drawer-body">
      <section class="ap-drawer-section">
        <div class="ap-drawer-section-head">
          <h3 class="ap-drawer-section-title">运营端信息</h3>
        </div>
        <Form layout="vertical" class="ap-drawer-form">
          <Form.Item label="租户编码" required>
            <Input
              v-model:value="form.tenantCode"
              :disabled="!creating"
              placeholder="如 yanshi"
            />
          </Form.Item>
          <Form.Item label="运营端名称" required>
            <Input v-model:value="form.tenantName" placeholder="展示名称" />
          </Form.Item>
          <Form.Item label="运营域名">
            <Input
              v-model:value="form.mgrDomain"
              placeholder="mgr.example.com"
            />
          </Form.Item>
          <Form.Item label="联系人">
            <Input v-model:value="form.contactName" />
          </Form.Item>
          <Form.Item label="联系电话">
            <Input v-model:value="form.contactMobile" />
          </Form.Item>
          <Form.Item label="状态">
            <Radio.Group v-model:value="form.state">
              <Radio :value="1">启用</Radio>
              <Radio :value="0">停用</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="备注">
            <Input.TextArea v-model:value="form.remark" :rows="3" />
          </Form.Item>
        </Form>
      </section>
      <section class="ap-drawer-section">
        <div class="ap-drawer-section-head">
          <div>
            <h3 class="ap-drawer-section-title">用户类型</h3>
            <p class="ap-drawer-section-desc">
              与运营端主页「用户类型」同一套
              tenant.type：包月用户只展示到期日；流水扣费展示当前余额与到期日；永久有效两者都不展示。
            </p>
          </div>
        </div>
        <Form layout="vertical" class="ap-drawer-form">
          <Form.Item label="用户类型" required>
            <Radio.Group
              :value="form.planType"
              @update:value="onPlanTypeChange"
            >
              <Radio value="perpetual">永久有效</Radio>
              <Radio value="monthly">包月用户</Radio>
              <Radio value="rate">流水扣费</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            v-if="form.planType === 'monthly'"
            label="月费金额"
            required
          >
            <InputNumber
              v-model:value="form.monthlyFee"
              :min="0.01"
              :precision="2"
              :step="100"
              addon-before="¥"
              placeholder="每月定额"
              style="width: 100%"
            />
          </Form.Item>
          <Form.Item v-if="form.planType === 'rate'" label="抽成比例" required>
            <InputNumber
              v-model:value="form.ratePercent"
              :min="0.01"
              :max="100"
              :precision="2"
              :step="0.01"
              addon-after="%"
              placeholder="成功流水百分比"
              style="width: 100%"
            />
          </Form.Item>
          <template v-if="form.planType !== 'perpetual'">
            <Form.Item label="生效日" required>
              <DatePicker
                v-model:value="form.planEffectiveOn"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </Form.Item>
            <Form.Item label="到期日" required>
              <DatePicker
                v-model:value="form.planExpireOn"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </Form.Item>
          </template>
          <Form.Item
            v-if="form.planType === 'rate' && creating"
            label="初始余额"
            required
          >
            <InputNumber
              v-model:value="form.planBalance"
              :min="0"
              :precision="2"
              :step="100"
              addon-before="¥"
              placeholder="对应运营端主页当前余额；之后用列表调额"
              style="width: 100%"
            />
          </Form.Item>
        </Form>
      </section>
      <section class="ap-drawer-section">
        <div class="ap-drawer-section-head">
          <div>
            <h3 class="ap-drawer-section-title">运营端主账号</h3>
            <p class="ap-drawer-section-desc">
              {{
                creating
                  ? '开户后用于登录该运营端。'
                  : '改密与解绑请用列表「主账号」。'
              }}
            </p>
          </div>
        </div>
        <Form layout="vertical" class="ap-drawer-form">
          <Form.Item v-if="creating" label="登录名" required>
            <Input
              v-model:value="form.mgrAdminUsername"
              placeholder="登录该运营端的主管理员"
            />
          </Form.Item>
          <Form.Item v-else label="登录名">
            <Input :value="form.mgrAdminUsername" disabled />
          </Form.Item>
          <Form.Item v-if="creating" label="初始密码" required>
            <Input.Password
              v-model:value="form.initialPassword"
              placeholder="至少 6 位"
            />
          </Form.Item>
        </Form>
      </section>
    </div>
    <template #footer>
      <Space>
        <Button @click="visible = false">取消</Button>
        <Button type="primary" @click="submit">保存</Button>
      </Space>
    </template>
  </Drawer>
</template>

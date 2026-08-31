<script lang="ts" setup>
import { computed, nextTick, reactive, ref } from 'vue';

import {
  Button,
  Divider,
  Drawer,
  Form,
  Input,
  Radio,
  Space,
  Spin,
  message,
} from 'ant-design-vue';

import {
  createPassageGroupApi,
  fetchPassageGroupApi,
  updatePassageGroupApi,
} from '#/api';
import { PASSAGE_GROUP_SETTLE_MODES } from '#/constants/merchant';

const emit = defineEmits<{ success: [toFirstPage: boolean] }>();

const TIME_RE = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

const visible = ref(false);
const creating = ref(true);
const detailLoading = ref(false);
const saving = ref(false);
const editingName = ref('');
let openSeq = 0;
const formRef = ref();
const form = reactive({
  passageGroupName: '',
  remark: '',
  state: 1,
  isAutoSettle: 2,
  autoSettleTime: '00:00',
  canPush: 1,
  canNotify: 1,
  canRemind: 1,
  canWarn: 1,
});

const independentSettle = computed(() => form.isAutoSettle === 1);

function resetForm() {
  form.passageGroupName = '';
  form.remark = '';
  form.state = 1;
  form.isAutoSettle = 2;
  form.autoSettleTime = '00:00';
  form.canPush = 1;
  form.canNotify = 1;
  form.canRemind = 1;
  form.canWarn = 1;
  editingName.value = '';
  detailLoading.value = false;
  saving.value = false;
}

function flag(value: unknown, fallback = 1) {
  return Number(value ?? fallback) === 0 ? 0 : 1;
}

function applyDetail(row: Record<string, unknown>, name: string) {
  form.passageGroupName = name;
  form.remark = String(row.remark ?? '');
  form.state = Number(row.state ?? 1) === 0 ? 0 : 1;
  const mode = Number(row.isAutoSettle ?? 2);
  form.isAutoSettle = mode === 0 || mode === 1 ? mode : 2;
  form.autoSettleTime = String(row.autoSettleTime || '00:00');
  form.canPush = flag(row.canPush);
  form.canNotify = flag(row.canNotify);
  form.canRemind = flag(row.canRemind);
  form.canWarn = flag(row.canWarn);
}

function stillOpen(seq: number, name: string) {
  return (
    seq === openSeq &&
    visible.value &&
    !creating.value &&
    editingName.value === name
  );
}

async function clearFormValidate() {
  await nextTick();
  formRef.value?.clearValidate?.();
}

function show(name?: string) {
  if (name) void showEdit(name);
  else showCreate();
}

function showCreate() {
  openSeq += 1;
  detailLoading.value = false;
  resetForm();
  creating.value = true;
  visible.value = true;
  void clearFormValidate();
}

async function showEdit(name: string) {
  const seq = ++openSeq;
  resetForm();
  creating.value = false;
  editingName.value = name;
  form.passageGroupName = name;
  visible.value = true;
  detailLoading.value = true;
  await clearFormValidate();
  if (!stillOpen(seq, name)) return;
  try {
    const detail = await fetchPassageGroupApi(name);
    if (detail && stillOpen(seq, name)) {
      applyDetail(detail as unknown as Record<string, unknown>, name);
    }
  } catch (error) {
    if (stillOpen(seq, name)) {
      message.error(error instanceof Error ? error.message : '加载供应商失败');
    }
  } finally {
    if (stillOpen(seq, name)) detailLoading.value = false;
  }
}

function onSettleModeChange() {
  if (form.isAutoSettle === 1 && !TIME_RE.test(form.autoSettleTime)) {
    form.autoSettleTime = '00:00';
  }
}

function closeDrawer() {
  openSeq += 1;
  detailLoading.value = false;
  visible.value = false;
  resetForm();
}

async function save() {
  if (!visible.value || detailLoading.value || saving.value) return;
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  const name = form.passageGroupName.trim();
  if (!name) {
    message.error('请输入通道供应商名称');
    return;
  }
  if (name.includes(' ')) {
    message.error('供应商名称不能包含空格');
    return;
  }
  if (name.length >= 40) {
    message.error('供应商名称不能超过40个字符');
    return;
  }
  if (form.isAutoSettle === 1 && !TIME_RE.test(form.autoSettleTime.trim())) {
    message.error('自动结算时间格式必须为HH:mm');
    return;
  }
  const payload: Record<string, unknown> = {
    passageGroupName: name,
    remark: form.remark,
    state: Number(form.state ?? 1),
    isAutoSettle: form.isAutoSettle,
    canPush: Number(form.canPush ?? 1),
    canNotify: Number(form.canNotify ?? 1),
    canRemind: Number(form.canRemind ?? 1),
    canWarn: Number(form.canWarn ?? 1),
  };
  if (form.isAutoSettle === 1) payload.autoSettleTime = form.autoSettleTime.trim();
  saving.value = true;
  const wasCreate = creating.value;
  try {
    if (wasCreate) {
      await createPassageGroupApi(payload);
      message.success('新增成功');
    } else {
      await updatePassageGroupApi(editingName.value, payload);
      message.success('修改成功');
    }
    visible.value = false;
    resetForm();
    emit('success', wasCreate);
  } catch (error) {
    message.error(error instanceof Error ? error.message : '保存失败');
  } finally {
    saving.value = false;
  }
}

defineExpose({ show, showCreate, showEdit });
</script>

<template>
  <Drawer
    v-model:open="visible"
    :title="creating ? '新增通道供应商' : '修改通道供应商'"
    :width="640"
    :mask-closable="false"
    destroy-on-close
    @close="closeDrawer"
  >
    <Spin :spinning="detailLoading">
      <Form
        v-if="visible"
        ref="formRef"
        :model="form"
        layout="vertical"
        class="ap-drawer-body ap-form-label-wide"
      >
        <Divider orientation="left">基础信息</Divider>
        <Form.Item
          label="通道供应商名称"
          name="passageGroupName"
          :rules="[
            { required: true, message: '请输入通道供应商名称' },
          ]"
        >
          <Input
            v-model:value="form.passageGroupName"
            :disabled="!creating"
            :maxlength="39"
            placeholder="请输入通道供应商名称"
          />
        </Form.Item>
        <Form.Item label="状态" name="state">
          <Radio.Group v-model:value="form.state">
            <Radio :value="1">启用</Radio>
            <Radio :value="0">禁用</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item label="备注" name="remark">
          <Input.TextArea
            v-model:value="form.remark"
            :auto-size="{ minRows: 3 }"
            placeholder="请输入备注"
          />
        </Form.Item>
        <Divider orientation="left">自动结算</Divider>
        <Form.Item
          label="自动结算模式"
          name="isAutoSettle"
          :rules="[{ required: true, message: '请选择自动结算模式' }]"
        >
          <Radio.Group
            v-model:value="form.isAutoSettle"
            class="settle-mode-group"
            @change="onSettleModeChange"
          >
            <Radio
              v-for="item in PASSAGE_GROUP_SETTLE_MODES"
              :key="item.value"
              :value="item.value"
            >
              <div class="settle-mode-content">
                <div class="settle-mode-title">{{ item.label }}</div>
                <p class="settle-mode-description">{{ item.description }}</p>
              </div>
            </Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          v-if="independentSettle"
          label="独立结算时间"
          name="autoSettleTime"
        >
          <Input
            v-model:value="form.autoSettleTime"
            placeholder="HH:mm，例如 00:00"
          />
          <p class="settle-mode-description" style="margin-top: 6px">
            每日按该时间执行供应商自动结算，格式为 HH:mm。
          </p>
        </Form.Item>
        <Divider orientation="left">推送/通知</Divider>
        <Form.Item label="启用推送（群发消息等）" name="canPush">
          <Radio.Group v-model:value="form.canPush">
            <Radio :value="1">启用</Radio>
            <Radio :value="0">禁用</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item label="启用通知（动账/预付等）" name="canNotify">
          <Radio.Group v-model:value="form.canNotify">
            <Radio :value="1">启用</Radio>
            <Radio :value="0">禁用</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item label="启用自动催单" name="canRemind">
          <Radio.Group v-model:value="form.canRemind">
            <Radio :value="1">启用</Radio>
            <Radio :value="0">禁用</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item label="启用异常警报" name="canWarn">
          <Radio.Group v-model:value="form.canWarn">
            <Radio :value="1">启用</Radio>
            <Radio :value="0">禁用</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Spin>
    <template #footer>
      <Space>
        <Button @click="closeDrawer">取消</Button>
        <Button type="primary" :loading="saving" @click="save">保存</Button>
      </Space>
    </template>
  </Drawer>
</template>

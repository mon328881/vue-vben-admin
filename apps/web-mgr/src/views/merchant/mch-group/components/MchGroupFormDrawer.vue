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
  Tag,
  TimePicker,
  message,
} from 'ant-design-vue';

import {
  createMchGroupApi,
  fetchMchGroupApi,
  updateMchGroupApi,
  type MchGroupInfo,
} from '#/api';
import { MCH_GROUP_SETTLE_MODES } from '#/constants/merchant';

const emit = defineEmits<{ success: [toFirstPage: boolean] }>();

const NAME_RE = /^[\p{L}\p{N}_-]+$/u;
const TIME_RE = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const NAME_ERROR =
  '商户分组名称不能为空或包含空格，最长64个字符，仅支持中英文、数字、下划线和短横线';

const visible = ref(false);
const creating = ref(true);
const detailLoading = ref(false);
const saving = ref(false);
const editingName = ref('');
const formRef = ref();
const form = reactive({
  mchGroupName: '',
  state: 1,
  isAutoSettle: 2,
  autoSettleTime: '00:00',
});
const independentSettle = computed(() => form.isAutoSettle === 1);

function resetForm() {
  form.mchGroupName = '';
  form.state = 1;
  form.isAutoSettle = 2;
  form.autoSettleTime = '00:00';
  editingName.value = '';
  detailLoading.value = false;
  saving.value = false;
}

function applyDetail(row: MchGroupInfo) {
  form.mchGroupName = row.mchGroupName;
  form.state = Number(row.state ?? 1) === 0 ? 0 : 1;
  const mode = Number(row.isAutoSettle ?? 2);
  form.isAutoSettle = mode === 0 || mode === 1 ? mode : 2;
  form.autoSettleTime = row.autoSettleTime || '00:00';
}

async function showCreate() {
  resetForm();
  creating.value = true;
  visible.value = true;
  await nextTick();
  formRef.value?.clearValidate?.();
}

async function showEdit(row: MchGroupInfo) {
  const name = row.mchGroupName;
  resetForm();
  creating.value = false;
  editingName.value = name;
  applyDetail(row);
  visible.value = true;
  detailLoading.value = true;
  await nextTick();
  formRef.value?.clearValidate?.();
  try {
    const detail = await fetchMchGroupApi(name);
    if (detail) applyDetail(detail);
  } catch (error) {
    message.error(error instanceof Error ? error.message : '加载分组失败');
  } finally {
    detailLoading.value = false;
  }
}

function onSettleModeChange() {
  if (form.isAutoSettle === 1 && !TIME_RE.test(form.autoSettleTime)) {
    form.autoSettleTime = '00:00';
  }
}

function closeDrawer() {
  visible.value = false;
  resetForm();
}

async function save() {
  if (!visible.value || detailLoading.value || saving.value) return;
  const name = form.mchGroupName.trim();
  if (
    !name ||
    Array.from(name).length > 64 ||
    !NAME_RE.test(name)
  ) {
    message.error(NAME_ERROR);
    return;
  }
  if (form.isAutoSettle === 1 && !TIME_RE.test(form.autoSettleTime.trim())) {
    message.error('自动结算时间格式必须为HH:mm');
    return;
  }
  const payload: { isAutoSettle: number; autoSettleTime?: string } = {
    isAutoSettle: form.isAutoSettle,
  };
  if (form.isAutoSettle === 1) payload.autoSettleTime = form.autoSettleTime.trim();
  saving.value = true;
  const wasCreate = creating.value;
  try {
    if (wasCreate) {
      await createMchGroupApi({
        mchGroupName: name,
        state: form.state,
        ...payload,
      });
      message.success('新增成功');
    } else {
      await updateMchGroupApi(editingName.value, payload);
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

defineExpose({ showCreate, showEdit });
</script>

<template>
  <Drawer
    v-model:open="visible"
    :title="creating ? '新增商户分组' : '修改商户分组'"
    :width="720"
    :destroy-on-close="true"
    :mask-closable="false"
    @close="closeDrawer"
  >
    <div class="ap-drawer-body">
      <Form
        ref="formRef"
        :model="form"
        layout="vertical"
        class="ap-form-label-wide"
      >
        <Divider orientation="left">
          <Tag color="processing">基础信息</Tag>
        </Divider>
        <Form.Item label="商户分组名称" name="mchGroupName" required>
          <Input
            v-model:value="form.mchGroupName"
            :disabled="!creating"
            :maxlength="64"
            placeholder="请输入商户分组名称（不能包含空格）"
          />
          <p class="form-help">
            最长 64 个字符，仅支持中英文、数字、下划线和短横线，不能包含空格。
          </p>
        </Form.Item>
        <Form.Item v-if="creating" label="状态" name="state">
          <Radio.Group v-model:value="form.state">
            <Radio :value="1">启用</Radio>
            <Radio :value="0">停用</Radio>
          </Radio.Group>
        </Form.Item>
        <Divider orientation="left">
          <Tag color="processing">自动结算</Tag>
        </Divider>
        <Form.Item label="自动结算模式" name="isAutoSettle" required>
          <Radio.Group
            v-model:value="form.isAutoSettle"
            class="settle-mode-group"
            @change="onSettleModeChange"
          >
            <Radio
              v-for="item in MCH_GROUP_SETTLE_MODES"
              :key="item.value"
              :value="item.value"
              class="settle-mode-option"
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
          <TimePicker
            v-model:value="form.autoSettleTime"
            format="HH:mm"
            value-format="HH:mm"
            placeholder="请选择结算时间"
            style="width: 100%"
          />
          <p class="form-help">每日按该时间执行自动结算，格式为 HH:mm。</p>
        </Form.Item>
      </Form>
    </div>
    <template #footer>
      <Space>
        <Button @click="closeDrawer">取消</Button>
        <Button type="primary" :loading="saving" @click="save">保存</Button>
      </Space>
    </template>
  </Drawer>
</template>

<style scoped>
.form-help {
  margin: 6px 0 0;
  color: hsl(var(--muted-foreground));
  font-size: 12px;
  line-height: 1.6;
}

.settle-mode-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.settle-mode-option {
  width: 100%;
  height: auto;
  margin-inline-end: 0;
  padding: 12px 14px;
  align-items: flex-start;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
}

.settle-mode-content {
  width: 100%;
  padding-left: 4px;
  white-space: normal;
}

.settle-mode-title {
  font-weight: 600;
}

.settle-mode-description {
  margin: 4px 0 0;
  color: hsl(var(--muted-foreground));
  font-size: 12px;
  line-height: 1.6;
}
</style>

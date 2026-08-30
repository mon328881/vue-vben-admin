<script lang="ts" setup>
import { reactive, ref } from 'vue';

import {
  Button,
  Divider,
  Drawer,
  Form,
  Input,
  Radio,
  Space,
  Tag,
  Textarea,
  message,
} from 'ant-design-vue';

import {
  createPayWayApi,
  fetchPayWayApi,
  updatePayWayApi,
  type PayWay,
} from '#/api';
import AssetsIcon from '#/components/payconfig/AssetsIcon.vue';
import {
  PRODUCT_DETAIL_MAX,
  PRODUCT_ICON_FILES,
  PRODUCT_ID_PATTERN,
  PRODUCT_POLL_MODES,
} from '#/constants/payWays';

const emit = defineEmits<{ success: [toFirstPage: boolean] }>();

const visible = ref(false);
const creating = ref(true);
const detailLoading = ref(false);
const saving = ref(false);
const editingId = ref<number | null>(null);

const empty = {
  productId: undefined as number | string | undefined,
  productName: '',
  detail: '',
  mode: 0,
  icon: '',
};
const form = reactive({ ...empty });

function resetForm() {
  Object.assign(form, empty);
}

function apply(row: Partial<PayWay>) {
  form.productId = row.productId;
  form.productName = row.productName ?? '';
  form.detail = row.detail ?? '';
  form.mode = Number(row.mode ?? 0);
  form.icon = row.icon ?? '';
}

async function show(productId?: number, row?: PayWay) {
  creating.value = !productId;
  editingId.value = productId ?? null;
  resetForm();
  visible.value = true;
  if (creating.value) {
    detailLoading.value = false;
    return;
  }
  detailLoading.value = true;
  try {
    const data = await fetchPayWayApi(productId!);
    if (data && typeof data === 'object') apply(data);
    else if (row) apply(row);
  } catch {
    if (row) apply(row);
  } finally {
    detailLoading.value = false;
  }
}

function selectIcon(filename: string) {
  form.icon = filename;
}

function clearIcon() {
  form.icon = '';
}

function close() {
  visible.value = false;
}

async function save() {
  if (creating.value) {
    const idText = String(form.productId ?? '').trim();
    if (!PRODUCT_ID_PATTERN.test(idText)) {
      message.error('产品编码须为纯数字 1～8 位，首位不为 0');
      return;
    }
  }
  const productName = String(form.productName ?? '').trim();
  if (!productName) {
    message.error('请输入产品名称');
    return;
  }
  const detail = String(form.detail ?? '').trim();
  if (detail.length > PRODUCT_DETAIL_MAX) {
    message.error(`产品详情不能超过 ${PRODUCT_DETAIL_MAX} 个字符`);
    return;
  }
  const mode = Number(form.mode ?? 0);
  if (!PRODUCT_POLL_MODES.some((item) => item.value === mode)) {
    message.error('请选择有效的轮询模式');
    return;
  }
  const icon = String(form.icon ?? '').trim();
  saving.value = true;
  try {
    if (creating.value) {
      const productId = Number(form.productId);
      await createPayWayApi({ productId, productName, detail, mode, icon });
      message.success('新增成功');
      visible.value = false;
      emit('success', true);
      return;
    }
    if (!editingId.value) {
      message.error('缺少产品编码');
      return;
    }
    await updatePayWayApi(editingId.value, {
      productName,
      detail,
      mode,
      icon,
    });
    message.success('修改成功');
    visible.value = false;
    emit('success', false);
  } finally {
    saving.value = false;
  }
}

defineExpose({ show });
</script>

<template>
  <Drawer
    v-model:open="visible"
    :title="creating ? '新增产品' : '修改产品'"
    :width="'50%'"
    :destroy-on-close="true"
    :mask-closable="false"
    @close="close"
  >
    <div class="ap-drawer-body">
      <Form :model="form" layout="vertical">
        <Divider orientation="left">
          <Tag color="processing">基础信息</Tag>
        </Divider>
        <Form.Item label="产品编码" name="productId">
          <Input
            v-model:value="form.productId"
            placeholder="例如 1001"
            :disabled="!creating"
          />
        </Form.Item>
        <Form.Item label="产品名称" name="productName">
          <Input
            v-model:value="form.productName"
            placeholder="请输入产品名称"
          />
        </Form.Item>
        <Form.Item label="轮询模式" name="mode">
          <Radio.Group v-model:value="form.mode" class="product-mode-group">
            <Radio
              v-for="item in PRODUCT_POLL_MODES"
              :key="item.value"
              :value="item.value"
              class="product-mode-option"
            >
              <div class="product-mode-content">
                <div class="product-mode-title">{{ item.label }}</div>
                <p class="product-mode-description">{{ item.description }}</p>
              </div>
            </Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item label="产品详情" name="detail">
          <Textarea
            v-model:value="form.detail"
            :placeholder="`请输入产品详情，最多 ${PRODUCT_DETAIL_MAX} 个字符`"
            :maxlength="PRODUCT_DETAIL_MAX"
            :rows="4"
            show-count
          />
        </Form.Item>
        <Form.Item label="当前图标">
          <div class="selected-icon-wrapper">
            <div class="selected-icon-container">
              <AssetsIcon v-if="form.icon" :filename="form.icon" :size="40" />
              <div v-else class="no-icon">无图标</div>
            </div>
            <Button
              v-if="form.icon"
              type="link"
              class="clear-icon-btn"
              @click="clearIcon"
            >
              清除图标
            </Button>
          </div>
        </Form.Item>
        <Form.Item label="选择图标">
          <div class="icon-grid">
            <div
              v-for="file in PRODUCT_ICON_FILES"
              :key="file"
              class="icon-item"
              :class="{ 'icon-item--selected': file === form.icon }"
              @click="selectIcon(file)"
            >
              <AssetsIcon :filename="file" :size="28" />
            </div>
          </div>
        </Form.Item>
      </Form>
    </div>
    <template #footer>
      <Space>
        <Button
          type="primary"
          :loading="saving"
          :disabled="detailLoading"
          @click="save"
        >
          保存
        </Button>
        <Button @click="close">取消</Button>
      </Space>
    </template>
  </Drawer>
</template>

<style scoped>
.product-mode-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.product-mode-option {
  width: 100%;
  height: auto;
  margin-inline-end: 0;
  padding: 12px 14px;
  align-items: flex-start;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
}

.product-mode-content {
  width: 100%;
  padding-left: 4px;
  white-space: normal;
}

.product-mode-title {
  font-weight: 600;
}

.product-mode-description {
  margin: 5px 0 0;
  color: hsl(var(--muted-foreground));
  font-size: 13px;
  line-height: 1.6;
}

.selected-icon-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.selected-icon-container {
  width: 60px;
  height: 60px;
  border: 1px dashed hsl(var(--border));
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: hsl(var(--muted) / 40%);
}

.no-icon {
  color: hsl(var(--muted-foreground));
  font-size: 12px;
}

.clear-icon-btn {
  padding: 0;
  height: auto;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  padding: 8px;
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid hsl(var(--border));
  border-radius: 4px;
}

.icon-item {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50px;
  border: 1px solid hsl(var(--border));
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 6px;
}

.icon-item:hover,
.icon-item--selected {
  border-color: hsl(var(--primary));
  background-color: hsl(var(--primary) / 8%);
}
</style>

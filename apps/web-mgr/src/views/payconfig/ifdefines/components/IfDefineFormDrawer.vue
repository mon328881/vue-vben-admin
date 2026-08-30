<script lang="ts" setup>
import { reactive, ref } from 'vue';

import {
  Button,
  Col,
  Divider,
  Drawer,
  Form,
  Input,
  Row,
  Space,
  Tag,
  Textarea,
  message,
} from 'ant-design-vue';

import {
  createPayIfDefineApi,
  fetchPayIfDefineApi,
  updatePayIfDefineApi,
} from '#/api';

const emit = defineEmits<{ success: [toFirstPage: boolean] }>();

const visible = ref(false);
const creating = ref(true);
const detailLoading = ref(false);
const saving = ref(false);
const editingCode = ref('');

const DEFAULT_FORM = {
  ifCode: '',
  ifName: '',
  ifParams: '',
  state: 1,
  remark: '',
  bgColor: '',
};
const form = reactive({ ...DEFAULT_FORM });

function resetForm() {
  Object.assign(form, { ...DEFAULT_FORM });
}

function randomColor() {
  const chars = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i += 1) {
    color += chars[Math.floor(Math.random() * 16)];
  }
  return color;
}

async function showCreate() {
  creating.value = true;
  editingCode.value = '';
  resetForm();
  visible.value = true;
}

async function showEdit(ifCode: string) {
  creating.value = false;
  editingCode.value = ifCode ? String(ifCode) : '';
  resetForm();
  visible.value = true;
  if (!creating.value && editingCode.value) {
    detailLoading.value = true;
    try {
      const data = await fetchPayIfDefineApi(editingCode.value);
      if (data && typeof data === 'object') {
        Object.assign(form, data);
      }
    } finally {
      detailLoading.value = false;
    }
  } else {
    form.state = 1;
  }
}

async function save() {
  const ifCode = String(form.ifCode ?? '').trim();
  const ifName = String(form.ifName ?? '').trim();
  if (!ifCode) {
    message.error('请输入接口代码');
    return;
  }
  if (!ifName) {
    message.error('请输入接口名称');
    return;
  }
  saving.value = true;
  try {
    if (creating.value) {
      if (!form.bgColor) {
        form.bgColor = randomColor();
      }
      await createPayIfDefineApi({ ...form, ifCode, ifName });
      message.success('新增成功');
    } else {
      if (!editingCode.value) {
        message.error('缺少接口代码');
        return;
      }
      await updatePayIfDefineApi(editingCode.value, {
        ...form,
        ifCode: editingCode.value,
        ifName,
      });
      message.success('修改成功');
    }
    visible.value = false;
    emit('success', creating.value);
  } finally {
    saving.value = false;
  }
}

defineExpose({ showCreate, showEdit });
</script>

<template>
  <Drawer
    v-model:open="visible"
    :title="creating ? '新增支付接口' : '修改支付接口'"
    :width="600"
    :destroy-on-close="true"
    :mask-closable="false"
  >
    <div class="ap-drawer-body">
        <Form :model="form" layout="vertical">
          <p class="drawer-hint">
            接口代码创建后不可修改；配置描述用于生成通道侧参数表单。
          </p>
        <Row :gutter="[16, 16]">
          <Col :span="12">
            <Form.Item label="接口代码" name="ifCode">
              <Input
                v-model:value="form.ifCode"
                placeholder="如 wxpay、alipay"
                :disabled="!creating"
              />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="接口名称" name="ifName">
              <Input v-model:value="form.ifName" placeholder="展示名称" />
            </Form.Item>
          </Col>
        </Row>
        <Divider orientation="left">
          <Tag color="processing">配置定义</Tag>
        </Divider>
        <Form.Item label="接口配置定义描述（ifParams）" name="ifParams">
          <Textarea
            v-model:value="form.ifParams"
            placeholder="通常为 JSON，描述表单项；可为空"
            :rows="5"
          />
        </Form.Item>
        <Divider orientation="left">
          <Tag color="processing">状态与备注</Tag>
        </Divider>
        <Form.Item label="备注" name="remark">
          <Input v-model:value="form.remark" placeholder="选填" />
        </Form.Item>
      </Form>
    </div>
    <template #footer>
      <Space>
        <Button @click="visible = false">取消</Button>
        <Button
          type="primary"
          :loading="saving"
          :disabled="detailLoading"
          @click="save"
        >
          保存
        </Button>
      </Space>
    </template>
  </Drawer>
</template>

<style scoped>
.drawer-hint {
  margin: 0 0 12px;
  color: hsl(var(--muted-foreground));
  font-size: 13px;
}
</style>

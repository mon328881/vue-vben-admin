<script lang="ts" setup>
import type { IfParamField } from '#/api';

import { computed, reactive, ref } from 'vue';

import {
  Button,
  Col,
  Drawer,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
  Space,
  Tag,
  Upload,
  message,
} from 'ant-design-vue';

import {
  fetchPayIfDefineApi,
  savePayIfDefineApi,
} from '#/api';

const emit = defineEmits<{ success: [] }>();

const visible = ref(false);
const creating = ref(true);
const readonly = ref(false);
const saving = ref(false);
const detailLoading = ref(false);

const form = reactive({
  ifCode: '',
  ifName: '',
  bgColor: '#1677FF',
  remark: '',
  state: 1 as 0 | 1,
  version: '',
});

const fields = ref<IfParamField[]>([]);

const previewValues = reactive<Record<string, string>>({});


const FIELD_TYPE_OPTIONS = [
  { label: '单行文本', value: 'text' },
  { label: '多行文本', value: 'textarea' },
  { label: '密码', value: 'password' },
  { label: '数字', value: 'number' },
  { label: '单选', value: 'radio' },
  { label: '下拉', value: 'select' },
  { label: '文件/证书', value: 'file' },
];

function needsOptions(type: IfParamField['type']) {
  return type === 'radio' || type === 'select';
}

const schemaJson = computed(() => JSON.stringify(fields.value, null, 2));

function emptyField(): IfParamField {
  return {
    name: '',
    desc: '',
    type: 'text',
    verify: 'required',
    star: '0',
    values: '',
    titles: '',
  };
}

function reset() {
  Object.assign(form, {
    ifCode: '',
    ifName: '',
    bgColor: '#1677FF',
    remark: '',
    state: 1,
    version: '',
  });
  fields.value = [emptyField()];
  Object.keys(previewValues).forEach((key) => delete previewValues[key]);
}

function showCreate() {
  creating.value = true;
  readonly.value = false;
  reset();
  visible.value = true;
}

async function showEdit(ifCode: string, opts?: { readonly?: boolean }) {
  creating.value = false;
  readonly.value = !!opts?.readonly;
  reset();
  visible.value = true;
  detailLoading.value = true;
  try {
    const data = await fetchPayIfDefineApi(ifCode);
    Object.assign(form, {
      ifCode: data.ifCode,
      ifName: data.ifName,
      bgColor: data.bgColor,
      remark: data.remark ?? '',
      state: data.state,
      version: data.version,
    });
    fields.value = data.ifParams.length
      ? structuredClone(data.ifParams)
      : [emptyField()];
  } finally {
    detailLoading.value = false;
  }
}

function addField() {
  fields.value.push(emptyField());
}

function removeField(index: number) {
  fields.value.splice(index, 1);
  if (!fields.value.length) fields.value.push(emptyField());
}

async function submit() {
  if (!form.ifCode.trim() || !form.ifName.trim()) {
    message.error('请填写接口代码与名称');
    return;
  }
  for (const [index, field] of fields.value.entries()) {
    if (!field.name.trim() || !field.desc.trim()) {
      message.error(`第 ${index + 1} 个字段缺少 name/desc`);
      return;
    }
    if (needsOptions(field.type) && (!field.values || !field.titles)) {
      message.error(`字段 ${field.name} 为 ${field.type} 时需填写 values/titles`);
      return;
    }
  }
  saving.value = true;
  try {
    await savePayIfDefineApi({
      creating: creating.value,
      ifCode: form.ifCode.trim(),
      ifName: form.ifName.trim(),
      ifParams: fields.value.map((item) => ({
        name: item.name.trim(),
        desc: item.desc.trim(),
        type: item.type,
        verify: item.verify || '',
        star: item.star || '0',
        ...(needsOptions(item.type)
          ? { values: item.values, titles: item.titles }
          : {}),
      })),
      bgColor: form.bgColor,
      remark: form.remark,
      state: form.state,
    });
    message.success(creating.value ? '创建成功' : '已保存并升级 Schema 版本');
    visible.value = false;
    emit('success');
  } catch (error) {
    message.error(error instanceof Error ? error.message : '保存失败');
  } finally {
    saving.value = false;
  }
}

function radioOptions(field: IfParamField) {
  const values = String(field.values ?? '').split(',');
  const titles = String(field.titles ?? '').split(',');
  return values
    .map((value, index) => ({
      value: value.trim(),
      label: (titles[index] ?? value).trim(),
    }))
    .filter((item) => item.value);
}

defineExpose({ showCreate, showEdit });
</script>

<template>
  <Drawer
    v-model:open="visible"
    :title="
      readonly
        ? `查看 Schema · ${form.ifCode}`
        : creating
          ? '新建支付接口'
          : `编辑 Schema · ${form.ifCode}`
    "
    :width="720"
    destroy-on-close
  >
    <div class="ap-drawer-body">
      <section class="ap-drawer-section">
        <div class="ap-drawer-section-head">
          <div>
            <h3 class="ap-drawer-section-title">基本信息</h3>
            <p class="ap-drawer-section-desc">
              接口代码创建后不可改；保存后 Schema 版本自动升级。
            </p>
          </div>
          <Tag color="blue">{{ form.version || '新建 1.0.0' }}</Tag>
        </div>
        <Form layout="vertical" class="ap-form-stacked" :disabled="detailLoading || readonly">
          <Row :gutter="[16, 0]">
            <Col :span="12">
              <Form.Item label="接口代码" required>
                <Input
                  v-model:value="form.ifCode"
                  :disabled="!creating"
                  placeholder="如 alipay"
                />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item label="接口名称" required>
                <Input v-model:value="form.ifName" placeholder="展示名称" />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item label="标识色">
                <Input v-model:value="form.bgColor" placeholder="#1677FF" />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item label="状态">
                <Radio.Group v-model:value="form.state">
                  <Radio :value="1">启用</Radio>
                  <Radio :value="0">停用</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col :span="24">
              <Form.Item label="备注">
                <Input.TextArea
                  v-model:value="form.remark"
                  :rows="2"
                  placeholder="可选"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </section>

      <section class="ap-drawer-section">
        <div class="ap-drawer-section-head">
          <div>
            <h3 class="ap-drawer-section-title">Schema 字段</h3>
            <p class="ap-drawer-section-desc">
              驱动运营端通道配置表单。覆盖对接常用控件：文本、密钥、数字、单选/下拉、证书文件。
            </p>
          </div>
          <Button v-if="!readonly" type="primary" ghost @click="addField">
            添加字段
          </Button>
        </div>

        <div class="schema-field-list">
          <div
            v-for="(field, index) in fields"
            :key="index"
            class="schema-field-card"
          >
            <div class="schema-field-card__head">
              <span class="schema-field-card__index">字段 {{ index + 1 }}</span>
              <Button
                v-if="!readonly"
                type="link"
                danger
                size="small"
                @click="removeField(index)"
              >
                删除
              </Button>
            </div>
            <Form layout="vertical" class="ap-form-stacked" :disabled="readonly">
              <Row :gutter="[16, 0]">
                <Col :span="12">
                  <Form.Item label="字段键" required>
                    <Input v-model:value="field.name" placeholder="如 mchId" />
                  </Form.Item>
                </Col>
                <Col :span="12">
                  <Form.Item label="显示名" required>
                    <Input v-model:value="field.desc" placeholder="如 商户号" />
                  </Form.Item>
                </Col>
                <Col :span="8">
                  <Form.Item label="控件类型">
                    <Select
                      v-model:value="field.type"
                      :options="FIELD_TYPE_OPTIONS"
                    />
                  </Form.Item>
                </Col>
                <Col :span="8">
                  <Form.Item label="校验">
                    <Select
                      v-model:value="field.verify"
                      :options="[
                        { label: '必填', value: 'required' },
                        { label: '选填', value: '' },
                      ]"
                    />
                  </Form.Item>
                </Col>
                <Col :span="8">
                  <Form.Item label="敏感字段">
                    <Select
                      v-model:value="field.star"
                      :options="[
                        { label: '否', value: '0' },
                        { label: '是', value: '1' },
                      ]"
                    />
                  </Form.Item>
                </Col>
                <template v-if="needsOptions(field.type)">
                  <Col :span="12">
                    <Form.Item label="选项值（逗号分隔）">
                      <Input
                        v-model:value="field.values"
                        placeholder="sandbox,live"
                      />
                    </Form.Item>
                  </Col>
                  <Col :span="12">
                    <Form.Item label="选项标题（逗号分隔）">
                      <Input
                        v-model:value="field.titles"
                        placeholder="沙箱,生产"
                      />
                    </Form.Item>
                  </Col>
                </template>
              </Row>
            </Form>
          </div>
        </div>
      </section>

      <section class="ap-drawer-section">
        <div class="ap-drawer-section-head">
          <div>
            <h3 class="ap-drawer-section-title">运营端表单预览</h3>
            <p class="ap-drawer-section-desc">仅预览布局，不写入运营端。</p>
          </div>
        </div>
        <Form layout="vertical" class="ap-form-stacked schema-preview">
          <Form.Item
            v-for="field in fields"
            :key="field.name || field.desc"
            :label="field.desc || field.name || '未命名'"
            :required="field.verify === 'required'"
          >
            <Input
              v-if="field.type === 'text'"
              v-model:value="previewValues[field.name]"
              :placeholder="field.desc"
            />
            <Input.Password
              v-else-if="field.type === 'password'"
              v-model:value="previewValues[field.name]"
              :placeholder="field.desc"
            />
            <InputNumber
              v-else-if="field.type === 'number'"
              :value="
                previewValues[field.name]
                  ? Number(previewValues[field.name])
                  : undefined
              "
              class="w-full"
              :placeholder="field.desc"
              @update:value="
                (val) => (previewValues[field.name] = val == null ? '' : String(val))
              "
            />
            <Input.TextArea
              v-else-if="field.type === 'textarea'"
              v-model:value="previewValues[field.name]"
              :rows="3"
              :placeholder="field.desc"
            />
            <Radio.Group
              v-else-if="field.type === 'radio'"
              v-model:value="previewValues[field.name]"
            >
              <Radio
                v-for="opt in radioOptions(field)"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </Radio>
            </Radio.Group>
            <Select
              v-else-if="field.type === 'select'"
              v-model:value="previewValues[field.name]"
              allow-clear
              :options="radioOptions(field)"
              :placeholder="field.desc"
            />
            <Upload
              v-else-if="field.type === 'file'"
              :before-upload="
                (file) => {
                  previewValues[field.name] = file.name;
                  return false;
                }
              "
              :max-count="1"
              :show-upload-list="true"
            >
              <Button>选择文件</Button>
            </Upload>
          </Form.Item>
        </Form>
      </section>

      <section class="ap-drawer-section">
        <div class="ap-drawer-section-head">
          <div>
            <h3 class="ap-drawer-section-title">ifParams JSON</h3>
            <p class="ap-drawer-section-desc">只读，随上方字段同步。</p>
          </div>
        </div>
        <Input.TextArea
          class="schema-json"
          :value="schemaJson"
          :rows="6"
          readonly
        />
      </section>
    </div>

    <template #footer>
      <Space>
        <Button @click="visible = false">取消</Button>
        <Button v-if="!readonly" type="primary" :loading="saving" @click="submit">
          保存 Schema
        </Button>
      </Space>
    </template>
  </Drawer>
</template>

<style scoped>
.schema-field-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.schema-field-card {
  padding: 12px 16px 4px;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
}

.schema-field-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.schema-field-card__index {
  font-size: 13px;
  font-weight: 600;
  line-height: 22px;
}

.schema-preview {
  padding: 16px 16px 4px;
  background: hsl(var(--muted) / 35%);
  border-radius: 8px;
}

.schema-json {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  line-height: 1.6;
}
</style>

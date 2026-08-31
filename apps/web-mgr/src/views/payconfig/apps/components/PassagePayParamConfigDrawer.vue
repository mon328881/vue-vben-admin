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
  Spin,
  message,
} from 'ant-design-vue';

import {
  fetchPayIfDefineApi,
  updateMchAppApi,
  type PayPassage,
} from '#/api';
import { isValidWhiteList } from '#/constants/merchant';
import { hasEnt } from '#/utils/access';

type ParamDef = {
  name: string;
  desc: string;
  type: 'text' | 'textarea' | 'radio';
  verify?: string;
  star?: string;
  values: { value: string | number; title: string }[];
};

const emit = defineEmits<{ success: [] }>();

const canConfig = () => hasEnt('ENT_MCH_PAY_PASSAGE_CONFIG');

const visible = ref(false);
const loading = ref(false);
const saving = ref(false);
const formRef = ref();
const passage = ref<PayPassage | null>(null);
const defs = ref<ParamDef[]>([]);
const values = reactive<Record<string, unknown>>({});
/** 打开时是否已有支付参数（敏感项 star=1 时可留空保留原值） */
const hasExistingConfig = ref(false);

/** 必填星号：以 verify=required 为准（star=1 表示敏感展示，不是免填） */
function isRequired(item: ParamDef) {
  return item.verify === 'required';
}

/**
 * 校验规则：普通必填始终校验；
 * 敏感项（star=1）在已有配置时可留空（不覆盖原值语义），新建时仍必填。
 */
function fieldRules(item: ParamDef) {
  if (!isRequired(item)) return undefined;
  if (item.star === '1' && hasExistingConfig.value) return undefined;
  return [
    {
      required: true,
      message: `请输入${item.desc}`,
      trigger: item.type === 'radio' ? 'change' : 'blur',
    },
  ];
}

function initValueKeys(defList: ParamDef[]) {
  for (const item of defList) {
    if (!Object.prototype.hasOwnProperty.call(values, item.name)) {
      values[item.name] = item.type === 'radio' ? undefined : '';
    }
  }
}

function parseDefs(raw: string): ParamDef[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const list: ParamDef[] = [];
    for (const item of parsed) {
      const type = item.type;
      if (type !== 'text' && type !== 'textarea' && type !== 'radio') continue;
      const options: { value: string | number; title: string }[] = [];
      if (type === 'radio' && item.values && item.titles) {
        const vals = String(item.values).split(',');
        const titles = String(item.titles).split(',');
        vals.forEach((value, index) => {
          let next: string | number = value.trim();
          if (next !== '' && !Number.isNaN(Number(next))) next = Number(next);
          if (next !== '') {
            options.push({ value: next, title: titles[index] ?? String(next) });
          }
        });
      }
      list.push({
        name: item.name,
        desc: item.desc,
        type,
        verify: item.verify,
        star: item.star,
        values: options,
      });
    }
    return list;
  } catch {
    return [];
  }
}

function convertWhiteList() {
  const current = values.whiteList;
  if (current == null || String(current).trim() === '') {
    message.warning('请先输入 IP 白名单');
    return;
  }
  const text = String(current).trim();
  if (!/[,，\n\r]/.test(text)) {
    message.info('当前已是竖线分隔格式');
    return;
  }
  values.whiteList = text
    .replace(/[\n\r]+/g, '|')
    .replace(/[,，]/g, '|')
    .replace(/\|+/g, '|')
    .replace(/^\||\|$/g, '');
  message.success('转换成功');
}

async function show(row: PayPassage) {
  if (!row.ifCode) {
    message.warning('当前通道未配置支付接口代码，无法编辑支付参数');
    return;
  }
  if (!canConfig()) {
    message.warning('无权限配置支付参数');
    return;
  }
  passage.value = { ...row };
  Object.keys(values).forEach((key) => delete values[key]);
  defs.value = [];
  hasExistingConfig.value = false;
  visible.value = true;
  loading.value = true;
  try {
    const define = await fetchPayIfDefineApi(row.ifCode);
    defs.value = parseDefs(
      typeof define?.ifParams === 'string' ? define.ifParams : '',
    );
    if (
      row.payInterfaceConfig !== undefined &&
      row.payInterfaceConfig !== null &&
      row.payInterfaceConfig !== ''
    ) {
      try {
        const parsed = JSON.parse(String(row.payInterfaceConfig));
        if (parsed && typeof parsed === 'object') {
          Object.assign(values, parsed);
          hasExistingConfig.value = Object.keys(parsed).length > 0;
        }
      } catch {
        message.error('当前支付参数 JSON 解析失败，已以空表单打开');
      }
    }
    initValueKeys(defs.value);
  } catch {
    message.error('加载支付接口定义失败');
    visible.value = false;
  } finally {
    loading.value = false;
  }
}

async function save() {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  const filled = Object.entries(values).some(
    ([, v]) => v != null && String(v).trim() !== '',
  );
  if (!filled) {
    message.error('参数不能为空！');
    return;
  }
  saving.value = true;
  try {
    if (values.secret != null && String(values.secret).length) {
      values.secret = String(values.secret).replace(/\s+/g, '');
    }
    if (Object.prototype.hasOwnProperty.call(values, 'whiteList')) {
      values.whiteList = String(values.whiteList ?? '').replace(/\s+/g, '');
      if (
        String(values.whiteList).trim() !== '' &&
        !isValidWhiteList(String(values.whiteList))
      ) {
        message.error(
          '[回调白名单]格式错误（多个地址以 | 分隔，* 表示允许全部 IP）',
        );
        return;
      }
    }
    if (!passage.value) return;
    const passageId = passage.value.payPassageId;
    if (passageId == null) {
      message.error('通道 ID 无效');
      return;
    }
    await updateMchAppApi(String(passageId), {
      ...passage.value,
      payInterfaceConfig: JSON.stringify(values),
    });
    message.success('保存成功');
    visible.value = false;
    emit('success');
  } finally {
    saving.value = false;
  }
}

defineExpose({ show });
</script>

<template>
  <Drawer
    v-model:open="visible"
    title="通道支付参数配置"
    :width="520"
    :mask-closable="false"
    destroy-on-close
  >
    <Spin :spinning="loading">
      <Divider orientation="left">
        {{ passage?.ifCode || '-' }} 商户参数配置
      </Divider>
      <Form
        v-if="!loading && defs.length"
        ref="formRef"
        :model="values"
        layout="vertical"
        :required-mark="true"
      >
        <Form.Item
          v-for="item in defs"
          :key="item.name"
          :label="item.desc"
          :name="item.name"
          :required="isRequired(item)"
          :rules="fieldRules(item)"
        >
          <Input
            v-if="item.type === 'text'"
            v-model:value="values[item.name] as string"
            allow-clear
            placeholder="请输入"
          />
          <Input.TextArea
            v-else-if="item.type === 'textarea'"
            v-model:value="values[item.name] as string"
            :auto-size="{ minRows: 3, maxRows: 12 }"
            placeholder="请输入"
          />
          <Radio.Group
            v-else-if="item.type === 'radio'"
            v-model:value="values[item.name]"
          >
            <Radio
              v-for="(option, index) in item.values"
              :key="index"
              :value="option.value"
            >
              {{ option.title }}
            </Radio>
          </Radio.Group>
          <template v-if="item.name === 'whiteList'">
            <Button type="link" @click="convertWhiteList">
              一键将逗号「,」转为竖线「|」
            </Button>
          </template>
        </Form.Item>
      </Form>
      <div v-else-if="!loading" class="text-muted-foreground">
        当前接口未配置参数定义
      </div>
    </Spin>
    <template #footer>
      <Space>
        <Button type="primary" :loading="saving" @click="save">保存</Button>
        <Button @click="visible = false">取消</Button>
      </Space>
    </template>
  </Drawer>
</template>

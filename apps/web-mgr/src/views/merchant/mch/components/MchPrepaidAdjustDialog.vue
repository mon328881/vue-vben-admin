<script lang="ts" setup>
import type { UploadChangeParam, UploadFile } from 'ant-design-vue';

import { reactive, ref } from 'vue';

import {
  Form,
  InputNumber,
  Modal,
  Textarea,
  Upload,
  message,
} from 'ant-design-vue';

import { changeMchPrepaidApi, uploadPicApi } from '#/api';
import type { MchInfo } from '#/api/types/business';

const emit = defineEmits<{ success: [] }>();

const visible = ref(false);
const saving = ref(false);
const row = ref<MchInfo | null>(null);
const fileList = ref<UploadFile[]>([]);
const form = reactive({
  changePrepaidAmount: undefined as number | undefined,
  changePrepaidRemark: '',
  pic: '',
});

function show(target: MchInfo) {
  row.value = target;
  form.changePrepaidAmount = undefined;
  form.changePrepaidRemark = '';
  form.pic = '';
  fileList.value = [];
  visible.value = true;
}

async function customRequest(options: {
  file: string | Blob | File;
  onSuccess?: (body: unknown) => void;
  onError?: (error: Error) => void;
}) {
  const raw = options.file;
  if (!(raw instanceof File)) {
    options.onError?.(new Error('请选择图片'));
    return;
  }
  try {
    const pic = await uploadPicApi(raw);
    form.pic = pic ?? '';
    options.onSuccess?.(pic);
  } catch (error) {
    options.onError?.(
      error instanceof Error ? error : new Error('上传失败'),
    );
  }
}

function onRemove() {
  form.pic = '';
  fileList.value = [];
}

function onChange(info: UploadChangeParam) {
  fileList.value = info.fileList.slice(-1);
}

async function submit() {
  if (!row.value) return;
  if (
    form.changePrepaidAmount === null ||
    form.changePrepaidAmount === undefined
  ) {
    message.error('请输入调整预付金额');
    return;
  }
  if (!form.changePrepaidRemark.trim()) {
    message.error('请输入调整备注');
    return;
  }
  saving.value = true;
  try {
    await changeMchPrepaidApi(row.value.mchNo, {
      changePrepaidAmount: form.changePrepaidAmount,
      changePrepaidRemark: form.changePrepaidRemark,
      pic: form.pic || undefined,
    });
    message.success('预付调整成功');
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
    :title="row ? `调整商户[预付] - ${row.mchName}` : '调整商户[预付]'"
    :confirm-loading="saving"
    ok-text="确定"
    cancel-text="取消"
    width="500px"
    destroy-on-close
    @ok="submit"
  >
    <Form layout="vertical">
      <Form.Item label="商户号">{{ row?.mchNo }}</Form.Item>
      <Form.Item label="商户名称">{{ row?.mchName }}</Form.Item>
      <Form.Item label="调整预付金额" required>
        <InputNumber
          v-model:value="form.changePrepaidAmount"
          :precision="2"
          :step="0.01"
          :min="-999999999"
          :max="999999999"
          style="width: 300px"
          placeholder="如需扣预付，则输入负数"
        />
      </Form.Item>
      <Form.Item label="备注" required>
        <Textarea
          v-model:value="form.changePrepaidRemark"
          :rows="3"
          placeholder="请输入本次调整的原因说明"
        />
      </Form.Item>
      <Form.Item label="凭证图片">
        <Upload
          v-model:file-list="fileList"
          accept="image/png,image/jpeg,image/gif,image/webp"
          list-type="picture-card"
          :max-count="1"
          :custom-request="customRequest"
          @change="onChange"
          @remove="onRemove"
        >
          <div v-if="fileList.length < 1">上传</div>
        </Upload>
        <div class="text-muted-foreground mt-1 text-xs">
          选填，支持 jpg/png/gif/webp，最大 5MB
        </div>
      </Form.Item>
    </Form>
  </Modal>
</template>

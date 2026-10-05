<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Button, Card, Form, Input, Radio, message } from 'ant-design-vue';

import { fetchPlatConfigApi, savePlatConfigApi } from '#/api';
import { isAdmin } from '#/utils/access';

defineOptions({ name: 'PlatConfigPage' });

const loading = ref(false);
const saving = ref(false);
const form = reactive({
  platformName: '亚洲支付 · 超管端',
  allowInactiveTenant: false,
});

async function load() {
  loading.value = true;
  try {
    const data = await fetchPlatConfigApi();
    Object.assign(form, data);
  } catch (error) {
    message.error(error instanceof Error ? error.message : '加载失败');
  } finally {
    loading.value = false;
  }
}

async function save() {
  if (!isAdmin()) {
    message.error('无权限');
    return;
  }
  saving.value = true;
  try {
    const data = await savePlatConfigApi({
      platformName: form.platformName,
      allowInactiveTenant: form.allowInactiveTenant,
    });
    Object.assign(form, data);
    message.success('已保存');
  } catch (error) {
    message.error(error instanceof Error ? error.message : '保存失败');
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<template>
  <Page auto-content-height title="平台配置">
    <div class="ap-page-stack">
      <Card :bordered="false" class="ap-page-form">
        <div class="ap-section-head">
          <div>
            <h3 class="ap-section-title">展示</h3>
            <p class="ap-section-desc">登录页标题，保存后重新进入登录页生效。</p>
          </div>
        </div>
        <Form layout="vertical" class="config-form" :disabled="loading">
          <Form.Item label="平台名称" required>
            <Input
              v-model:value="form.platformName"
              placeholder="如 亚洲支付 · 超管端"
            />
          </Form.Item>
        </Form>
      </Card>

      <Card :bordered="false" class="ap-page-form">
        <div class="ap-section-head">
          <div>
            <h3 class="ap-section-title">接口下发</h3>
            <p class="ap-section-desc">
              向运营端推送 Schema 时，停用租户默认跳过。
            </p>
          </div>
        </div>
        <Form layout="vertical" class="config-form" :disabled="loading">
          <Form.Item label="停用运营端">
            <Radio.Group v-model:value="form.allowInactiveTenant">
              <Radio :value="false">跳过，不下发</Radio>
              <Radio :value="true">仍下发</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item>
            <div class="ap-page-form-actions">
              <Button type="primary" :loading="saving" @click="save">
                保存
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  </Page>
</template>

<style scoped>
.config-form {
  max-width: 480px;
}
</style>

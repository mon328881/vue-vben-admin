<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Checkbox,
  Form,
  Select,
  Space,
  Tag,
  message,
} from 'ant-design-vue';

import {
  distributePayIfApi,
  fetchPayIfDefinesApi,
  fetchTenantsApi,
  type PlatPayIfDefine,
  type PlatTenant,
} from '#/api';

defineOptions({ name: 'PayIfDistributePage' });

const route = useRoute();
const loading = ref(false);
const submitting = ref(false);
const defines = ref<PlatPayIfDefine[]>([]);
const tenants = ref<PlatTenant[]>([]);
const form = reactive({
  ifCode: '',
  tenantIds: [] as string[],
});

const selectedCount = computed(() => form.tenantIds.length);

const selectedDefine = computed(() =>
  defines.value.find((item) => item.ifCode === form.ifCode),
);

const activeTenants = computed(() =>
  tenants.value.filter((item) => item.state === 1),
);

async function loadOptions() {
  loading.value = true;
  try {
    const [ifPage, tenantPage] = await Promise.all([
      fetchPayIfDefinesApi(),
      fetchTenantsApi(),
    ]);
    defines.value = ifPage.records.filter((item) => item.state === 1);
    tenants.value = tenantPage.records;
    const fromQuery = String(route.query.ifCode ?? '');
    if (fromQuery && defines.value.some((item) => item.ifCode === fromQuery)) {
      form.ifCode = fromQuery;
    } else if (!form.ifCode && defines.value[0]) {
      form.ifCode = defines.value[0].ifCode;
    }
  } finally {
    loading.value = false;
  }
}

function selectAllActive() {
  form.tenantIds = activeTenants.value.map((item) => item.tenantId);
}

async function submit() {
  if (!form.ifCode) {
    message.error('请选择支付接口');
    return;
  }
  if (!form.tenantIds.length) {
    message.error('请选择至少一个运营租户');
    return;
  }
  submitting.value = true;
  try {
    const record = await distributePayIfApi({
      ifCode: form.ifCode,
      tenantIds: form.tenantIds,
    });
    if (record.status === 'success') message.success(record.message || '下发成功');
    else if (record.status === 'partial') message.warning(record.message);
    else message.error(record.message || '下发失败');
  } catch (error) {
    message.error(error instanceof Error ? error.message : '下发失败');
  } finally {
    submitting.value = false;
  }
}

watch(
  () => route.query.ifCode,
  (code) => {
    if (code) form.ifCode = String(code);
  },
);

onMounted(loadOptions);
</script>

<template>
  <Page auto-content-height title="接口下发">
    <div class="ap-page-stack">
      <Card :bordered="false" class="ap-page-form" :loading="loading">
        <div class="ap-section-head">
          <div>
            <h3 class="ap-section-title">选择接口</h3>
            <p class="ap-section-desc">
              将选中接口的 Schema 下发到运营租户，通道配置表单随版本更新。
            </p>
          </div>
        </div>
        <Form layout="vertical" class="distribute-select">
          <Form.Item label="支付接口" required>
            <Select
              v-model:value="form.ifCode"
              placeholder="选择接口"
              :options="
                defines.map((item) => ({
                  label: `${item.ifName}（${item.ifCode}） v${item.version}`,
                  value: item.ifCode,
                }))
              "
            />
          </Form.Item>
        </Form>
        <div v-if="selectedDefine" class="schema-summary">
          <div class="schema-summary__meta">
            <span
              class="schema-summary__dot"
              :style="{ background: selectedDefine.bgColor }"
            ></span>
            <strong>{{ selectedDefine.ifName }}</strong>
            <Tag>{{ selectedDefine.version }}</Tag>
            <Tag color="blue">{{ selectedDefine.ifParams.length }} 个字段</Tag>
          </div>
          <p class="schema-summary__remark">
            {{ selectedDefine.remark || '无备注' }}
          </p>
          <div class="schema-summary__fields">
            <Tag v-for="field in selectedDefine.ifParams" :key="field.name">
              {{ field.desc || field.name }}
            </Tag>
          </div>
        </div>
      </Card>

      <Card :bordered="false" class="ap-page-form">
        <div class="ap-section-head">
          <div>
            <h3 class="ap-section-title">目标运营租户</h3>
            <p class="ap-section-desc">
              已选 {{ selectedCount }} / 启用中 {{ activeTenants.length }}
            </p>
          </div>
          <Space>
            <Button @click="selectAllActive">全选启用</Button>
            <Button @click="form.tenantIds = []">清空</Button>
          </Space>
        </div>
        <Checkbox.Group v-model:value="form.tenantIds" class="tenant-pick">
          <Checkbox
            v-for="tenant in tenants"
            :key="tenant.tenantId"
            :value="tenant.tenantId"
            :disabled="tenant.state !== 1"
            class="tenant-pick__item"
            :class="{
              'tenant-pick__item--checked': form.tenantIds.includes(
                tenant.tenantId,
              ),
            }"
          >
            <span class="tenant-pick__body">
              <span class="tenant-pick__name">{{ tenant.tenantName }}</span>
              <span class="tenant-pick__code">{{ tenant.tenantCode }}</span>
            </span>
            <Tag v-if="tenant.state !== 1" color="default">已停用</Tag>
          </Checkbox>
        </Checkbox.Group>
        <div class="distribute-actions">
          <Button type="primary" :loading="submitting" @click="submit">
            确认下发
          </Button>
          <Button @click="loadOptions">刷新</Button>
        </div>
      </Card>
    </div>
  </Page>
</template>

<style scoped>
.distribute-select {
  max-width: 480px;
}

.distribute-select :deep(.ant-form-item) {
  margin-bottom: 0;
}

.schema-summary {
  padding: 16px;
  margin-top: 16px;
  background: hsl(var(--muted) / 30%);
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
}

.schema-summary__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.schema-summary__dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.schema-summary__remark {
  margin: 10px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: hsl(var(--muted-foreground));
}

.schema-summary__fields {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.tenant-pick {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
  width: 100%;
}

.tenant-pick :deep(.ant-checkbox-wrapper.tenant-pick__item) {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  min-height: 64px;
  padding: 12px 14px;
  margin-inline-end: 0;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
}

.tenant-pick :deep(.ant-checkbox-wrapper.tenant-pick__item--checked) {
  background: hsl(var(--primary) / 6%);
  border-color: hsl(var(--primary));
}

.tenant-pick :deep(.ant-checkbox-wrapper-disabled.tenant-pick__item) {
  opacity: 0.65;
}

.tenant-pick :deep(.ant-checkbox) {
  margin-top: 3px;
}

.tenant-pick :deep(.ant-checkbox + span) {
  display: flex;
  flex: 1;
  gap: 8px;
  align-items: flex-start;
  padding-inline-start: 0;
}

.tenant-pick__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.tenant-pick__name {
  font-size: 14px;
  line-height: 22px;
}

.tenant-pick__code {
  font-size: 12px;
  line-height: 18px;
  color: hsl(var(--muted-foreground));
}

.distribute-actions {
  display: flex;
  gap: 12px;
  padding-top: 20px;
  margin-top: 20px;
  border-top: 1px solid hsl(var(--border) / 60%);
}
</style>

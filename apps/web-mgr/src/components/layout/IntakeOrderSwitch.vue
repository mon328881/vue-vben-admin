<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';

import { Form, Input, Modal, Switch, message } from 'ant-design-vue';

import { fetchOpenStateApi, setOpenStateApi } from '#/api';
import { getCachedCurrentUser } from '#/api/core/user';
import { hasEnt } from '#/utils/access';
import { useAccessStore } from '@vben/stores';

const accessStore = useAccessStore();

const canToggle = computed(() => {
  const cached = getCachedCurrentUser();
  if (cached?.isAdmin === 1) return true;
  return hasEnt('ENT_C_MAIN_PAY_COUNT');
});

const openState = ref(true);
const openLoading = ref(false);
const openFetching = ref(false);
const googleVisible = ref(false);
const googleCode = ref('');
const pendingOpenState = ref(true);
const confirmTitle = ref('');

const switchLoading = computed(() => openFetching.value || openLoading.value);
const switchDisabled = computed(
  () => openFetching.value || googleVisible.value,
);

async function loadOpenState() {
  if (!canToggle.value) return;
  openFetching.value = true;
  try {
    const state = await fetchOpenStateApi();
    openState.value = Number(state) === 1;
  } catch {
    openState.value = true;
  } finally {
    openFetching.value = false;
  }
}

function onOpenChange(checked: boolean | string | number) {
  if (switchDisabled.value) return;
  const next = !!checked;
  pendingOpenState.value = next;
  confirmTitle.value = next ? '确认[启用]进单？' : '确认[停用]进单？';
  googleCode.value = '';
  googleVisible.value = true;
}

async function confirmOpenState() {
  openLoading.value = true;
  try {
    await setOpenStateApi({
      setOpenState: pendingOpenState.value ? 1 : 0,
      googleCode: googleCode.value.trim(),
    });
    openState.value = pendingOpenState.value;
    googleVisible.value = false;
    message.success('操作成功');
  } catch (error) {
    message.error(
      error instanceof Error ? error.message : '切换进单状态失败',
    );
  } finally {
    openLoading.value = false;
  }
}

function cancelOpenChange() {
  googleVisible.value = false;
  googleCode.value = '';
}

watch(
  () => [canToggle.value, accessStore.accessCodes?.length],
  () => {
    if (canToggle.value) void loadOpenState();
  },
);

onMounted(() => {
  void loadOpenState();
});
</script>

<template>
  <div v-if="canToggle" class="intake-switch-wrap">
    <Switch
      :checked="openState"
      checked-children="进单开"
      un-checked-children="进单关"
      :loading="switchLoading"
      :disabled="switchDisabled"
      @change="onOpenChange"
    />

    <Teleport to="body">
      <Modal
        v-model:open="googleVisible"
        title="注意"
        :confirm-loading="openLoading"
        ok-text="确定"
        cancel-text="取消"
        :mask-closable="false"
        destroy-on-close
        width="680px"
        @ok="confirmOpenState"
        @cancel="cancelOpenChange"
      >
        <Form layout="vertical">
          <p class="intake-dialog-title">{{ confirmTitle }}</p>
          <p class="intake-dialog-tip">
            此操作影响所有商户下单，不影响通道测试、不影响回调。
          </p>
          <Form.Item label="请输入谷歌验证码：">
            <Input
              v-model:value="googleCode"
              placeholder="未绑定可留空"
              :maxlength="6"
              allow-clear
            />
          </Form.Item>
        </Form>
      </Modal>
    </Teleport>
  </div>
</template>

<style scoped>
.intake-switch-wrap {
  display: inline-flex;
  align-items: center;
  height: 100%;
  margin-right: 12px;
  padding: 0 4px;
}

.intake-switch-wrap :deep(.ant-switch) {
  min-width: 72px;
}

.intake-dialog-title {
  margin: 0 0 8px;
  font-weight: 600;
  color: hsl(var(--foreground));
}

.intake-dialog-tip {
  margin: 0 0 16px;
  font-size: 12px;
  line-height: 1.5;
  color: hsl(var(--muted-foreground));
}
</style>

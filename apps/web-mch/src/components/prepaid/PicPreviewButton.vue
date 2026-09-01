<script lang="ts" setup>
import { computed, ref } from 'vue';

import { Button, Modal, message } from 'ant-design-vue';

import { fetchPicBase64Api } from '#/api';

const props = defineProps<{ pic?: string | null }>();

const visible = ref(false);
const loading = ref(false);
const src = ref('');

const hasPic = computed(() => !!props.pic);

function toDataUrl(value: string): string {
  const text = value.trim();
  return text.startsWith('data:') ? text : `data:image/png;base64,${text}`;
}

async function open() {
  if (!props.pic) return;
  visible.value = true;
  loading.value = true;
  src.value = '';
  try {
    const base64 = await fetchPicBase64Api(String(props.pic));
    if (base64) src.value = toDataUrl(base64);
  } catch (error) {
    console.error(error);
    message.error('凭证加载失败');
    visible.value = false;
  } finally {
    loading.value = false;
  }
}

function close() {
  loading.value = false;
  src.value = '';
}
</script>

<template>
  <Button v-if="hasPic" size="small" type="link" :loading="loading" @click="open">
    查看
  </Button>
  <span v-else class="text-muted-foreground">—</span>
  <Modal
    v-model:open="visible"
    title="凭证预览"
    :footer="null"
    destroy-on-close
    width="640px"
    @cancel="close"
  >
    <div class="pic-preview-body">
      <div v-if="loading" class="pic-preview-muted">加载中…</div>
      <img v-else-if="src" :src="src" alt="凭证" class="pic-preview-img" />
      <div v-else class="pic-preview-muted">暂无凭证</div>
    </div>
  </Modal>
</template>

<style scoped>
.pic-preview-body {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 240px;
}

.pic-preview-muted {
  color: hsl(var(--muted-foreground));
}

.pic-preview-img {
  max-width: 100%;
  max-height: 480px;
  object-fit: contain;
}
</style>

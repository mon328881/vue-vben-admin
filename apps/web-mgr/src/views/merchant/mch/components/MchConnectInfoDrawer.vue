<script lang="ts" setup>
import { ref } from 'vue';

import { Button, Drawer, Space, Textarea, message } from 'ant-design-vue';

import { fetchMchInfoCopyApi, type MchConnectInfo } from '#/api';
import type { MchInfo } from '#/api/types/business';

const visible = ref(false);
const loading = ref(false);
const text = ref('');

function formatCopy(info: MchConnectInfo) {
  return [
    '',
    `商户登录地址：${info.mchUrl ?? ''}`,
    '',
    `登录名：${info.loginName ?? ''}`,
    '',
    '初始密码：123456',
    '',
    `商户号：${info.mchNo ?? ''}`,
    '',
    `商户秘钥：${info.secret ?? ''}`,
    '',
    `下单地址：${info.payApi ?? ''}`,
    '',
    `查单地址：${info.queryApi ?? ''}`,
    '',
    `余额查询：${info.balanceApi ?? ''}`,
    '',
    `文档地址：${info.docUrl ?? ''}`,
    '',
    `回调IP：${info.serverIp ?? ''}`,
    '',
  ].join('\n');
}

async function show(row: MchInfo) {
  text.value = '';
  visible.value = true;
  loading.value = true;
  try {
    const info = await fetchMchInfoCopyApi(row.mchNo);
    text.value = formatCopy(info ?? {});
  } catch {
    text.value = '加载失败，请稍后重试。';
  } finally {
    loading.value = false;
  }
}

async function copyAll() {
  const payload = `商户对接信息\n${text.value}`;
  try {
    await navigator.clipboard.writeText(payload);
    message.success('已复制！');
    visible.value = false;
  } catch {
    message.error('复制失败，请手动复制');
  }
}

defineExpose({ show });
</script>

<template>
  <Drawer
    v-model:open="visible"
    title="商户对接信息"
    :width="520"
    :mask-closable="false"
    destroy-on-close
  >
    <div class="ap-drawer-body">
      <div class="ap-drawer-section">
        <Textarea
          v-model:value="text"
          :rows="18"
          :disabled="loading"
          class="font-mono text-sm"
        />
      </div>
      <div class="ap-drawer-section">
        <Space>
          <Button type="primary" :loading="loading" @click="copyAll">
            复制全部
          </Button>
          <Button @click="visible = false">关闭</Button>
        </Space>
      </div>
    </div>
  </Drawer>
</template>

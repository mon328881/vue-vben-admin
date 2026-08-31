<script lang="ts" setup>
import { computed, ref } from 'vue';

import { Button, Card, Modal, Tag } from 'ant-design-vue';

import type { MchInfoDetail } from '#/api/types/business';
import { amountSignedClass, formatDateTime, formatYuan } from '#/utils/format';

import MchPrepaidHistoryDrawer from './MchPrepaidHistoryDrawer.vue';

defineOptions({ name: 'MchInfoCard' });

const props = defineProps<{
  mch?: MchInfoDetail | null;
  loading?: boolean;
}>();

const secretOpen = ref(false);
const prepaidDrawerRef = ref<InstanceType<typeof MchPrepaidHistoryDrawer>>();

const remainPrepaid = computed(
  () => (props.mch?.prepaid ?? 0) - (props.mch?.balance ?? 0),
);

function openPrepaid() {
  if (!props.mch) return;
  prepaidDrawerRef.value?.show(props.mch);
}
</script>

<template>
  <Card title="商户信息" :loading="loading">
    <div v-if="mch" class="mch-info">
      <div class="mch-info__head">
        <span class="mch-info__name">{{ mch.mchName || '—' }}</span>
        <Tag :color="mch.state === 1 ? 'success' : 'default'">
          {{ mch.state === 1 ? '启用' : '禁用' }}
        </Tag>
      </div>
      <div class="mch-info__sub">
        {{ mch.mchNo || '—' }} · {{ mch.loginUsername || '—' }}
      </div>

      <div class="mch-info__stats">
        <div>
          <span class="label">当前余额</span>
          <b>{{ formatYuan(mch.balance) }}</b>
        </div>
        <div>
          <span class="label">当前预付</span>
          <b>{{ formatYuan(mch.prepaid) }}</b>
        </div>
        <div>
          <span class="label">剩余预付</span>
          <b :class="amountSignedClass(remainPrepaid)">
            {{ formatYuan(remainPrepaid) }}
          </b>
        </div>
      </div>

      <div class="mch-info__actions">
        <Button @click="secretOpen = true">查看密钥</Button>
        <Button type="primary" @click="openPrepaid">预付记录</Button>
      </div>

      <div v-if="mch.createdAt" class="mch-info__foot">
        创建于 {{ formatDateTime(mch.createdAt) }}
      </div>
    </div>

    <Modal
      v-model:open="secretOpen"
      :footer="null"
      title="商户密钥"
    >
      <p class="break-all font-mono text-sm">{{ mch?.secret || '—' }}</p>
    </Modal>

    <MchPrepaidHistoryDrawer ref="prepaidDrawerRef" />
  </Card>
</template>

<style scoped>
.mch-info__head {
  align-items: center;
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}

.mch-info__name {
  font-size: 16px;
  font-weight: 600;
}

.mch-info__sub {
  color: hsl(var(--muted-foreground));
  font-size: 13px;
  margin-bottom: 16px;
}

.mch-info__stats {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-bottom: 16px;
}

.mch-info__stats .label {
  color: hsl(var(--muted-foreground));
  display: block;
  font-size: 12px;
  margin-bottom: 4px;
}

.mch-info__actions {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.mch-info__foot {
  color: hsl(var(--muted-foreground));
  font-size: 12px;
}

.amount-positive {
  color: hsl(142 71% 40%);
}

.amount-negative {
  color: hsl(var(--destructive));
}
</style>

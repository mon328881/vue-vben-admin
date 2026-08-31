<script lang="ts" setup>
import { computed } from 'vue';

import { Button } from 'ant-design-vue';

export interface TableActionItem {
  key: string;
  label: string;
  /** 危险操作（红色链接，如冲正/删除） */
  danger?: boolean;
  hidden?: boolean;
}

const props = defineProps<{
  items: TableActionItem[];
}>();

const emit = defineEmits<{
  click: [key: string];
}>();

const visible = computed(() => props.items.filter((i) => !i.hidden));
</script>

<template>
  <div v-if="visible.length" class="ap-table-ops">
    <Button
      v-for="item in visible"
      :key="item.key"
      type="link"
      size="small"
      :danger="!!item.danger"
      class="ap-table-ops__link"
      @click.stop="emit('click', item.key)"
    >
      {{ item.label }}
    </Button>
  </div>
</template>

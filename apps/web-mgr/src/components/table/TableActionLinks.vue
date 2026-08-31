<script lang="ts" setup>
/**
 * 列表行操作链接；超过 maxVisible 时收起到「更多」下拉（对齐旧端 mgr-web）
 */
import { computed, ref } from 'vue';

import { Button, Dropdown, Menu } from 'ant-design-vue';

export interface TableActionItem {
  key: string;
  label: string;
  /** 危险操作（红色链接，如冲正/删除） */
  danger?: boolean;
  hidden?: boolean;
}

const props = withDefaults(
  defineProps<{
    items: TableActionItem[];
    /** 可见操作上限（含「更多」占位）；超出收入下拉。默认 4 */
    maxVisible?: number;
  }>(),
  {
    maxVisible: 4,
  },
);

const emit = defineEmits<{
  click: [key: string];
}>();

const moreOpen = ref(false);

const visibleItems = computed(() => props.items.filter((i) => !i.hidden));

const shown = computed(() =>
  visibleItems.value.length <= props.maxVisible
    ? visibleItems.value
    : visibleItems.value.slice(0, props.maxVisible - 1),
);

const overflow = computed(() =>
  visibleItems.value.length <= props.maxVisible
    ? []
    : visibleItems.value.slice(props.maxVisible - 1),
);

function onOverflowClick(info: { key: string | number }) {
  emit('click', String(info.key));
  moreOpen.value = false;
}
</script>

<template>
  <div v-if="shown.length" class="ap-table-ops">
    <Button
      v-for="item in shown"
      :key="item.key"
      type="link"
      size="small"
      :danger="!!item.danger"
      class="ap-table-ops__link"
      @click.stop="emit('click', item.key)"
    >
      {{ item.label }}
    </Button>
    <Dropdown
      v-if="overflow.length"
      v-model:open="moreOpen"
      :trigger="['hover', 'click']"
    >
      <Button
        size="small"
        type="link"
        class="ap-table-ops__link ap-table-ops__more"
        :class="{ 'is-expanded': moreOpen }"
        @click.stop
      >
        更多
      </Button>
      <template #overlay>
        <Menu @click="onOverflowClick">
          <Menu.Item
            v-for="item in overflow"
            :key="item.key"
            :danger="!!item.danger"
          >
            {{ item.label }}
          </Menu.Item>
        </Menu>
      </template>
    </Dropdown>
  </div>
</template>

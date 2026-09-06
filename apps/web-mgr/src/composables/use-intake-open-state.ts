import { computed, ref } from 'vue';

/** 顶栏进单开关与主页分析区共享的进单状态（模块级，跨组件实时同步） */
const openState = ref<null | boolean>(null);
const updatedAt = ref(0);

export function useIntakeOpenState() {
  const isOpen = computed(() => openState.value);
  const label = computed(() => {
    if (openState.value == null) return '状态未知';
    return openState.value ? '进单开启' : '进单关闭';
  });

  function setIntakeOpen(next: boolean) {
    openState.value = next;
    updatedAt.value = Date.now();
  }

  function clearIntakeOpen() {
    openState.value = null;
    updatedAt.value = Date.now();
  }

  return {
    openState,
    isOpen,
    label,
    updatedAt,
    setIntakeOpen,
    clearIntakeOpen,
  };
}

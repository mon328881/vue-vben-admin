import { computed, ref, type ComputedRef } from 'vue';

import type { ListStatCardItem } from '#/components/list/ListStatCards.vue';

/** 汇总卡片：失败态与 CountTo 数据构建 */
export function useListStat() {
  const statFailed = ref(false);

  async function loadStatSafely(loader: () => Promise<void>) {
    statFailed.value = false;
    try {
      await loader();
    } catch (error) {
      console.error('加载汇总统计失败', error);
      statFailed.value = true;
    }
  }

  function buildStatItems(
    builder: () => ListStatCardItem[],
  ): ComputedRef<ListStatCardItem[]> {
    return computed(() => {
      const items = builder();
      if (!statFailed.value) return items;
      return items.map((item) => ({
        title: item.title,
        icon: item.icon,
        display: '统计加载失败',
        tone: 'negative' as const,
      }));
    });
  }

  return { statFailed, loadStatSafely, buildStatItems };
}

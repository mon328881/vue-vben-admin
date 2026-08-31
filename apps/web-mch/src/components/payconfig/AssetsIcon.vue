<script lang="ts" setup>
import { computed } from 'vue';

const modules = import.meta.glob('../../assets/icons/icon*.webp', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const iconMap = (() => {
  const map = new Map<string, string>();
  for (const [path, src] of Object.entries(modules)) {
    const name = path.split('/').pop();
    if (name) map.set(name.toLowerCase(), src);
  }
  return map;
})();

const props = withDefaults(
  defineProps<{
    filename?: string;
    size?: number;
  }>(),
  {
    filename: '',
    size: 20,
  },
);

defineOptions({ name: 'AssetsIcon' });

function fileName(value?: string) {
  if (value == null) return null;
  const text = String(value).trim();
  if (!text) return null;
  const name = text.split(/[/\\]/).pop() ?? '';
  return /^[\w.-]+\.(?:webp|png|gif|jpe?g|svg)$/i.test(name) ? name : null;
}

const src = computed(() => {
  const name = fileName(props.filename);
  return name ? (iconMap.get(name.toLowerCase()) ?? '') : '';
});
</script>

<template>
  <img
    v-if="src"
    :src="src"
    :width="size"
    :height="size"
    class="assets-icon"
    alt=""
    loading="lazy"
    decoding="async"
  />
</template>

<style scoped>
.assets-icon {
  display: inline-block;
  object-fit: contain;
  vertical-align: middle;
  flex-shrink: 0;
}
</style>

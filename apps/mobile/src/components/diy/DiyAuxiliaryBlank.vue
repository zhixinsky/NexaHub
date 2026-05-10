<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ block: Record<string, unknown> }>();

const h = computed(() => {
  const c = (props.block as { com_data?: { content?: { height?: number } } }).com_data?.content;
  const n = Number(c?.height);
  return Number.isFinite(n) && n > 0 ? n : 20;
});
</script>

<template>
  <view class="blank" :style="{ height: `${h}px` }" />
</template>

<style scoped>
.blank {
  width: 100%;
  background: transparent;
}
</style>

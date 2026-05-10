<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ block: Record<string, unknown> }>();

const com = computed(() => (props.block as { com_data?: { content?: Record<string, unknown>; style?: Record<string, unknown> } }).com_data);
const content = computed(() => (com.value?.content || {}) as Record<string, unknown>);
const sty = computed(() => (com.value?.style || {}) as Record<string, unknown>);

const lineStyle = computed(() => {
  const w = Math.max(Number(sty.value.line_width) || 1, 1);
  const color = typeof sty.value.line_color === 'string' ? sty.value.line_color : '#e5e7eb';
  const border = typeof content.value.styles === 'string' ? content.value.styles : 'solid';

  return `border-bottom-width:${w}px;border-bottom-color:${color};border-bottom-style:${border};`;
});

const pad = computed(() => {
  const cs = sty.value.common_style as Record<string, unknown> | undefined;
  const pt = Number(cs?.padding_top ?? sty.value.padding_top ?? 12);
  const pb = Number(cs?.padding_bottom ?? sty.value.padding_bottom ?? 12);
  return { paddingTop: `${pt}px`, paddingBottom: `${pb}px` };
});
</script>

<template>
  <view class="wrap" :style="pad">
    <view class="bar" :style="lineStyle" />
  </view>
</template>

<style scoped>
.wrap {
  width: 100%;
}
.bar {
  width: 100%;
}
</style>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ block: Record<string, unknown> }>();

const html = computed(() => {
  const c = (props.block as { com_data?: { content?: { html?: string } } }).com_data?.content;
  return typeof c?.html === 'string' ? c.html : '';
});

const safe = computed(() =>
  html.value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/ on\w+="[^"]*"/gi, '')
    .replace(/ on\w+=\S+/gi, '')
);
</script>

<template>
  <view v-if="safe" class="box">
    <!-- #ifdef H5 -->
    <view class="html" v-html="safe" />
    <!-- #endif -->
    <!-- #ifndef H5 -->
    <rich-text :nodes="safe" />
    <!-- #endif -->
  </view>
  <view v-else class="muted">暂无图文</view>
</template>

<style scoped>
.box {
  padding: 16rpx 24rpx;
  background: #fff;
}
.html {
  overflow: hidden;
  font-size: 28rpx;
  line-height: 1.6;
  color: #374151;
}
.muted {
  padding: 24rpx;
  text-align: center;
  color: #9ca3af;
  font-size: 26rpx;
}
</style>

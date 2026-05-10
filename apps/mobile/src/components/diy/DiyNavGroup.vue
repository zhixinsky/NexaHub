<script setup lang="ts">
import { computed } from 'vue';
import { firstUploadUrl } from '@/utils/assetUrl';
import { invokeResolvedLink, resolveDiyItemLink } from '@/utils/resolveLink';

const props = defineProps<{ block: Record<string, unknown> }>();

const ctx = computed(
  () => ((props.block as { com_data?: { content?: Record<string, unknown> } }).com_data?.content || {}) as Record<string, unknown>
);

const cols = computed(() => {
  const n = Number(ctx.value.single_line);
  return n >= 3 && n <= 5 ? n : 4;
});

const items = computed(
  () => (Array.isArray(ctx.value.nav_content_list) ? ctx.value.nav_content_list : []) as Record<string, unknown>[]
);

const showText = computed(() => String(ctx.value.nav_style || 'image_with_text') !== 'image');
const gap = computed(() => 12);

function onItem(item: unknown) {
  if (!item || typeof item !== 'object') return;
  invokeResolvedLink(resolveDiyItemLink(item as Record<string, unknown>, 'link'));
}
</script>

<template>
  <view class="nav">
    <view class="grid" :style="{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: `${gap}rpx` }">
      <view v-for="(it, i) in items" :key="`n-${i}`" class="cell" @tap="onItem(it)">
        <image v-if="firstUploadUrl(it.img)" class="icon" :src="firstUploadUrl(it.img)" mode="aspectFill" />
        <view v-else class="placeholder" />
        <text v-if="showText && it.title" class="title">{{ it.title }}</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.nav {
  padding: 16rpx 24rpx 24rpx;
  background: #fff;
}
.grid {
  display: grid;
}
.cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 8rpx 0;
}
.icon {
  width: 96rpx;
  height: 96rpx;
  border-radius: 12rpx;
  background: #f3f4f6;
}
.placeholder {
  width: 96rpx;
  height: 96rpx;
  border-radius: 12rpx;
  background: #e5e7eb;
}
.title {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #374151;
  text-align: center;
}
</style>

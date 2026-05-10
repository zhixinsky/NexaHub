<script setup lang="ts">
import { computed } from 'vue';
import { firstUploadUrl } from '@/utils/assetUrl';
import { invokeResolvedLink, resolveDiyItemLink } from '@/utils/resolveLink';

const props = defineProps<{ block: Record<string, unknown> }>();

const com = computed(() => (props.block as { com_data?: { content?: Record<string, unknown> } }).com_data);
const ctx = computed(() => (com.value?.content || {}) as Record<string, unknown>);
const rows = computed(() => (Array.isArray(ctx.value.carousel_list) ? ctx.value.carousel_list : []) as Record<string, unknown>[]);
const usable = computed(() =>
  rows.value
    .map((item) => {
      const img = firstUploadUrl(item.carousel_img);
      const link = resolveDiyItemLink(item as Record<string, unknown>, 'carousel_link');
      return { img, link };
    })
    .filter((x) => x.img)
);

const heightPx = computed(() => Math.max(Number(ctx.value.height) || 220, 80));
const intervalMs = computed(() => Math.max(Number(ctx.value.interval_time) || 3, 1) * 1000);
const autoplay = computed(() => String(ctx.value.is_roll) !== '0');

function onTap(si: number) {
  const t = usable.value[si]?.link;
  if (t && t.kind !== 'none') invokeResolvedLink(t);
}

const imgMode = computed(() => {
  const map: Record<string, string> = { contain: 'aspectFit', cover: 'aspectFill', fill: 'scaleToFill' };
  const raw = typeof ctx.value.img_fit === 'string' ? ctx.value.img_fit : 'contain';
  return map[raw] || 'aspectFit';
});
</script>

<template>
  <view v-if="usable.length" class="wrap">
    <swiper
      class="swiper"
      :style="{ height: heightPx + 'px' }"
      :indicator-dots="usable.length > 1"
      :autoplay="autoplay && usable.length > 1"
      circular
      :interval="intervalMs"
    >
      <swiper-item v-for="(sl, si) in usable" :key="si" class="item">
        <image class="img" :src="sl.img" :mode="imgMode" @tap="onTap(si)" />
      </swiper-item>
    </swiper>
  </view>
  <view v-else class="empty">暂无轮播图片</view>
</template>

<style scoped>
.wrap {
  width: 100%;
}
.swiper {
  width: 100%;
}
.item {
  width: 100%;
  height: 100%;
}
.img {
  width: 100%;
  height: 100%;
  background: #f3f4f6;
}
.empty {
  padding: 24rpx;
  text-align: center;
  color: #9ca3af;
  font-size: 26rpx;
}
</style>

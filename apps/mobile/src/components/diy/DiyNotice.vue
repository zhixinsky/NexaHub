<script setup lang="ts">
import { computed } from 'vue';
import { firstUploadUrl } from '@/utils/assetUrl';
import { invokeResolvedLink, resolveLink } from '@/utils/resolveLink';

const props = defineProps<{ block: Record<string, unknown> }>();

const sty = computed(
  () =>
    (((props.block as { com_data?: { style?: Record<string, unknown> } }).com_data || {}).style || {}) as Record<string, unknown>
);
const ctx = computed(
  () => ((props.block as { com_data?: { content?: Record<string, unknown> } }).com_data?.content || {}) as Record<string, unknown>
);

const list = computed(() => {
  const raw = (Array.isArray(ctx.value.notice_list) ? ctx.value.notice_list : []) as Record<string, unknown>[];
  return raw.filter((row) => String(row?.is_show || '1') === '1' && typeof row.notice_title === 'string');
});

const bg = computed(() => {
  const h = sty.value.news_color ? String(sty.value.news_color) : '#eef2ff';
  return h;
});

const title = computed(() => String(ctx.value.title || '公告'));

function tap(row: Record<string, unknown>) {
  invokeResolvedLink(resolveLink(row.notice_link));
}
</script>

<template>
  <view class="box" :style="{ background: bg }">
    <view class="row">
      <image v-if="firstUploadUrl(ctx.img_src)" class="img" :src="firstUploadUrl(ctx.img_src)" mode="aspectFit" />
      <text v-else class="tag">{{ title }}</text>
      <swiper v-if="list.length" class="sw" vertical circular autoplay :interval="3000" :display-multiple-items="1">
        <swiper-item v-for="(row, i) in list" :key="i" class="si">
          <text class="msg" @tap="tap(row)">{{ row.notice_title }}</text>
        </swiper-item>
      </swiper>
      <text v-else class="muted">暂无公告</text>
    </view>
  </view>
</template>

<style scoped>
.box {
  margin: 0 0 16rpx;
  padding: 16rpx 20rpx;
  border-radius: 12rpx;
}
.row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.img {
  width: 48rpx;
  height: 48rpx;
}
.tag {
  font-size: 26rpx;
  font-weight: 600;
  color: #1f2937;
}
.sw {
  flex: 1;
  height: 44rpx;
}
.si {
  display: flex;
  align-items: center;
}
.msg {
  font-size: 26rpx;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.muted {
  flex: 1;
  font-size: 24rpx;
  color: #9ca3af;
}
</style>

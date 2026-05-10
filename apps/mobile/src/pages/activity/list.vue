<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { listActivities, type ActivityItem } from '@/api/activities';
import { resolveMediaUrl } from '@/utils/assetUrl';

const items = ref<ActivityItem[]>([]);
const err = ref('');
const loading = ref(true);

onMounted(async () => {
  loading.value = true;
  err.value = '';
  try {
    const res = await listActivities({ page: 1, pageSize: 30, status: 'published' });
    items.value = res.items;
  } catch (e) {
    err.value = e instanceof Error ? e.message : String(e);
  } finally {
    loading.value = false;
  }
});

function cover(row: ActivityItem) {
  const c = row.cover;
  return typeof c === 'string' ? resolveMediaUrl(c) : '';
}

function open(id: string) {
  uni.navigateTo({ url: `/pages/activity/detail?id=${encodeURIComponent(id)}` });
}
</script>

<template>
  <view class="wrap">
    <view v-if="loading" class="hint">加载中…</view>
    <view v-else-if="err" class="hint err">{{ err }}</view>
    <view v-for="row in items" :key="row.id" class="row" @tap="open(row.id)">
      <image v-if="cover(row)" class="thumb" :src="cover(row)" mode="aspectFill" />
      <view class="meta">
        <text class="t">{{ row.title }}</text>
        <text class="d">{{ String(row.description || '').slice(0, 120) }}</text>
      </view>
    </view>
    <view v-if="!loading && !items.length" class="hint">暂无活动</view>
  </view>
</template>

<style scoped>
.wrap {
  min-height: 100vh;
  background: #fafafa;
}
.hint {
  padding: 48rpx;
  text-align: center;
  font-size: 28rpx;
  color: #6b7280;
}
.err {
  color: #b91c1c;
}
.row {
  display: flex;
  gap: 20rpx;
  padding: 24rpx;
  border-bottom: 1px solid #f3f4f6;
}
.thumb {
  width: 180rpx;
  height: 120rpx;
  border-radius: 10rpx;
  background: #e5e7eb;
}
.meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.t {
  font-size: 30rpx;
  color: #111827;
}
.d {
  font-size: 24rpx;
  color: #6b7280;
}
</style>

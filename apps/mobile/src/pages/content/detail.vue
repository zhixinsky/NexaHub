<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { ref } from 'vue';
import { getContent, type ContentItem } from '@/api/contents';
import { resolveMediaUrl } from '@/utils/assetUrl';

const id = ref('');
const row = ref<ContentItem | null>(null);
const err = ref('');
const loading = ref(true);

onLoad((q: Record<string, string | undefined>) => {
  id.value = typeof q.id === 'string' ? q.id : '';
  void load();
});

async function load() {
  if (!id.value) {
    err.value = '缺少 id';
    loading.value = false;
    return;
  }
  loading.value = true;
  err.value = '';
  row.value = null;
  try {
    row.value = await getContent(id.value);
    if (typeof row.value?.title === 'string') {
      uni.setNavigationBarTitle({ title: row.value.title.slice(0, 20) }).catch(() => {});
    }
  } catch (e) {
    err.value = e instanceof Error ? e.message : String(e);
  } finally {
    loading.value = false;
  }
}

function hero() {
  const c = row.value?.cover;
  return typeof c === 'string' ? resolveMediaUrl(c) : '';
}
</script>

<template>
  <view class="wrap">
    <view v-if="loading" class="hint">加载中…</view>
    <view v-else-if="err" class="hint err">{{ err }}</view>
    <view v-else-if="row" class="body">
      <image v-if="hero()" class="hero" :src="hero()" mode="aspectFill" />
      <text class="title">{{ row.title }}</text>
      <!-- #ifdef H5 -->
      <view v-if="typeof row.content === 'string'" class="html" v-html="String(row.content || '')" />
      <!-- #endif -->
      <!-- #ifndef H5 -->
      <rich-text v-if="typeof row.content === 'string'" class="html" :nodes="String(row.content || '')" />
      <!-- #endif -->
    </view>
  </view>
</template>

<style scoped>
.wrap {
  min-height: 100vh;
  padding-bottom: 40rpx;
  background: #fff;
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
.hero {
  width: 100%;
  height: 420rpx;
  background: #f3f4f6;
}
.title {
  display: block;
  padding: 24rpx 28rpx 12rpx;
  font-size: 36rpx;
  font-weight: 700;
  color: #111827;
}
.html {
  padding: 0 28rpx;
  font-size: 28rpx;
  line-height: 1.7;
  color: #374151;
}
</style>

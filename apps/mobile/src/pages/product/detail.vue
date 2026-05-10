<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { ref } from 'vue';
import { getProduct, type ProductItem } from '@/api/products';
import { resolveMediaUrl } from '@/utils/assetUrl';

const id = ref('');
const row = ref<ProductItem | null>(null);
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
    row.value = await getProduct(id.value);
    uni.setNavigationBarTitle({ title: row.value.title?.slice(0, 12) || '商品' }).catch(() => {});
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
      <text class="subtitle" v-if="row.subtitle">{{ row.subtitle }}</text>
      <text class="price">¥{{ Number(row.price ?? 0).toFixed(2) }}</text>
      <!-- #ifdef H5 -->
      <view v-if="typeof row.description === 'string'" class="desc" v-html="String(row.description || '')" />
      <!-- #endif -->
      <!-- #ifndef H5 -->
      <rich-text v-if="typeof row.description === 'string'" class="desc" :nodes="String(row.description || '')" />
      <!-- #endif -->
    </view>
  </view>
</template>

<style scoped>
.wrap {
  min-height: 100vh;
  padding-bottom: 48rpx;
  background: #fff;
}
.hint {
  padding: 48rpx;
  text-align: center;
  font-size: 28rpx;
}
.err {
  color: #b91c1c;
}
.hero {
  width: 100%;
  height: 480rpx;
  background: #f9fafb;
}
.title {
  display: block;
  padding: 24rpx 28rpx 8rpx;
  font-size: 34rpx;
  font-weight: 700;
}
.subtitle {
  display: block;
  padding: 0 28rpx;
  font-size: 26rpx;
  color: #6b7280;
}
.price {
  display: block;
  padding: 20rpx 28rpx 8rpx;
  font-size: 36rpx;
  font-weight: 700;
  color: #dc2626;
}
.desc {
  padding: 24rpx 28rpx 0;
  font-size: 28rpx;
  line-height: 1.6;
  color: #374151;
}
</style>

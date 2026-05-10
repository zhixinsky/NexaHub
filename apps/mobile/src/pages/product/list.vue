<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { listProducts, type ProductItem } from '@/api/products';
import { resolveMediaUrl } from '@/utils/assetUrl';

const items = ref<ProductItem[]>([]);
const err = ref('');
const loading = ref(true);

onMounted(async () => {
  loading.value = true;
  err.value = '';
  try {
    const res = await listProducts({ page: 1, pageSize: 30, status: 'on_sale' });
    items.value = res.items;
  } catch (e) {
    err.value = e instanceof Error ? e.message : String(e);
  } finally {
    loading.value = false;
  }
});

function cover(row: ProductItem) {
  const c = row.cover;
  return typeof c === 'string' ? resolveMediaUrl(c) : '';
}

function open(id: string) {
  uni.navigateTo({ url: `/pages/product/detail?id=${encodeURIComponent(id)}` });
}
</script>

<template>
  <view class="wrap">
    <view v-if="loading" class="hint">加载中…</view>
    <view v-else-if="err" class="hint err">{{ err }}</view>
    <view v-else class="grid">
      <view v-for="row in items" :key="row.id" class="card" @tap="open(row.id)">
        <image v-if="cover(row)" class="img" :src="cover(row)" mode="aspectFill" />
        <view v-else class="img ph" />
        <text class="t">{{ row.title }}</text>
        <text class="p">¥{{ Number(row.price ?? 0).toFixed(2) }}</text>
      </view>
    </view>
    <view v-if="!loading && !items.length" class="hint">暂无商品</view>
  </view>
</template>

<style scoped>
.wrap {
  min-height: 100vh;
  padding: 16rpx;
  background: #f5f5f5;
}
.hint {
  padding: 48rpx;
  text-align: center;
  font-size: 28rpx;
}
.err {
  color: #b91c1c;
}
.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}
.card {
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  padding-bottom: 14rpx;
}
.img {
  width: 100%;
  height: 320rpx;
}
.ph {
  background: #eee;
}
.t {
  padding: 12rpx 16rpx 4rpx;
  font-size: 28rpx;
  color: #111827;
}
.p {
  padding-left: 16rpx;
  font-size: 28rpx;
  color: #dc2626;
}
</style>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { getProduct, listProducts, listPublicProducts } from '@/api/products';
import type { ProductItem } from '@/api/products';
import { getJson } from '@/api/http';
import { firstUploadUrl, resolveMediaUrl } from '@/utils/assetUrl';
import { businessQuery, getDataSource, normalizeDataSourceItems } from '@/utils/dataSource';

const props = defineProps<{ block: Record<string, unknown> }>();

const ctx = computed(
  () => ((props.block as { com_data?: { content?: Record<string, unknown> } }).com_data?.content || {}) as Record<string, unknown>
);

const items = ref<ProductItem[]>([]);
const err = ref('');

function coverUrl(row: ProductItem) {
  const c = row.cover;
  if (!c) return '';
  if (typeof c === 'string') return resolveMediaUrl(c);
  return firstUploadUrl(c);
}

async function load() {
  items.value = [];
  err.value = '';
  const n = Math.min(Math.max(Number(ctx.value.number) || 10, 1), 100);
  const dt = String(ctx.value.data_type ?? '');

  try {
    const source = getDataSource(ctx.value, 'product');
    if (source.type === 'business' && source.businessType === 'product') {
      const res = await listPublicProducts(businessQuery(source));
      items.value = res.items;
      return;
    }
    if (source.type === 'api' && source.api?.url) {
      items.value = normalizeDataSourceItems<ProductItem>(await getJson(source.api.url));
      return;
    }

    if (dt === '0') {
      const idsRaw = Array.isArray(ctx.value.data_ids)
        ? (ctx.value.data_ids as unknown[]).map(String).join(',')
        : typeof ctx.value.data_ids === 'string'
          ? ctx.value.data_ids
          : '';

      const ids = idsRaw
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
        .slice(0, n);

      if (ids.length) {
        const rows = await Promise.all(ids.map((id) => getProduct(id).catch(() => null)));
        items.value = rows.filter(Boolean) as ProductItem[];
        return;
      }

      const listFromDsl = (Array.isArray(ctx.value.data_list) ? ctx.value.data_list : []) as Record<string, unknown>[];
      const fromIds = listFromDsl
        .map((row) => String(row.data_id || (row.data as { id?: string } | undefined)?.id || row.id || '').trim())
        .filter(Boolean)
        .slice(0, n);

      if (fromIds.length) {
        const rows = await Promise.all(fromIds.map((id) => getProduct(id).catch(() => null)));
        items.value = rows.filter(Boolean) as ProductItem[];
        return;
      }
    }

    const res = await listProducts({ page: 1, pageSize: n, status: 'on_sale' });
    items.value = res.items;
  } catch (e) {
    err.value = e instanceof Error ? e.message : String(e);
    items.value = [];
  }
}

onMounted(load);

watch(
  () => JSON.stringify(ctx.value.dataSource || {}),
  () => {
    void load();
  }
);

function open(id: string) {
  uni.navigateTo({ url: `/pages/product/detail?id=${encodeURIComponent(id)}` });
}
</script>

<template>
  <view class="wrap">
    <text v-if="err" class="err">{{ err }}</text>
    <view class="grid">
      <view v-for="row in items" :key="row.id" class="card" @tap="open(row.id)">
        <image v-if="coverUrl(row)" class="img" :src="coverUrl(row)" mode="aspectFill" />
        <view v-else class="img ph" />
        <text class="tit">{{ row.title }}</text>
        <text class="price">¥{{ Number(row.price ?? 0).toFixed(2) }}</text>
      </view>
    </view>
    <view v-if="!items.length && !err" class="muted">暂无商品</view>
  </view>
</template>

<style scoped>
.wrap {
  padding: 0 16rpx 24rpx;
}
.err {
  color: #b91c1c;
  font-size: 24rpx;
  padding: 8rpx;
}
.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}
.card {
  background: #fff;
  border-radius: 12rpx;
  overflow: hidden;
  padding-bottom: 12rpx;
}
.img {
  width: 100%;
  height: 340rpx;
}
.ph {
  background: #f3f4f6;
}
.tit {
  padding: 12rpx;
  font-size: 26rpx;
  color: #111827;
}
.price {
  padding-left: 12rpx;
  font-size: 26rpx;
  color: #dc2626;
}
.muted {
  padding: 24rpx;
  text-align: center;
  color: #9ca3af;
  font-size: 26rpx;
}
</style>

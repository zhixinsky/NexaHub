<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { getContent, listContents, listPublicContents } from '@/api/contents';
import type { ContentItem } from '@/api/contents';
import { getJson } from '@/api/http';
import { firstUploadUrl, resolveMediaUrl } from '@/utils/assetUrl';
import { businessQuery, getDataSource, normalizeDataSourceItems } from '@/utils/dataSource';

const props = defineProps<{ block: Record<string, unknown> }>();

const ctx = computed(
  () => ((props.block as { com_data?: { content?: Record<string, unknown> } }).com_data?.content || {}) as Record<string, unknown>
);

const items = ref<ContentItem[]>([]);
const err = ref('');

async function load() {
  items.value = [];
  err.value = '';
  const n = Math.min(Math.max(Number(ctx.value.number) || 10, 1), 100);
  const dt = String(ctx.value.data_type ?? '');

  try {
    const source = getDataSource(ctx.value, 'content');
    if (source.type === 'business' && source.businessType === 'content') {
      const res = await listPublicContents(businessQuery(source));
      items.value = res.items;
      return;
    }
    if (source.type === 'api' && source.api?.url) {
      items.value = normalizeDataSourceItems<ContentItem>(await getJson(source.api.url));
      return;
    }

    if (dt === '0') {
      const idsRaw = typeof ctx.value.data_ids === 'string' ? ctx.value.data_ids : '';
      const ids = idsRaw
        ? idsRaw
            .split(',')
            .map((x) => x.trim())
            .filter(Boolean)
            .slice(0, n)
        : [];

      if (ids.length) {
        const rows = await Promise.all(ids.map((id) => getContent(id).catch(() => null)));
        items.value = rows.filter(Boolean) as ContentItem[];
        return;
      }

      const listFromDsl = (Array.isArray(ctx.value.data_list) ? ctx.value.data_list : []) as Record<string, unknown>[];
      const fromDsl = listFromDsl
        .map((row) => {
          const id = String(row.data_id || (row.data as { id?: string } | undefined)?.id || row.id || '');
          if (!id) return null;
          return {
            id,
            title: String(row.new_title || ''),
            cover: firstUploadUrl(row.new_cover),
            summary: ''
          } as ContentItem;
        })
        .filter(Boolean) as ContentItem[];

      if (fromDsl.length) {
        const expanded = await Promise.all(
          fromDsl.slice(0, n).map(async (stub) => {
            const full = await getContent(stub.id).catch(() => null);
            return full || stub;
          })
        );
        items.value = expanded.filter(Boolean) as ContentItem[];
        return;
      }
    }

    const res = await listContents({ page: 1, pageSize: n, status: 'published' });
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
  uni.navigateTo({ url: `/pages/content/detail?id=${encodeURIComponent(id)}` });
}

function coverUrl(row: ContentItem) {
  const c = row.cover;
  if (!c) return '';
  if (typeof c === 'string') return resolveMediaUrl(c);
  return firstUploadUrl(c);
}
</script>

<template>
  <view class="wrap">
    <text v-if="err" class="err">{{ err }}</text>
    <view v-for="row in items" :key="row.id" class="row" @tap="open(row.id)">
      <image v-if="coverUrl(row)" class="thumb" :src="coverUrl(row)" mode="aspectFill" />
      <view class="meta">
        <text class="t">{{ row.title }}</text>
        <text class="desc">{{ typeof row.summary === 'string' ? row.summary.slice(0, 80) : '' }}</text>
      </view>
    </view>
    <view v-if="!items.length && !err" class="muted">暂无文章</view>
  </view>
</template>

<style scoped>
.wrap {
  padding: 0 24rpx 24rpx;
}
.err {
  color: #b91c1c;
  font-size: 24rpx;
  padding: 8rpx;
}
.row {
  display: flex;
  gap: 20rpx;
  padding: 20rpx 0;
  border-bottom: 1px solid #f3f4f6;
}
.thumb {
  width: 180rpx;
  height: 120rpx;
  border-radius: 10rpx;
  background: #f3f4f6;
}
.meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.t {
  font-size: 28rpx;
  color: #111827;
}
.desc {
  font-size: 24rpx;
  color: #6b7280;
}
.muted {
  padding: 24rpx;
  text-align: center;
  color: #9ca3af;
  font-size: 26rpx;
}
</style>

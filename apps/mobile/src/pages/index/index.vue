<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getPublishedPageByCode, type NexaPublishedPage } from '@/api/pages';
import { visibleDiyBlocks, parseShopxoDsl } from '@/utils/parseShopxoDsl';
import ShopxoDiyRenderer from '@/components/diy/ShopxoDiyRenderer.vue';

/** 首页固定拉取 `/public/pages/home`；可通过跳转参数覆盖 code（可选）。 */
const loading = ref(true);
const err = ref('');
const page = ref<NexaPublishedPage | null>(null);
const requestedCode = ref('home');

onLoad((opts?: Record<string, string | undefined>) => {
  const c = opts && typeof opts.code === 'string' && opts.code.trim() ? opts.code.trim() : 'home';
  requestedCode.value = c;
  void bootstrap();
});

async function bootstrap() {
  loading.value = true;
  err.value = '';
  page.value = null;
  try {
    page.value = await getPublishedPageByCode(requestedCode.value);
  } catch (e) {
    err.value = e instanceof Error ? e.message : String(e);
  } finally {
    loading.value = false;
  }
}

const diyBlocks = computed(() => {
  const p = page.value;
  if (!p?.dsl || p.source !== 'shopxo_diy') return [];
  const parsed = parseShopxoDsl(p.dsl);
  if (!parsed?.diyBlocks.length) return [];
  return visibleDiyBlocks(parsed.diyBlocks);
});

const fallbackText = computed(() => {
  if (!page.value) return '';
  if (page.value.source !== 'shopxo_diy') return '当前首页来源为原生配置，暂不渲染 DIY。';
  return '装修数据为空或未包含主画布组件。请在后台发布后重试。';
});
</script>

<template>
  <view class="page">
    <view v-if="loading" class="center muted">加载中…</view>
    <view v-else-if="err" class="center err">{{ err }}</view>
    <ShopxoDiyRenderer v-else-if="diyBlocks.length" :blocks="diyBlocks" />
    <view v-else class="center muted">{{ fallbackText }}</view>
  </view>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
}
.center {
  padding: 80rpx 32rpx;
  font-size: 28rpx;
  text-align: center;
}
.muted {
  color: #6b7280;
}
.err {
  color: #b91c1c;
}
</style>

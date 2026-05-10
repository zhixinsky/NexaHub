<script setup lang="ts">
import type { DiyBlock } from '@/utils/parseShopxoDsl';
import DiyBlockBoundary from '@/components/diy/DiyBlockBoundary.vue';
import DiyCarousel from '@/components/diy/DiyCarousel.vue';
import DiyNavGroup from '@/components/diy/DiyNavGroup.vue';
import DiyNotice from '@/components/diy/DiyNotice.vue';
import DiyImgMagic from '@/components/diy/DiyImgMagic.vue';
import DiyArticleList from '@/components/diy/DiyArticleList.vue';
import DiyGoodsList from '@/components/diy/DiyGoodsList.vue';
import DiyRichText from '@/components/diy/DiyRichText.vue';
import DiyAuxiliaryBlank from '@/components/diy/DiyAuxiliaryBlank.vue';
import DiyRowLine from '@/components/diy/DiyRowLine.vue';
import DiyUnsupported from '@/components/diy/DiyUnsupported.vue';

defineProps<{ blocks: DiyBlock[] }>();

/** shopxo div-content 中 item.key → 移动端组件映射 */
function mapKey(key: string) {
  const k = String(key || '').trim();
  const m: Record<string, string> = {
    carousel: 'carousel',
    'nav-group': 'nav-group',
    notice: 'notice',
    'img-magic': 'img-magic',
    'article-list': 'article-list',
    'goods-list': 'goods-list',
    'rich-text': 'rich-text',
    'auxiliary-blank': 'auxiliary-blank',
    'row-line': 'row-line'
  };
  return m[k] || '';
}

function stableKey(block: DiyBlock, i: number) {
  return String(block?.id ?? block?.key ?? '') || `diy-${i}`;
}
</script>

<template>
  <scroll-view scroll-y class="sv">
    <view v-for="(block, i) in blocks" :key="stableKey(block, i)" class="blk">
      <template v-if="mapKey(block.key) === 'carousel'">
        <DiyBlockBoundary :type-key="'carousel'"><DiyCarousel :block="block as never" /></DiyBlockBoundary>
      </template>
      <template v-else-if="mapKey(block.key) === 'nav-group'">
        <DiyBlockBoundary :type-key="'nav-group'"><DiyNavGroup :block="block as never" /></DiyBlockBoundary>
      </template>
      <template v-else-if="mapKey(block.key) === 'notice'">
        <DiyBlockBoundary :type-key="'notice'"><DiyNotice :block="block as never" /></DiyBlockBoundary>
      </template>
      <template v-else-if="mapKey(block.key) === 'img-magic'">
        <DiyBlockBoundary :type-key="'img-magic'"><DiyImgMagic :block="block as never" /></DiyBlockBoundary>
      </template>
      <template v-else-if="mapKey(block.key) === 'article-list'">
        <DiyBlockBoundary :type-key="'article-list'"><DiyArticleList :block="block as never" /></DiyBlockBoundary>
      </template>
      <template v-else-if="mapKey(block.key) === 'goods-list'">
        <DiyBlockBoundary :type-key="'goods-list'"><DiyGoodsList :block="block as never" /></DiyBlockBoundary>
      </template>
      <template v-else-if="mapKey(block.key) === 'rich-text'">
        <DiyBlockBoundary :type-key="'rich-text'"><DiyRichText :block="block as never" /></DiyBlockBoundary>
      </template>
      <template v-else-if="mapKey(block.key) === 'auxiliary-blank'">
        <DiyBlockBoundary :type-key="'auxiliary-blank'"><DiyAuxiliaryBlank :block="block as never" /></DiyBlockBoundary>
      </template>
      <template v-else-if="mapKey(block.key) === 'row-line'">
        <DiyBlockBoundary :type-key="'row-line'"><DiyRowLine :block="block as never" /></DiyBlockBoundary>
      </template>
      <DiyUnsupported v-else :type-key="block.key" />
    </view>
  </scroll-view>
</template>

<style scoped>
.sv {
  height: 100vh;
  background: #f5f5f5;
}
.blk {
  width: 100%;
}
</style>

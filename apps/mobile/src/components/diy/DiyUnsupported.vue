<script setup lang="ts">
defineProps<{ typeKey: string }>();
</script>

<template>
  <view class="slot">
    <text class="txt">暂不支持：{{ typeKey }}</text>
  </view>
</template>

<style scoped>
.slot {
  margin: 12rpx 24rpx;
  padding: 24rpx;
  border-radius: 12rpx;
  background: #f9fafb;
  border: 1px dashed #d1d5db;
}
.txt {
  font-size: 24rpx;
  color: #9ca3af;
}
</style>

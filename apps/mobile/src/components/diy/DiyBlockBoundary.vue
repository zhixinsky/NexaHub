<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue';
import DiyUnsupported from '@/components/diy/DiyUnsupported.vue';

const props = defineProps<{ typeKey: string }>();

const crashed = ref(false);

onErrorCaptured((err, _inst, info) => {
  console.warn(`[ShopxoDIY:${props.typeKey}]`, err?.message ?? err, info);
  crashed.value = true;
  return false;
});
</script>

<template>
  <DiyUnsupported v-if="crashed" :type-key="props.typeKey" />
  <slot v-else />
</template>

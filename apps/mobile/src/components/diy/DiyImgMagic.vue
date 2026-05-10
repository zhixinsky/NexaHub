<script setup lang="ts">
import { computed } from 'vue';
import { firstUploadUrl } from '@/utils/assetUrl';
import { invokeResolvedLink, resolveDiyItemLink } from '@/utils/resolveLink';

const props = defineProps<{ block: Record<string, unknown> }>();

const ctx = computed(
  () => ((props.block as { com_data?: { content?: Record<string, unknown> } }).com_data?.content || {}) as Record<string, unknown>
);

const density = computed(() => {
  const d = Number(ctx.value.magic_cube_density);
  return d >= 4 && d <= 8 ? d : 4;
});

const heightPx = computed(() => Math.max(Number(ctx.value.container_height) || 360, 80));

const rawList = computed(
  () => (Array.isArray(ctx.value.img_magic_list) ? ctx.value.img_magic_list : []) as Record<string, unknown>[]
);

const cells = computed(() =>
  rawList.value
    .map((item) => {
      const start = item.start as { x?: number; y?: number } | undefined;
      const end = item.end as { x?: number; y?: number } | undefined;
      if (!start || !end) return null;
      const sx = Number(start.x) || 1;
      const sy = Number(start.y) || 1;
      const ex = Number(end.x) || sx;
      const ey = Number(end.y) || sy;
      const d = density.value;
      const w = (ex - sx + 1) / d;
      const h = (ey - sy + 1) / d;
      const left = (sx - 1) / d;
      const top = (sy - 1) / d;
      return {
        leftPct: left * 100,
        topPct: top * 100,
        wPct: w * 100,
        hPct: h * 100,
        src: firstUploadUrl(item.img),
        link: resolveDiyItemLink(item as Record<string, unknown>, 'img_link')
      };
    })
    .filter(Boolean) as {
    leftPct: number;
    topPct: number;
    wPct: number;
    hPct: number;
    src: string;
    link: ReturnType<typeof resolveDiyItemLink>;
  }[]
);

const imgMode = computed(() => {
  const map: Record<string, string> = { contain: 'aspectFit', cover: 'aspectFill', fill: 'scaleToFill' };
  const raw = typeof ctx.value.img_fit === 'string' ? ctx.value.img_fit : 'cover';
  return map[raw] || 'aspectFill';
});

function tap(i: number) {
  const t = cells.value[i]?.link;
  if (t && t.kind !== 'none') invokeResolvedLink(t);
}
</script>

<template>
  <view class="outer" :style="{ height: heightPx + 'px' }">
    <view v-for="(c, i) in cells" :key="i" class="cell" :style="{ left: c.leftPct + '%', top: c.topPct + '%', width: c.wPct + '%', height: c.hPct + '%' }">
      <image v-if="c.src" class="img" :src="c.src" :mode="imgMode" @tap="tap(i)" />
    </view>
  </view>
</template>

<style scoped>
.outer {
  position: relative;
  width: 100%;
  background: #f9fafb;
}
.cell {
  position: absolute;
  box-sizing: border-box;
}
.img {
  width: 100%;
  height: 100%;
  background: #e5e7eb;
}
</style>

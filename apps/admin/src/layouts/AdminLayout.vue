<script setup lang="ts">
import { computed, h } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { MenuOption } from 'naive-ui';
import {
  CalendarOutline,
  FolderOutline,
  HomeOutline,
  LayersOutline,
  MenuOutline,
  NewspaperOutline,
  PricetagOutline,
  SettingsOutline
} from '@vicons/ionicons5';
import { NIcon } from 'naive-ui';
import { useAppStore } from '../stores/app';

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();

function renderIcon(icon: unknown) {
  return () => h(NIcon, null, { default: () => h(icon as never) });
}

const menuOptions: MenuOption[] = [
  {
    label: '工作台',
    key: '/dashboard',
    icon: renderIcon(HomeOutline)
  },
  {
    label: '内容管理',
    key: '/content',
    icon: renderIcon(NewspaperOutline)
  },
  {
    label: '活动管理',
    key: '/activity',
    icon: renderIcon(CalendarOutline)
  },
  {
    label: '商品管理',
    key: '/goods',
    icon: renderIcon(PricetagOutline)
  },
  {
    label: '页面管理',
    key: '/pages',
    icon: renderIcon(LayersOutline)
  },
  {
    label: '资源管理',
    key: '/resources',
    icon: renderIcon(FolderOutline),
    children: [
      {
        label: '文件管理',
        key: '/resources/files'
      },
      {
        label: '分类管理',
        key: '/resources/categories'
      }
    ]
  },
  {
    label: '系统设置',
    key: '/settings',
    icon: renderIcon(SettingsOutline)
  }
];

const activeKey = computed(() => route.path);
const currentTitle = computed(() => String(route.meta.title || '工作台'));

function handleMenuUpdate(key: string) {
  router.push(key);
}

function findMenuLabels(options: MenuOption[], targetKey: string): string[] {
  for (const option of options) {
    const key = String(option.key ?? '');
    const label = String(option.label ?? '');
    if (key === targetKey) {
      return label ? [label] : [];
    }
    const children = Array.isArray(option.children) ? (option.children as MenuOption[]) : [];
    if (children.length > 0) {
      const childPath = findMenuLabels(children, targetKey);
      if (childPath.length > 0) {
        return label ? [label, ...childPath] : childPath;
      }
    }
  }
  return [];
}

const breadcrumbLabels = computed(() => {
  const labels = findMenuLabels(menuOptions, route.path);
  // 兜底：如果菜单里没配置到该路由，就至少显示当前标题
  return labels.length > 0 ? labels : [currentTitle.value];
});
</script>

<template>
  <n-layout has-sider class="admin-shell">
    <n-layout-sider
      bordered
      collapse-mode="width"
      :collapsed="appStore.siderCollapsed"
      :collapsed-width="64"
      :width="232"
      class="admin-sider"
    >
      <div class="brand" :class="{ 'brand--collapsed': appStore.siderCollapsed }">
        <div class="brand-mark">N</div>
        <div v-if="!appStore.siderCollapsed" class="brand-text">
          <strong>NexaHub</strong>
          <span>运营后台</span>
        </div>
      </div>

      <n-menu
        :collapsed="appStore.siderCollapsed"
        :collapsed-width="64"
        :collapsed-icon-size="20"
        :options="menuOptions"
        :value="activeKey"
        @update:value="handleMenuUpdate"
      />
    </n-layout-sider>

    <n-layout class="admin-main">
      <n-layout-header bordered class="admin-header">
        <n-space align="center" justify="space-between" class="header-inner">
          <n-space align="center" :size="16">
            <n-button quaternary circle @click="appStore.toggleSider">
              <template #icon>
                <n-icon>
                  <MenuOutline />
                </n-icon>
              </template>
            </n-button>
            <n-breadcrumb>
              <n-breadcrumb-item v-for="(label, idx) in breadcrumbLabels" :key="idx">
                {{ label }}
              </n-breadcrumb-item>
            </n-breadcrumb>
          </n-space>

          <n-space align="center" :size="12">
            <span class="tenant-name">默认租户</span>
            <n-avatar round size="small">A</n-avatar>
          </n-space>
        </n-space>
      </n-layout-header>

      <n-layout-content class="admin-content">
        <router-view />
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

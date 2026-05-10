<template>
  <crud-page
    title="页面"
    resource="pages"
    :fields="fields"
    :status-options="statusOptions"
    :editor-path="diyEditorPath"
    :list-copy-link="pageListCopyLink"
    readonly-status-column
    show-lifecycle-actions
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import CrudPage, { type CrudField, type ListCopyLinkConfig } from '../components/CrudPage.vue';

const diyOrigin = String(import.meta.env.VITE_DIY_EDITOR_ORIGIN || 'http://localhost:5174').replace(/\/$/, '');
const diyEditorPath = computed(() => `${diyOrigin}/diy-editor`);

const mobileH5Origin = String(import.meta.env.VITE_MOBILE_PREVIEW_ORIGIN || 'http://localhost:5176').replace(/\/$/, '');

function getPagePathLabel(row: Record<string, unknown>) {
  const code = String(row.code ?? '').trim();
  return `/pages/index/index?code=${encodeURIComponent(code)}`;
}

function getPagePreviewUrl(row: Record<string, unknown>) {
  return `${mobileH5Origin}/#${getPagePathLabel(row)}`;
}

const pageListCopyLink: ListCopyLinkConfig = {
  columnTitle: '页面路径',
  columnWidth: 280,
  getPathLabel: (row) => getPagePathLabel(row as Record<string, unknown>),
  getFullUrl: (row) => getPagePreviewUrl(row as Record<string, unknown>)
};

const platformOptions = [
  { label: 'H5', value: 'h5' },
  { label: '微信', value: 'wechat' },
  { label: 'App', value: 'app' }
];

const sourceOptions = [
  { label: '自有 DSL', value: 'native' },
  { label: 'ShopXO DIY', value: 'shopxo_diy' }
];

const fields: CrudField[] = [
  { key: 'name', label: '页面名称', required: true, list: true, width: 180 },
  { key: 'code', label: '页面编码', required: true, list: true, width: 140 },
  { key: 'platform', label: '平台', type: 'select', options: platformOptions, list: true, width: 100 },
  { key: 'source', label: '来源', type: 'select', options: sourceOptions, list: true, width: 130 },
  { key: 'dsl', label: '页面 DSL JSON', type: 'textarea', list: false }
];

const statusOptions = [
  { label: '草稿', value: 'draft', type: 'default' as const },
  { label: '已发布', value: 'published', type: 'success' as const },
  { label: '已下线', value: 'offline', type: 'warning' as const }
];
</script>

<template>
  <crud-page
    title="内容"
    resource="contents"
    :fields="fields"
    :status-options="statusOptions"
  />
</template>

<script setup lang="ts">
import CrudPage, { type CrudField } from '../components/CrudPage.vue';

const fields: CrudField[] = [
  { key: 'title', label: '标题', required: true, list: true, width: 180 },
  { key: 'subtitle', label: '副标题', list: true, width: 180 },
  { key: 'cover', label: '封面 URL', list: false },
  { key: 'category', label: '分类', list: true, width: 120 },
  { key: 'summary', label: '摘要', type: 'textarea', list: true, width: 240 },
  { key: 'content', label: '正文', type: 'textarea', list: false },
  { key: 'sort', label: '排序', type: 'number', list: true, width: 90 }
];

const statusOptions = [
  { label: '草稿', value: 'draft', type: 'default' as const },
  { label: '已发布', value: 'published', type: 'success' as const },
  { label: '已下线', value: 'offline', type: 'warning' as const }
];
</script>

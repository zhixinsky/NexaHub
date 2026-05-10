<template>
  <crud-page
    title="活动"
    resource="activities"
    :fields="fields"
    :status-options="statusOptions"
  />
</template>

<script setup lang="ts">
import CrudPage, { type CrudField } from '../components/CrudPage.vue';

const fields: CrudField[] = [
  { key: 'title', label: '标题', required: true, list: true, width: 180 },
  { key: 'cover', label: '封面 URL', list: false },
  { key: 'category', label: '分类', list: true, width: 120 },
  { key: 'location', label: '地点', list: true, width: 160 },
  { key: 'startTime', label: '开始时间', type: 'datetime', list: true, width: 180 },
  { key: 'endTime', label: '结束时间', type: 'datetime', list: false },
  { key: 'signupStartTime', label: '报名开始时间', type: 'datetime', list: false },
  { key: 'signupEndTime', label: '报名结束时间', type: 'datetime', list: false },
  { key: 'capacity', label: '容量', type: 'number', list: true, width: 90 },
  { key: 'signupCount', label: '报名数', type: 'number', list: true, width: 90 },
  { key: 'price', label: '价格', type: 'number', list: true, width: 100 },
  { key: 'description', label: '描述', type: 'textarea', list: false },
  { key: 'sort', label: '排序', type: 'number', list: true, width: 90 }
];

const statusOptions = [
  { label: '草稿', value: 'draft', type: 'default' as const },
  { label: '已发布', value: 'published', type: 'success' as const },
  { label: '已下线', value: 'offline', type: 'warning' as const },
  { label: '已结束', value: 'ended', type: 'info' as const }
];
</script>

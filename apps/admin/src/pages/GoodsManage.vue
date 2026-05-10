<template>
  <crud-page
    title="商品"
    resource="products"
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
  { key: 'price', label: '价格', type: 'number', list: true, width: 100 },
  { key: 'originalPrice', label: '原价', type: 'number', list: true, width: 100 },
  { key: 'stock', label: '库存', type: 'number', list: true, width: 90 },
  { key: 'unit', label: '单位', list: true, width: 90 },
  { key: 'tags', label: '标签', list: true, width: 160 },
  { key: 'description', label: '描述', type: 'textarea', list: false },
  { key: 'sort', label: '排序', type: 'number', list: true, width: 90 }
];

const statusOptions = [
  { label: '草稿', value: 'draft', type: 'default' as const },
  { label: '上架中', value: 'on_sale', type: 'success' as const },
  { label: '已下架', value: 'off_sale', type: 'warning' as const },
  { label: '已售罄', value: 'sold_out', type: 'error' as const }
];
</script>

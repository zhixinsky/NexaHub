<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue';
import { NButton, NCard, NDataTable, NDivider, NForm, NFormItem, NInput, NModal, NPopconfirm, NSelect, NSpace, NTag, useMessage } from 'naive-ui';
import { FolderOutline } from '@vicons/ionicons5';
import { request } from '../api/client';

type CategoryTreeItem = {
  id: string;
  pid: string;
  name: string;
  path: string;
  sort: number;
  is_enable: number | string;
  items?: CategoryTreeItem[];
};

type CategoryResponse = {
  attachment_category: CategoryTreeItem[];
};

const message = useMessage();
const loading = ref(false);
const categoryTree = ref<CategoryTreeItem[]>([]);

const createVisible = ref(false);
const creating = ref(false);
const newCategory = ref({ name: '', path: '', pid: '0', sort: 0, is_enable: '1' as '0' | '1' });

const categoryOptions = computed(() => {
  const items: Array<{ label: string; value: string }> = [{ label: '顶级分类', value: '0' }];
  const walk = (nodes: CategoryTreeItem[], prefix = '') => {
    nodes.forEach((node) => {
      items.push({ label: prefix ? `${prefix} / ${node.name}` : node.name, value: node.id });
      if (node.items?.length) walk(node.items, prefix ? `${prefix} / ${node.name}` : node.name);
    });
  };
  walk(categoryTree.value);
  return items;
});

async function fetchCategories() {
  loading.value = true;
  try {
    const res = await request<CategoryResponse>('/attachmentapi/category', { method: 'POST', body: '{}' });
    categoryTree.value = Array.isArray(res.attachment_category) ? res.attachment_category : [];
  } catch (err) {
    message.error(err instanceof Error ? err.message : '加载失败');
  } finally {
    loading.value = false;
  }
}

async function createCategory() {
  if (!newCategory.value.name.trim() || !newCategory.value.path.trim()) {
    message.warning('请填写分类名称和路径');
    return;
  }
  creating.value = true;
  try {
    await request('/attachmentapi/categorysave', {
      method: 'POST',
      body: JSON.stringify({
        pid: newCategory.value.pid,
        name: newCategory.value.name.trim(),
        path: newCategory.value.path.trim(),
        sort: Number(newCategory.value.sort) || 0,
        is_enable: newCategory.value.is_enable
      })
    });
    message.success('分类已创建');
    createVisible.value = false;
    newCategory.value = { name: '', path: '', pid: '0', sort: 0, is_enable: '1' };
    await fetchCategories();
  } catch (err) {
    message.error(err instanceof Error ? err.message : '创建失败');
  } finally {
    creating.value = false;
  }
}

async function deleteCategory(id: string) {
  try {
    await request('/attachmentapi/categorydelete', {
      method: 'POST',
      body: JSON.stringify({ id })
    });
    message.success('分类已删除');
    await fetchCategories();
  } catch (err) {
    message.error(err instanceof Error ? err.message : '删除失败');
  }
}

type CategoryRow = {
  id: string;
  pid: string;
  name: string;
  path: string;
  sort: number;
  is_enable: number | string;
  parentName: string;
};

const categoryLabelMap = computed(() => {
  const map = new Map<string, string>();
  categoryOptions.value.forEach((opt) => map.set(opt.value, opt.label));
  return map;
});

const rows = computed<CategoryRow[]>(() => {
  const list: CategoryRow[] = [];
  const walk = (nodes: CategoryTreeItem[]) => {
    nodes.forEach((node) => {
      list.push({
        id: node.id,
        pid: node.pid,
        name: node.name,
        path: node.path,
        sort: node.sort,
        is_enable: node.is_enable,
        parentName: node.pid && node.pid !== '0' ? categoryLabelMap.value.get(node.pid) || '顶级分类' : '顶级分类'
      });
      if (node.items?.length) walk(node.items);
    });
  };
  walk(categoryTree.value);
  return list;
});

const columns = computed(() => [
  {
    title: '名称',
    key: 'name',
    minWidth: 180
  },
  {
    title: '路径',
    key: 'path',
    minWidth: 220
  },
  {
    title: '父级',
    key: 'parentName',
    width: 180
  },
  {
    title: '排序',
    key: 'sort',
    width: 100
  },
  {
    title: '启用',
    key: 'is_enable',
    width: 100,
    render(row: CategoryRow) {
      const enabled = String(row.is_enable) !== '0';
      return h(NTag, { type: enabled ? 'success' : 'default', size: 'small', round: true }, { default: () => (enabled ? '启用' : '禁用') });
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 140,
    render(row: CategoryRow) {
      return h(
        NPopconfirm,
        { onPositiveClick: () => deleteCategory(row.id) },
        {
          trigger: () => h(NButton, { size: 'small', type: 'error', secondary: true }, { default: () => '删除' }),
          default: () => '确认删除该分类？'
        }
      );
    }
  }
]);

onMounted(fetchCategories);
</script>

<template>
  <div class="page-stack">
    <n-card :bordered="false" class="panel-card">
      <n-space align="center" justify="space-between" style="margin-bottom: 12px; flex-wrap: wrap">
        <n-space align="center" :size="10">
          <n-tag type="info" round>资源分类</n-tag>
          <span style="opacity: 0.75; font-size: 12px">删除分类不会删除文件，文件会变为未分组。</span>
        </n-space>
        <n-button secondary @click="createVisible = true">
          <template #icon>
            <FolderOutline />
          </template>
          新建分类
        </n-button>
      </n-space>

      <n-divider style="margin: 0 0 12px" />

      <n-data-table
        :loading="loading"
        :columns="columns"
        :data="rows"
        :pagination="false"
        :row-key="(row: CategoryRow) => row.id"
      />
    </n-card>

    <n-modal v-model:show="createVisible" preset="card" title="新建分类" style="width: 520px" :bordered="false">
      <n-form label-placement="top">
        <n-form-item label="父级分类">
          <n-select v-model:value="newCategory.pid" :options="categoryOptions" />
        </n-form-item>
        <n-form-item label="名称（必填）">
          <n-input v-model:value="newCategory.name" placeholder="例如：活动海报" />
        </n-form-item>
        <n-form-item label="路径（必填）">
          <n-input v-model:value="newCategory.path" placeholder="例如：activity/posters" />
        </n-form-item>
        <n-form-item label="排序">
          <n-input v-model:value="(newCategory.sort as any)" placeholder="数字越大越靠前" />
        </n-form-item>
        <n-form-item label="启用">
          <n-select v-model:value="newCategory.is_enable" :options="[{ label: '启用', value: '1' }, { label: '禁用', value: '0' }]" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="createVisible = false">取消</n-button>
          <n-button type="primary" :loading="creating" @click="createCategory">创建</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>


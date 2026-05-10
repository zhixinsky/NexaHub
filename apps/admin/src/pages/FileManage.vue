<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue';
import { NButton, NCard, NDataTable, NImage, NInput, NModal, NPopconfirm, NSelect, NSpace, NTag, useMessage } from 'naive-ui';
import { request } from '../api/client';
import { CloudUploadOutline, CopyOutline, TrashOutline } from '@vicons/ionicons5';

type AttachmentType = 'image' | 'video' | 'file';

type AttachmentListItem = {
  id: string;
  category_id?: string | null;
  url: string;
  original: string;
  title: string;
  ext: string;
  type: AttachmentType;
  size?: number;
  add_time?: number;
};

type AttachmentListResponse = {
  data_total: number;
  data_list: AttachmentListItem[];
};

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

const keyword = ref('');
const typeFilter = ref<'' | AttachmentType>('');
const page = ref(1);
const pageSize = ref(21);
const total = ref(0);
const rows = ref<AttachmentListItem[]>([]);
const selectedRowKeys = ref<string[]>([]);

const categoryTree = ref<CategoryTreeItem[]>([]);
const categoryId = ref('');
const moveCategoryId = ref('');

const typeOptions = [
  { label: '全部', value: '' },
  { label: '图片', value: 'image' },
  { label: '视频', value: 'video' },
  { label: '文件', value: 'file' }
] as const;

const categoryOptions = computed(() => {
  const items: Array<{ label: string; value: string }> = [{ label: '全部分类', value: '' }];
  const walk = (nodes: CategoryTreeItem[], prefix = '') => {
    nodes.forEach((node) => {
      items.push({ label: prefix ? `${prefix} / ${node.name}` : node.name, value: node.id });
      if (node.items?.length) walk(node.items, prefix ? `${prefix} / ${node.name}` : node.name);
    });
  };
  walk(categoryTree.value);
  return items;
});

const categoryLabelMap = computed(() => {
  const map = new Map<string, string>();
  categoryOptions.value.slice(1).forEach((opt) => map.set(opt.value, opt.label));
  return map;
});

function formatBytes(size?: number) {
  if (!size || size <= 0) return '-';
  const units = ['B', 'KB', 'MB', 'GB'];
  let idx = 0;
  let v = size;
  while (v >= 1024 && idx < units.length - 1) {
    v /= 1024;
    idx++;
  }
  return `${v.toFixed(idx === 0 ? 0 : 2)} ${units[idx]}`;
}

function typeTag(type: AttachmentType) {
  if (type === 'image') return { label: '图片', tag: 'success' as const };
  if (type === 'video') return { label: '视频', tag: 'warning' as const };
  return { label: '文件', tag: 'default' as const };
}

const uploadVisible = ref(false);
const uploading = ref(false);
const uploadType = ref<'image' | 'video' | 'file'>('image');
const uploadCategoryId = ref('');
const uploadFiles = ref<File[]>([]);

const videoPreviewVisible = ref(false);
const videoPreviewUrl = ref('');

function onUploadFilesChange(event: Event) {
  const input = event.target as HTMLInputElement;
  uploadFiles.value = input.files ? Array.from(input.files) : [];
}

async function doUpload() {
  if (uploadFiles.value.length < 1) {
    message.warning('请选择文件');
    return;
  }
  uploading.value = true;
  try {
    for (const file of uploadFiles.value) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('originalname', file.name);
      if (uploadCategoryId.value) {
        formData.append('category_id', uploadCategoryId.value);
      }
      const response = await fetch(`/upload/${uploadType.value}`, {
        method: 'POST',
        body: formData
      });
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(text || `上传失败（HTTP ${response.status}）`);
      }
    }
    message.success('上传成功');
    uploadVisible.value = false;
    uploadFiles.value = [];
    uploadCategoryId.value = '';
    await fetchList();
  } catch (err) {
    message.error(err instanceof Error ? err.message : '上传失败');
  } finally {
    uploading.value = false;
  }
}

function formatTime(unixSeconds?: number) {
  if (!unixSeconds) return '-';
  const d = new Date(unixSeconds * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    message.success('已复制 URL');
  } catch {
    message.error('复制失败（请检查浏览器权限）');
  }
}

async function fetchCategories() {
  const res = await request<CategoryResponse>('/attachmentapi/category', { method: 'POST', body: '{}' });
  categoryTree.value = Array.isArray(res.attachment_category) ? res.attachment_category : [];
}

async function fetchList() {
  loading.value = true;
  try {
    const res = await request<AttachmentListResponse>('/attachmentapi/list', {
      method: 'POST',
      body: JSON.stringify({
        page: page.value,
        page_size: pageSize.value,
        type: typeFilter.value || '',
        keywords: keyword.value,
        category_id: categoryId.value
      })
    });
    total.value = res.data_total || 0;
    rows.value = Array.isArray(res.data_list) ? res.data_list : [];
  } catch (err) {
    message.error(err instanceof Error ? err.message : '加载失败');
  } finally {
    loading.value = false;
  }
}

async function remove(id: string) {
  try {
    await request('/attachmentapi/delete', {
      method: 'POST',
      body: JSON.stringify({ ids: id })
    });
    message.success('已删除');
    await fetchList();
  } catch (err) {
    message.error(err instanceof Error ? err.message : '删除失败');
  }
}

async function removeSelected() {
  if (selectedRowKeys.value.length < 1) {
    message.warning('请先选择文件');
    return;
  }
  try {
    await request('/attachmentapi/delete', {
      method: 'POST',
      body: JSON.stringify({ ids: selectedRowKeys.value.join(',') })
    });
    message.success('已删除');
    selectedRowKeys.value = [];
    await fetchList();
  } catch (err) {
    message.error(err instanceof Error ? err.message : '删除失败');
  }
}

async function moveSelected() {
  if (selectedRowKeys.value.length < 1) {
    message.warning('请先选择文件');
    return;
  }
  if (!moveCategoryId.value) {
    message.warning('请选择目标分类');
    return;
  }
  try {
    await request('/attachmentapi/movecategory', {
      method: 'POST',
      body: JSON.stringify({ ids: selectedRowKeys.value.join(','), category_id: moveCategoryId.value })
    });
    message.success('已移动');
    selectedRowKeys.value = [];
    moveCategoryId.value = '';
    await fetchList();
  } catch (err) {
    message.error(err instanceof Error ? err.message : '移动失败');
  }
}

const columns = computed(() => [
  {
    type: 'selection' as const
  },
  {
    title: '缩略图',
    key: 'thumb',
    width: 72,
    minWidth: 72,
    maxWidth: 72,
    render(row: AttachmentListItem) {
      if (row.type === 'image') {
        return h(NImage, {
          src: row.url,
          width: 64,
          height: 64,
          objectFit: 'cover',
          previewDisabled: false
        });
      }
      if (row.type === 'video') {
        return h(
          'div',
          {
            style: 'position:relative;width:64px;height:64px;cursor:pointer;',
            onClick: () => {
              videoPreviewUrl.value = row.url;
              videoPreviewVisible.value = true;
            }
          },
          [
            h('video', {
              src: row.url,
              muted: true,
              preload: 'metadata',
              playsInline: true,
              style: 'width:64px;height:64px;object-fit:cover;border-radius:6px;display:block;background:#111;',
            }),
            h(
              'div',
              {
                style:
                  'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;background:rgba(0,0,0,0.15);border-radius:6px;'
              },
              '▶'
            )
          ]
        );
      }
      return '-';
    }
  },
  {
    title: '文件名',
    key: 'original',
    width: 260,
    render(row: AttachmentListItem) {
      return h('div', { style: 'font-weight:600;' }, row.original || row.title || row.id);
    }
  },
  {
    title: '类型',
    key: 'type',
    width: 80,
    render(row: AttachmentListItem) {
      const info = typeTag(row.type);
      return h(NTag, { type: info.tag, size: 'small', round: true }, { default: () => info.label });
    }
  },
  {
    title: '分类',
    key: 'category',
    width: 80,
    render(row: AttachmentListItem) {
      const id = row.category_id || '';
      return id ? categoryLabelMap.value.get(id) || '未分组' : '未分组';
    }
  },
  {
    title: '大小',
    key: 'size',
    width: 80,
    render(row: AttachmentListItem) {
      return formatBytes(row.size);
    }
  },
  {
    title: '上传时间',
    key: 'add_time',
    width: 80,
    render(row: AttachmentListItem) {
      return formatTime(row.add_time);
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    render(row: AttachmentListItem) {
      return h(
        NSpace,
        { size: 8 },
        {
          default: () => [
            h(
              NButton,
              { size: 'small', secondary: true, onClick: () => copyText(row.url) },
              { icon: () => h(CopyOutline), default: () => '复制' }
            ),
            h(
              NPopconfirm,
              { onPositiveClick: () => remove(row.id) },
              {
                trigger: () =>
                  h(
                    NButton,
                    { size: 'small', type: 'error', secondary: true },
                    { icon: () => h(TrashOutline), default: () => '删除' }
                  ),
                default: () => '确认删除该文件？'
              }
            )
          ]
        }
      );
    }
  }
]);

onMounted(async () => {
  await fetchCategories();
  await fetchList();
});
</script>

<template>
  <div class="page-stack">
    <n-card :bordered="false" class="panel-card">
      <n-space align="center" :size="12" style="margin-bottom: 12px; flex-wrap: wrap">
        <n-input
          v-model:value="keyword"
          placeholder="搜索文件名"
          clearable
          style="width: 260px"
          @keyup.enter="() => (page = 1, fetchList())"
        />
        <n-select v-model:value="typeFilter" :options="typeOptions" style="width: 180px" @update:value="() => (page = 1, fetchList())" />
        <n-select v-model:value="categoryId" :options="categoryOptions" style="width: 240px" @update:value="() => (page = 1, fetchList())" />
        <n-button secondary :loading="loading" @click="() => (page = 1, fetchList())">查询</n-button>
        <n-button secondary @click="uploadVisible = true">
          <template #icon>
            <CloudUploadOutline />
          </template>
          上传
        </n-button>
        <span style="width: 2px; height: 28px; background: #cbd5e1; display: inline-block; margin: 4px 10px 0; align-self: center; border-radius: 1px;" />
        <n-select v-model:value="moveCategoryId" :options="categoryOptions" style="width: 240px" placeholder="选择目标分类" />
        <n-button secondary :disabled="selectedRowKeys.length < 1" @click="moveSelected">移动到分类</n-button>
        <n-popconfirm @positive-click="removeSelected">
          <template #trigger>
            <n-button type="error" secondary :disabled="selectedRowKeys.length < 1">批量删除</n-button>
          </template>
          确认删除选中文件？
        </n-popconfirm>
      </n-space>

      <n-data-table
        :loading="loading"
        :columns="columns"
        :data="rows"
        table-layout="fixed"
        :row-key="(row: AttachmentListItem) => row.id"
        v-model:checked-row-keys="selectedRowKeys"
        :pagination="{
          page,
          pageSize,
          itemCount: total,
          pageSizes: [10, 21, 50, 100],
          showSizePicker: true,
          onUpdatePage: (p: number) => { page = p; fetchList(); },
          onUpdatePageSize: (s: number) => { pageSize = s; page = 1; fetchList(); }
        }"
        remote
      />
    </n-card>

    <n-modal v-model:show="videoPreviewVisible" preset="card" title="视频预览" style="width: 860px" :bordered="false">
      <video :src="videoPreviewUrl" controls autoplay style="width: 100%; max-height: 70vh; border-radius: 10px; background: #111" />
    </n-modal>

    <n-modal v-model:show="uploadVisible" preset="card" title="上传文件" style="width: 560px" :bordered="false">
      <n-space vertical :size="12">
        <n-space align="center" :size="12" style="flex-wrap: wrap">
          <span style="width: 64px; opacity: 0.75">类型</span>
          <n-select
            v-model:value="uploadType"
            style="width: 200px"
            :options="[
              { label: '图片', value: 'image' },
              { label: '视频', value: 'video' },
              { label: '文件', value: 'file' }
            ]"
          />
        </n-space>

        <n-space align="center" :size="12" style="flex-wrap: wrap">
          <span style="width: 64px; opacity: 0.75">分类</span>
          <n-select v-model:value="uploadCategoryId" :options="categoryOptions" style="width: 360px" placeholder="可选" />
        </n-space>

        <n-space align="center" :size="12" style="flex-wrap: wrap">
          <span style="width: 64px; opacity: 0.75">文件</span>
          <input type="file" multiple @change="onUploadFilesChange" />
        </n-space>

        <div style="font-size: 12px; opacity: 0.7">
          提示：目前上传会统一进入资源库；分类写入将在后端支持后补上（已预留选择项）。
        </div>
      </n-space>

      <template #footer>
        <n-space justify="end">
          <n-button @click="uploadVisible = false">取消</n-button>
          <n-button type="primary" :loading="uploading" @click="doUpload">开始上传</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<style scoped>
:deep(.n-data-table .n-data-table-td) {
  padding-top: 6px;
  padding-bottom: 6px;
}
</style>


<script setup lang="ts">
import { computed, h, onMounted, reactive, ref, shallowRef, watch } from 'vue';
import type { DataTableColumns, SelectOption } from 'naive-ui';
import { NButton, NPopconfirm, NSelect, NSpace, NTag, useMessage } from 'naive-ui';
import { buildQuery, request, type ListResponse } from '../api/client';

type FieldType = 'text' | 'textarea' | 'number' | 'datetime' | 'select';

export type CrudField = {
  key: string;
  label: string;
  type?: FieldType;
  list?: boolean;
  required?: boolean;
  width?: number;
  options?: SelectOption[];
};

type StatusOption = {
  label: string;
  value: string;
  type?: 'default' | 'success' | 'warning' | 'error' | 'info';
};

type RowData = Record<string, string | number | null | undefined>;

/** 列表「路径」列 + 操作「复制链接」 */
export type ListCopyLinkConfig = {
  columnTitle?: string;
  columnWidth?: number;
  getPathLabel: (row: RowData) => string;
  getFullUrl: (row: RowData) => string;
};

/** Naive DataTable 的 rowKey 必须是函数；字符串会被当成可调用 getKey 使用，导致 treemate 建表失败、列表不渲染 */
function tableRowKey(row: RowData): string {
  return String(row.id ?? '');
}

const props = defineProps<{
  title: string;
  resource: string;
  fields: CrudField[];
  statusOptions: StatusOption[];
  editorPath?: string;
  /** 状态列仅用标签展示，不在表格内切换 */
  readonlyStatusColumn?: boolean;
  /** 操作列追加「发布」「下架」（PATCH /resource/:id/status） */
  showLifecycleActions?: boolean;
  /** 列表增加路径列，并在操作区增加「复制链接」 */
  listCopyLink?: ListCopyLinkConfig;
}>();

const message = useMessage();
const loading = ref(false);
const saving = ref(false);
const modalVisible = ref(false);
const editingId = ref('');
const rows = ref<RowData[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const search = ref('');
/** 列表状态筛选：固定用 `'all'` 表示「全部」，避免 Naive Select 对 null/'' 异常绑定到真实状态导致列表被滤空 */
const LIST_STATUS_ALL = 'all' as const;
const status = ref<string>(LIST_STATUS_ALL);
const form = reactive<RowData>({});

/** 固定引用，避免每次 render 新数组导致 NSelect 反复触发 update → 无限请求 */
const toolbarStatusOptions = shallowRef<SelectOption[]>([]);
watch(
  () => props.statusOptions,
  (opts) => {
    toolbarStatusOptions.value = [{ label: '全部状态', value: LIST_STATUS_ALL }, ...opts];
  },
  { immediate: true }
);

function onToolbarStatusChange(v: string | null) {
  const next = v == null || v === '' ? LIST_STATUS_ALL : v;
  if (next === status.value) return;
  status.value = next;
  handleSearch();
}

const listFields = computed(() => props.fields.filter((field) => field.list !== false));
const modalTitle = computed(() => (editingId.value ? `编辑${props.title}` : `新增${props.title}`));

const statusMap = computed(() => {
  return props.statusOptions.reduce<Record<string, StatusOption>>((map, item) => {
    map[item.value] = item;
    return map;
  }, {});
});

const actionColumnWidth = computed(() => {
  let width = 100;
  if (props.editorPath) width += 72;
  if (props.showLifecycleActions) width += 148;
  if (props.listCopyLink) width += 92;
  return width + 76;
});

const pathColumnWidth = computed(() => props.listCopyLink?.columnWidth ?? 260);

const columnsScrollX = computed(() => {
  const sumList = listFields.value.reduce((s, f) => s + (f.width ?? 120), 0);
  const pathW = props.listCopyLink ? pathColumnWidth.value : 0;
  const statusW = 150;
  return sumList + pathW + statusW + actionColumnWidth.value + 40;
});

const columns = computed<DataTableColumns<RowData>>(() => {
  const listCols = listFields.value.map((field) => ({
    title: field.label,
    key: field.key,
    width: field.width,
    ellipsis: {
      tooltip: true
    },
    render(row: RowData) {
      const value = row[field.key];
      if (field.type === 'datetime') {
        return formatDate(value);
      }
      return value === null || value === undefined || value === '' ? '-' : String(value);
    }
  }));

  const pathCols: DataTableColumns<RowData> = props.listCopyLink
    ? [
        {
          title: props.listCopyLink.columnTitle ?? '页面路径',
          key: '__nexa_path__',
          width: pathColumnWidth.value,
          ellipsis: { tooltip: true },
          render(row: RowData) {
            return props.listCopyLink!.getPathLabel(row);
          }
        }
      ]
    : [];

  return [
    ...listCols,
    ...pathCols,
    {
      title: '状态',
      key: 'status',
      width: 150,
      render(row: RowData) {
        if (props.readonlyStatusColumn) {
          const s = String(row.status || '');
          const opt = statusMap.value[s];
          return h(NTag, { type: opt?.type || 'default', size: 'small' }, { default: () => opt?.label || s || '-' });
        }
        return h(NSelect, {
          value: String(row.status || ''),
          size: 'small',
          options: props.statusOptions,
          onUpdateValue: (value: string) => updateStatus(row.id as string, value)
        });
      }
    },
    {
      title: '操作',
    key: 'actions',
    width: actionColumnWidth.value,
    fixed: 'right',
    render(row: RowData) {
      const actions = [
        h(
          NButton,
          {
            size: 'small',
            secondary: true,
            onClick: () => openEdit(row)
          },
          { default: () => '编辑' }
        ),
        ...(props.editorPath
          ? [
              h(
                NButton,
                {
                  size: 'small',
                  type: 'primary',
                  secondary: true,
                  onClick: () => openEditor(row)
                },
                { default: () => '装修' }
              )
            ]
          : []),
        ...(props.showLifecycleActions
          ? [
              h(
                NButton,
                {
                  size: 'small',
                  type: 'success',
                  secondary: true,
                  disabled: String(row.status) === 'published',
                  onClick: () => updateStatus(row.id as string, 'published')
                },
                { default: () => '发布' }
              ),
              h(
                NButton,
                {
                  size: 'small',
                  type: 'warning',
                  secondary: true,
                  disabled: String(row.status) !== 'published',
                  onClick: () => updateStatus(row.id as string, 'offline')
                },
                { default: () => '下架' }
              )
            ]
          : []),
        ...(props.listCopyLink
          ? [
              h(
                NButton,
                {
                  size: 'small',
                  secondary: true,
                  onClick: () => copyPreviewLink(row)
                },
                { default: () => '复制链接' }
              )
            ]
          : []),
        h(
          NPopconfirm,
          {
            onPositiveClick: () => remove(row.id as string)
          },
          {
            trigger: () =>
              h(
                NButton,
                {
                  size: 'small',
                  type: 'error',
                  secondary: true
                },
                { default: () => '删除' }
              ),
            default: () => '确认删除？'
          }
        )
      ];

      return h(NSpace, { size: 8, wrap: false }, () => actions);
    }
  }
  ];
});

function getDefaultValue(field: CrudField) {
  if (field.key === 'status') {
    return props.statusOptions[0]?.value || '';
  }
  if (field.type === 'number') {
    return 0;
  }
  if (field.type === 'select') {
    return String(field.options?.[0]?.value || '');
  }
  return '';
}

function resetForm() {
  props.fields.forEach((field) => {
    form[field.key] = getDefaultValue(field);
  });
  form.status = props.statusOptions[0]?.value || '';
  editingId.value = '';
}

function normalizeFormData() {
  return props.fields.reduce<RowData>(
    (data, field) => {
      const value = form[field.key];
      data[field.key] = field.type === 'number' ? Number(value || 0) : value;
      return data;
    },
    { status: form.status }
  );
}

let fetchListSeq = 0;

function isAbortError(err: unknown): boolean {
  return (
    (typeof DOMException !== 'undefined' && err instanceof DOMException && err.name === 'AbortError') ||
    (err instanceof Error && err.name === 'AbortError')
  );
}

async function fetchList() {
  const seq = ++fetchListSeq;
  const ctrl = new AbortController();
  const tid = window.setTimeout(() => ctrl.abort(), 25_000);
  loading.value = true;
  try {
    const query = buildQuery({
      page: page.value,
      pageSize: pageSize.value,
      search: search.value,
      status: status.value !== LIST_STATUS_ALL ? status.value : undefined
    });
    const data = await request<ListResponse<RowData>>(`/${props.resource}${query}`, { signal: ctrl.signal });
    if (seq !== fetchListSeq) return;

    const items = Array.isArray(data?.items) ? data.items : [];
    rows.value = items.map((item) => ({ ...(item as object) } as RowData));
    total.value = Number(data?.total) || 0;
    /** 不再把服务端回传的 page/pageSize 写回，避免与 NPagination 受控状态互相触发额外请求 */
  } catch (err) {
    if (seq !== fetchListSeq) return;
    if (isAbortError(err)) {
      message.error('列表请求超时或已中断，请确认 API 已启动，并检查 VITE_API_BASE_URL / 代理');
      return;
    }
    message.error(err instanceof Error ? err.message : '列表加载失败');
  } finally {
    window.clearTimeout(tid);
    if (seq === fetchListSeq) loading.value = false;
  }
}

function openCreate() {
  resetForm();
  modalVisible.value = true;
}

function openEdit(row: RowData) {
  resetForm();
  editingId.value = String(row.id);
  props.fields.forEach((field) => {
    form[field.key] = field.type === 'datetime' ? toDateTimeInput(row[field.key]) : row[field.key];
  });
  form.status = row.status;
  modalVisible.value = true;
}

function openEditor(row: RowData) {
  if (!props.editorPath) {
    return;
  }

  const base = String(props.editorPath).replace(/[?]$/, '').replace(/\/$/, '');
  const url = `${base}?pageId=${encodeURIComponent(String(row.id))}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

async function copyPreviewLink(row: RowData) {
  const cfg = props.listCopyLink;
  if (!cfg) return;
  const text = cfg.getFullUrl(row);
  try {
    await navigator.clipboard.writeText(text);
    message.success('预览链接已复制');
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      message.success('预览链接已复制');
    } catch {
      message.error('复制失败，请手动复制「页面路径」列');
    }
  }
}

async function save() {
  saving.value = true;
  const wasCreate = !editingId.value;
  const codeSnapshot = String(form.code ?? '').trim();
  try {
    const data = normalizeFormData();
    if (editingId.value) {
      await request(`/${props.resource}/${editingId.value}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      });
      message.success('保存成功');
    } else {
      await request(`/${props.resource}`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      message.success('新增成功');
    }
    modalVisible.value = false;
    if (wasCreate) {
      page.value = 1;
      search.value = '';
      status.value = LIST_STATUS_ALL;
    }
    await fetchList();
  } catch (err) {
    const msg = err instanceof Error ? err.message : '保存失败';
    message.error(msg);

    const conflict =
      wasCreate && (/已存在|重复|unique/i.test(msg) || /P2002/i.test(msg));
    if (conflict) {
      modalVisible.value = false;
      page.value = 1;
      status.value = LIST_STATUS_ALL;
      if (codeSnapshot) {
        search.value = codeSnapshot;
      }
      await fetchList();
    }
  } finally {
    saving.value = false;
  }
}

async function remove(id: string) {
  try {
    await request(`/${props.resource}/${id}`, { method: 'DELETE' });
    message.success('删除成功');
    await fetchList();
  } catch (err) {
    message.error(err instanceof Error ? err.message : '删除失败');
  }
}

async function updateStatus(id: string, nextStatus: string) {
  try {
    await request(`/${props.resource}/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: nextStatus })
    });
    const option = statusMap.value[nextStatus];
    message.success(`状态已切换为${option?.label || nextStatus}`);
    await fetchList();
  } catch (err) {
    message.error(err instanceof Error ? err.message : '状态切换失败');
  }
}

function handleSearch() {
  page.value = 1;
  void fetchList();
}

function handlePageChange(nextPage: number) {
  const n = Math.trunc(Number(nextPage));
  const next = Number.isFinite(n) && n > 0 ? n : 1;
  if (next === page.value) return;
  page.value = next;
  void fetchList();
}

function handlePageSizeChange(nextPageSize: number) {
  const n = Math.trunc(Number(nextPageSize));
  const next = Number.isFinite(n) && n > 0 ? Math.min(100, n) : 10;
  if (next === pageSize.value) return;
  pageSize.value = next;
  page.value = 1;
  void fetchList();
}

function formatDate(value: unknown) {
  if (!value) {
    return '-';
  }
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return date.toLocaleString();
}

function toDateTimeInput(value: unknown) {
  if (!value) {
    return '';
  }
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

onMounted(() => {
  resetForm();
  fetchList();
});
</script>

<template>
  <div class="page-stack">
    <n-card :bordered="false" class="panel-card">
      <div class="toolbar">
        <n-space align="center" :size="12">
          <n-input
            v-model:value="search"
            clearable
            placeholder="搜索标题、分类等"
            class="toolbar-search"
            @keyup.enter="handleSearch"
          />
          <n-select
            :value="status"
            class="toolbar-status"
            clearable
            placeholder="全部状态"
            :options="toolbarStatusOptions"
            @update:value="onToolbarStatusChange"
          />
          <n-button secondary @click="handleSearch">搜索</n-button>
        </n-space>

        <n-button type="primary" @click="openCreate">新增{{ title }}</n-button>
      </div>
    </n-card>

    <n-card :bordered="false" class="panel-card">
      <n-data-table
        :columns="columns"
        :data="rows"
        :loading="loading"
        :pagination="false"
        :scroll-x="columnsScrollX"
        :row-key="tableRowKey"
      />

      <div class="table-footer">
        <n-pagination
          :page="page"
          :page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :item-count="total"
          show-size-picker
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange"
        />
      </div>
    </n-card>

    <n-modal
      v-model:show="modalVisible"
      preset="card"
      :title="modalTitle"
      class="crud-modal"
      :bordered="false"
    >
      <n-form label-placement="top">
        <n-grid :cols="2" :x-gap="16">
          <n-grid-item v-for="field in fields" :key="field.key" :span="field.type === 'textarea' ? 2 : 1">
            <n-form-item :label="field.label" :required="field.required">
              <n-input-number
                v-if="field.type === 'number'"
                v-model:value="form[field.key]"
                class="form-control"
                :min="0"
              />
              <n-input
                v-else-if="field.type === 'textarea'"
                v-model:value="form[field.key]"
                type="textarea"
                :autosize="{ minRows: 4, maxRows: 8 }"
              />
              <n-input
                v-else-if="field.type === 'datetime'"
                v-model:value="form[field.key]"
                type="datetime-local"
              />
              <n-select
                v-else-if="field.type === 'select'"
                v-model:value="form[field.key]"
                :options="field.options || []"
              />
              <n-input v-else v-model:value="form[field.key]" />
            </n-form-item>
          </n-grid-item>

          <n-grid-item>
            <n-form-item label="状态">
              <n-select v-model:value="form.status" :options="statusOptions" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
      </n-form>

      <template #footer>
        <n-space justify="end">
          <n-button @click="modalVisible = false">取消</n-button>
          <n-button type="primary" :loading="saving" @click="save">保存</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

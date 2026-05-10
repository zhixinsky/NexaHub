<template>
  <div class="link-picker">
    <!-- 与 shopxo url-value 一致：点击整行打开弹窗选择链接 -->
    <div
      :class="['flex-row align-c gap-10 br-d radius-sm plr-11 link-picker-trigger', !disabled ? 'c-pointer' : '']"
      @click="!disabled && openDialog()"
    >
      <div class="flex-1 flex-width size-12 text-line-1">
        <span v-if="hasLink">{{ summaryText }}</span>
        <span v-else class="cr-9">{{ placeholder }}</span>
      </div>
      <div class="value-input-icon">
        <template v-if="!hasLink">
          <icon name="arrow-right" size="12" color="9"></icon>
        </template>
        <template v-else>
          <div v-if="!disabled" @click.stop="clearLink">
            <icon name="close-fillup" size="12" color="c"></icon>
          </div>
        </template>
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      class="radius-lg link-picker-dialog"
      width="960"
      draggable
      append-to-body
      :close-on-click-modal="false"
      :top="dialogPositionTop ? `${dialogPositionTop}px` : ''"
      @closed="onDialogClosed"
    >
      <template #header>
        <div class="tc size-16 fw-b">选择链接</div>
      </template>
      <div class="link-picker-body pa-20 flex-row">
        <div class="left-menu br-none">
          <el-menu :key="menuMountKey" :default-active="menuActive" class="w" @select="onMenuSelect">
            <el-menu-item v-for="opt in MENU_OPTIONS" :key="opt.value" :index="opt.value">
              <span>{{ opt.label }}</span>
            </el-menu-item>
          </el-menu>
        </div>
        <div class="right-panel flex-1">
          <el-form label-position="top" size="default" class="pr-10">
            <el-form-item v-if="draft.type !== 'none'" label="展示名称（可选）">
              <el-input v-model="draft.label" placeholder="列表中简短说明" clearable />
            </el-form-item>

            <template v-if="draft.type === 'none'">
              <div class="hint">当前为「不跳转」，保存后点击不会跳转。</div>
            </template>

            <template v-else-if="draft.type === 'home'">
              <el-form-item label="页面编码（默认 home）">
                <el-input v-model="codeHome" placeholder="home" clearable />
              </el-form-item>
            </template>

            <template v-else-if="draft.type === 'custom_page'">
              <el-form-item label="选择已发布页面">
                <el-select
                  v-model="pageCodeSelect"
                  filterable
                  clearable
                  placeholder="加载页面列表…"
                  class="w-full"
                  @change="onPageSelect"
                >
                  <el-option v-for="p in pages" :key="p.id" :label="`${p.name}（${p.code}）`" :value="p.code" />
                </el-select>
              </el-form-item>
              <el-form-item label="或手动输入编码">
                <el-input v-model="pageCodeManual" placeholder="如 home、about" clearable />
              </el-form-item>
            </template>

            <template
              v-else-if="
                draft.type === 'content_detail' || draft.type === 'activity_detail' || draft.type === 'product_detail'
              "
            >
              <el-form-item label="记录 ID">
                <el-input v-model="detailId" placeholder="内容/活动/商品 id" clearable />
              </el-form-item>
            </template>

            <template v-else-if="draft.type === 'external'">
              <el-form-item label="URL">
                <el-input v-model="externalUrl" type="textarea" :rows="3" placeholder="https://..." clearable />
              </el-form-item>
            </template>

            <template v-else-if="draft.type === 'custom_path'">
              <el-form-item label="路径（含查询）">
                <el-input v-model="customPath" type="textarea" :rows="3" placeholder="/pages/xxx 或 /pages/xxx?a=1" clearable />
              </el-form-item>
            </template>

            <template v-else-if="draft.type === 'phone'">
              <el-form-item label="电话号码">
                <el-input v-model="phoneNum" placeholder="手机号" clearable />
              </el-form-item>
            </template>

            <template v-else-if="draft.type === 'map'">
              <el-form-item label="地点名称">
                <el-input v-model="mapName" placeholder="显示名称" clearable />
              </el-form-item>
              <el-form-item label="纬度 / 经度（可选，App 打开地图）">
                <div class="flex gap-8">
                  <el-input v-model="mapLat" placeholder="纬度" clearable />
                  <el-input v-model="mapLng" placeholder="经度" clearable />
                </div>
              </el-form-item>
              <el-form-item label="或地址关键词（H5 高德检索）">
                <el-input v-model="mapAddress" placeholder="省市区 + 详细地址" clearable />
              </el-form-item>
            </template>

            <template v-else-if="isListType(draft.type)">
              <div class="hint">此类型无需填写额外参数，点击「确定」即可。</div>
            </template>
          </el-form>
        </div>
      </div>
      <template #footer>
        <el-button @click="cancelDialog">取消</el-button>
        <el-button type="primary" @click="confirmDialog">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { cloneDeep } from 'lodash';
import { computed, reactive, ref, watch } from 'vue';
import { listPagesForPicker, type NexaHubPage } from '@/api/nexahub-page';
import { emptyNexaLink, NEXA_LINK_TYPE_OPTIONS, type NexaLink, type NexaLinkType } from '@/types/nexa-link';
import { is_obj_empty } from '@/utils';

const props = withDefaults(
  defineProps<{
    placeholder?: string;
    disabled?: boolean;
    dialogPositionTop?: number;
  }>(),
  {
    placeholder: '请选择链接',
    disabled: false,
    dialogPositionTop: 0
  }
);

const modelValue = defineModel<NexaLink>({ default: () => emptyNexaLink() });

/** 左侧菜单：含「不跳转」，与 shopxo 左侧分类切换一致 */
const MENU_OPTIONS = NEXA_LINK_TYPE_OPTIONS;

const dialogVisible = ref(false);
const draft = reactive<NexaLink>(emptyNexaLink());
const menuActive = ref<NexaLinkType>('none');
/** 弹窗每次打开重挂 el-menu，保证 default-active 与左侧高亮一致 */
const menuMountKey = ref(0);

const pages = ref<NexaHubPage[]>([]);
const pageCodeSelect = ref('');
const pageCodeManual = ref('');
const detailId = ref('');
const externalUrl = ref('');
const customPath = ref('');
const phoneNum = ref('');
const mapName = ref('');
const mapLat = ref('');
const mapLng = ref('');
const mapAddress = ref('');
const codeHome = ref('home');

const hasLink = computed(() => {
  const v = modelValue.value;
  return v && typeof v === 'object' && String(v.type || 'none') !== 'none';
});

const summaryText = computed(() => {
  const v = modelValue.value;
  if (!v || String(v.type || 'none') === 'none') return '';
  if (v.label?.trim()) return v.label.trim();
  const opt = NEXA_LINK_TYPE_OPTIONS.find((o) => o.value === v.type);
  const base = opt?.label || v.type;
  const p = v.params || {};
  if (v.type === 'home') return `${base} · ${String(p.code || 'home')}`;
  if (v.type === 'custom_page') return `${base} · ${String(p.pageCode || p.code || '')}`;
  if (v.type?.endsWith('_detail')) return `${base} · id=${String(p.id || '')}`;
  if (v.type === 'external') return String(p.url || '').slice(0, 48) + (String(p.url || '').length > 48 ? '…' : '');
  if (v.type === 'custom_path') return String(p.path || '').slice(0, 48);
  if (v.type === 'phone') return String(p.phone || '');
  if (v.type === 'map') return String(p.name || p.address || '地图');
  return base;
});

function isListType(t: NexaLinkType) {
  return ['content_list', 'activity_list', 'product_list'].includes(t);
}

function hydrateFromDraft() {
  const p = draft.params || {};
  codeHome.value = String(p.code ?? 'home') || 'home';
  pageCodeSelect.value = '';
  pageCodeManual.value = String(p.pageCode ?? p.code ?? '');
  detailId.value = String(p.id ?? '');
  externalUrl.value = String(p.url ?? '');
  customPath.value = String(p.path ?? '');
  phoneNum.value = String(p.phone ?? '');
  mapName.value = String(p.name ?? '');
  mapLat.value = p.latitude != null ? String(p.latitude) : '';
  mapLng.value = p.longitude != null ? String(p.longitude) : '';
  mapAddress.value = String(p.address ?? '');
}

function applyFieldRefsToDraftParams() {
  const t = draft.type;
  let params: Record<string, unknown> = {};
  switch (t) {
    case 'none':
      params = {};
      break;
    case 'home':
      params = { code: codeHome.value.trim() || 'home' };
      break;
    case 'custom_page': {
      const code = (pageCodeSelect.value || pageCodeManual.value).trim();
      params = { pageCode: code };
      break;
    }
    case 'content_detail':
    case 'activity_detail':
    case 'product_detail':
      params = { id: detailId.value.trim() };
      break;
    case 'external':
      params = { url: externalUrl.value.trim() };
      break;
    case 'custom_path':
      params = { path: customPath.value.trim() };
      break;
    case 'phone':
      params = { phone: phoneNum.value.trim() };
      break;
    case 'map': {
      const lat = parseFloat(mapLat.value);
      const lng = parseFloat(mapLng.value);
      params = {
        name: mapName.value.trim(),
        address: mapAddress.value.trim(),
        ...(Number.isFinite(lat) ? { latitude: lat } : {}),
        ...(Number.isFinite(lng) ? { longitude: lng } : {})
      };
      break;
    }
    default:
      params = {};
  }
  draft.params = params;
}

function onMenuSelect(index: string) {
  const next = index as NexaLinkType;
  draft.type = next;
  draft.params = {};
  if (next === 'none') {
    draft.label = '';
  }
  menuActive.value = next;
  hydrateFromDraft();
  if (next === 'custom_page' && pages.value.length === 0) {
    void loadPages();
  }
}

function onPageSelect(code: string) {
  pageCodeManual.value = code || '';
}

function validateDraft(): boolean {
  const t = draft.type;
  if (t === 'none') return true;
  applyFieldRefsToDraftParams();
  if (t === 'custom_page' && !String(draft.params.pageCode || '').trim()) {
    ElMessage.warning('请填写或选择页面编码');
    return false;
  }
  if ((t === 'content_detail' || t === 'activity_detail' || t === 'product_detail') && !String(draft.params.id || '').trim()) {
    ElMessage.warning('请填写记录 ID');
    return false;
  }
  if (t === 'external' && !String(draft.params.url || '').trim()) {
    ElMessage.warning('请填写 URL');
    return false;
  }
  if (t === 'custom_path' && !String(draft.params.path || '').trim()) {
    ElMessage.warning('请填写路径');
    return false;
  }
  if (t === 'phone' && !String(draft.params.phone || '').trim()) {
    ElMessage.warning('请填写电话号码');
    return false;
  }
  if (t === 'map') {
    const hasLoc = Number.isFinite(Number(draft.params.latitude)) && Number.isFinite(Number(draft.params.longitude));
    const addr = String(draft.params.address || '').trim();
    if (!hasLoc && !addr) {
      ElMessage.warning('请填写经纬度或地址');
      return false;
    }
  }
  return true;
}

function openDialog() {
  Object.assign(draft, cloneDeep(modelValue.value || emptyNexaLink()));
  if (!draft.params || typeof draft.params !== 'object') draft.params = {};
  menuActive.value = draft.type || 'none';
  menuMountKey.value += 1;
  hydrateFromDraft();
  dialogVisible.value = true;
  void loadPages();
}

function cancelDialog() {
  dialogVisible.value = false;
}

function confirmDialog() {
  applyFieldRefsToDraftParams();
  if (!validateDraft()) return;
  modelValue.value = {
    type: draft.type,
    label: (draft.label || '').trim(),
    params: { ...draft.params }
  };
  dialogVisible.value = false;
}

function onDialogClosed() {
  // 重置为当前已保存值，避免下次打开残留未确认编辑
  Object.assign(draft, cloneDeep(modelValue.value || emptyNexaLink()));
}

function clearLink() {
  modelValue.value = emptyNexaLink();
}

async function loadPages() {
  try {
    const list = await listPagesForPicker({ pageSize: 200 });
    pages.value = list.filter((p) => p.status === 'published');
  } catch {
    pages.value = [];
  }
}

watch(
  () => modelValue.value,
  () => {
    if (!dialogVisible.value) {
      Object.assign(draft, cloneDeep(modelValue.value || emptyNexaLink()));
    }
  },
  { deep: true }
);
</script>

<style scoped lang="scss">
.link-picker {
  width: 100%;
}
.link-picker-trigger {
  width: 100%;
  height: 3.2rem;
  line-height: 3.2rem;
  position: relative;
  .value-input-icon {
    position: absolute;
    right: 0;
    width: 3.4rem;
    z-index: 1;
    text-align: center;
  }
}
.link-picker-body {
  min-height: 36rem;
  max-height: 60vh;
  overflow: hidden;
  gap: 2rem;
}
.left-menu {
  width: 22.5rem;
  flex-shrink: 0;
  border-right: 1px solid var(--el-border-color-lighter);
  :deep(.el-menu-item) {
    height: 4rem;
    line-height: 4rem;
    &.is-active {
      background: var(--el-menu-hover-bg-color);
      color: #333;
    }
  }
}
.right-panel {
  overflow-y: auto;
  min-height: 32rem;
}
.w-full {
  width: 100%;
}
.flex {
  display: flex;
}
.gap-8 {
  gap: 8px;
}
.hint {
  font-size: 13px;
  color: #909399;
  line-height: 1.6;
}
</style>

<template>
    <div class="preview-page">
        <div v-if="loading" class="loading">加载中…</div>
        <div v-else-if="error" class="error">
            <div class="title">预览加载失败</div>
            <div class="msg">{{ error }}</div>
        </div>
        <div v-else class="preview-shell">
            <div ref="scrollTop" class="preview-phone" @scroll="onScroll">
                <div class="page-bg" :style="contentStyle">
                    <div class="page-bg-img" :style="contentImgStyle"></div>
                </div>
                <page-settings
                    v-if="header?.com_data?.content && header?.com_data?.style"
                    :show-page="false"
                    :page-data="header"
                    :scoll-top="scrollTopValue"
                />
                <div class="preview-content" :style="contentPaddingStyle">
                    <div-content
                        v-if="tabsData.length"
                        :diy-data="tabsData"
                        :show-model-border="false"
                        :is-tabs="true"
                        :main-content-style="mainContentStyle"
                        :outer-container-padding="outerContainerPadding"
                    />
                    <div-content
                        :diy-data="diyData"
                        :show-model-border="false"
                        :main-content-style="mainContentStyle"
                        :outer-container-padding="outerContainerPadding"
                    />
                </div>
                <footer-nav
                    v-if="bottomNavigationShow"
                    class="preview-footer"
                    :show-footer="false"
                    :footer-data="footer.com_data"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { getPage } from '@/api/nexahub-page';
import PageSettings from '@/components/page-settings/index.vue';
import DivContent from '@/components/common/div-content/index.vue';
import FooterNav from '@/components/footer-nav/index.vue';
import defaultSettings from '@/views/layout/components/main/index';
import defaultConfigConst from '@/config/const/index';
import { createLocalCommonData } from '@/mock/shopxo';
import { commonStore, footerNavCounterStore } from '@/store';
import { background_computer, gradient_computer } from '@/utils';
import { cloneDeep, isEmpty } from 'lodash';

type HeaderAndFooter = { name: string; show_tabs: string; key: string; com_data: any };

const route = useRoute();
const common_store = commonStore();
const footer_nav_counter_store = footerNavCounterStore();

const loading = ref(true);
const error = ref('');

const header = ref<HeaderAndFooter | any>({});
const footer = ref<HeaderAndFooter | any>({});
const diyData = ref<any[]>([]);
const tabsData = ref<any[]>([]);
const scrollTopValue = ref(0);

const DRAFT_STORAGE_PREFIX = 'nexahub:diy-preview-draft:';

const normalizePreviewMediaUrl = (value: string) => {
    const next = value
        .replace(/https?:\/\/(?:localhost|127\.0\.0\.1):3000\/api\/uploads\//gi, '/api/uploads/')
        .replace(/https?:\/\/(?:localhost|127\.0\.0\.1):3000\/uploads\//gi, '/api/uploads/')
        .replace(/https?:\/\/(?:localhost|127\.0\.0\.1):5173\/api\/uploads\//gi, '/api/uploads/')
        .replace(/https?:\/\/(?:localhost|127\.0\.0\.1):5174\/(static\/|images\/|api\/uploads\/)/gi, '/$1');
    if (next.startsWith('/uploads/')) return `/api${next}`;
    return next;
};

const normalizePreviewMedia = (value: any): any => {
    if (typeof value === 'string') return normalizePreviewMediaUrl(value);
    if (Array.isArray(value)) return value.map((item) => normalizePreviewMedia(item));
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizePreviewMedia(item)]));
    }
    return value;
};

const defaultMerge = (data: any, key: string) => {
    const fallback = cloneDeep((defaultSettings as any)[key.replace(/-/g, '_')]) || {};
    const merged = data || {};
    merged.style = Object.assign({}, fallback.style || {}, merged.style || {});
    if (!isEmpty(merged.style.common_style)) {
        merged.style.common_style = Object.assign({}, cloneDeep(defaultConfigConst), merged.style.common_style);
    }
    merged.content = Object.assign({}, fallback.content || {}, merged.content || {});
    return merged;
};

const normalizeBlock = (item: any) => {
    const block = cloneDeep(item);
    block.show_tabs = '0';
    if (block.key && block.com_data) {
        block.com_data = defaultMerge(block.com_data, block.key);
    }
    return block;
};

function applyConfigObject(cfg: any) {
    const normalizedCfg = normalizePreviewMedia(cfg || {});
    const nextHeader = cloneDeep(normalizedCfg.header || {
        name: '页面设置',
        show_tabs: '0',
        key: 'page-settings',
        com_data: defaultSettings.header_nav,
    });
    const nextFooter = cloneDeep(normalizedCfg.footer || {
        name: '底部导航',
        show_tabs: '0',
        key: 'footer-nav',
        com_data: defaultSettings.footer_nav,
    });
    nextHeader.show_tabs = '0';
    nextFooter.show_tabs = '0';
    nextHeader.com_data = defaultMerge(nextHeader.com_data, 'header_nav');
    nextFooter.com_data = defaultMerge(nextFooter.com_data, 'footer_nav');

    header.value = nextHeader;
    footer.value = nextFooter;
    diyData.value = Array.isArray(normalizedCfg.diy_data) ? normalizedCfg.diy_data.map(normalizeBlock) : [];
    tabsData.value = Array.isArray(normalizedCfg.tabs_data) ? normalizedCfg.tabs_data.map(normalizeBlock) : [];
}

/** 后端 Page.dsl 通常为 JSON：{ ..., config: "{\"header\":...}" } */
function parseDslToLayout(dsl: string) {
    const parsed = JSON.parse(dsl);
    const cfgRaw = parsed?.config;
    const cfg = typeof cfgRaw === 'string' ? JSON.parse(cfgRaw || '{}') : cfgRaw || {};
    applyConfigObject(cfg);
}

/** 编辑器「保存/预览」用的 saved_data：{ ..., config: string } */
function applySavedDraft(saved: Record<string, any>) {
    const cfgRaw = saved?.config;
    const cfg = typeof cfgRaw === 'string' ? JSON.parse(cfgRaw || '{}') : cfgRaw || {};
    applyConfigObject(cfg);
}

async function load() {
    loading.value = true;
    error.value = '';

    try {
        const id = String(route.query.id || route.query.pageId || '').trim();
        if (!id) throw new Error('缺少参数 id/pageId');

        const useDraft =
            route.query.draft === '1' ||
            route.query.draft === 1 ||
            String(route.query.draft || '') === 'true';

        if (useDraft) {
            const raw = sessionStorage.getItem(`${DRAFT_STORAGE_PREFIX}${id}`);
            if (raw) {
                applySavedDraft(JSON.parse(raw));
                return;
            }
        }

        const page = await getPage(id);
        const dsl = String(page?.dsl ?? '').trim();
        if (!dsl) throw new Error('页面 DSL 为空');
        parseDslToLayout(dsl);
    } catch (e) {
        error.value = e instanceof Error ? e.message : String(e);
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    common_store.set_common(createLocalCommonData());
    void load();
});

watch(
    () => route.fullPath,
    () => {
        void load();
    }
);

const onScroll = (e: Event) => {
    scrollTopValue.value = (e.target as HTMLElement).scrollTop;
};

const pageStyle = computed(() => header.value?.com_data?.style || {});
const pageContent = computed(() => header.value?.com_data?.content || {});
const bottomNavigationShow = computed(() => pageContent.value.bottom_navigation_show == '1' && footer.value?.com_data);
const contentStyle = computed(() => gradient_computer(pageStyle.value.common_style || defaultConfigConst));
const contentImgStyle = computed(() => background_computer(pageStyle.value.common_style || defaultConfigConst));
const mainContentStyle = computed(() => {
    const common = pageStyle.value.common_style || {};
    const paddingLeft = common.padding_left || 0;
    const paddingRight = common.padding_right || 0;
    return `padding: 0px ${paddingRight}px 0px ${paddingLeft}px;`;
});
const outerContainerPadding = computed(() => {
    const common = pageStyle.value.common_style || {};
    return (common.padding_left || 0) + (common.padding_right || 0);
});
const topPadding = computed(() => {
    const style = pageStyle.value;
    const content = pageContent.value;
    if (style.immersive_style == '1' || style.up_slide_display != '1') return 0;
    if (Array.isArray(content.data_alone_row_value) && content.data_alone_row_value.length > 0) {
        return 90 + 32 + (style.data_alone_row_space || 0);
    }
    return 90;
});
const contentPaddingStyle = computed(() => {
    const bottom = bottomNavigationShow.value ? footer_nav_counter_store.padding_footer : 0;
    return `padding-top:${topPadding.value}px;padding-bottom:${bottom}px;`;
});
</script>

<style scoped lang="scss">
.preview-page {
    min-height: 100vh;
    background: #fff;
}
.preview-shell {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    background: #f5f5f5;
}
.preview-phone {
    position: relative;
    width: 39rem;
    min-height: 100vh;
    max-height: 100vh;
    overflow-y: auto;
    background: #fff;
}
.page-bg {
    position: absolute;
    inset: 0;
    min-height: 100%;
    pointer-events: none;
}
.page-bg-img {
    width: 100%;
    height: 100%;
}
.preview-content {
    position: relative;
    z-index: 1;
    min-height: 100vh;
}
.preview-footer {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    z-index: 20;
}
.loading,
.error {
    padding: 24px;
}
.error .title {
    font-weight: 600;
    margin-bottom: 8px;
}
.error .msg {
    white-space: pre-wrap;
    color: #c45656;
}
</style>

<template>
    <div v-loading.fullscreen="loading" class="app-wrapper no-copy" element-loading-background="rgba(255,255,255,1)" element-loading-custom-class="loading-custom">
        <template v-if="!loading_content">
            <template v-if="!is_empty">
                <navbar v-model="form.model" :save-disabled="save_disabled" @preview="preview_event" @save="save_event" @save-close="save_close_event" />
                <div class="app-wrapper-content flex-row">
                    <app-main :diy-data="form.diy_data" :tabs-data="form.tabs_data" :header="form.header" :footer="form.footer" @right-update="right_update" @import="import_data_event" @export="export_data_event" @clear="clear_data_event"></app-main>
                    <settings :key="key" :value="diy_data_item"></settings>
                </div>
            </template>
            <template v-else>
                <no-data height="100vh" img-width="260px" size="16px" :text="empty_data"></no-data>
            </template>
        </template>
        <preview v-model="preview_dialog" :data-id="diy_id"></preview>
        <template-import v-model="import_temp_visible_dialog" @confirm="handleImportConfirm"></template-import>
    </div>
</template>

<script setup lang="ts">
import { is_obj } from '@/utils';
import { Settings, AppMain } from './components/index';
import defaultSettings from './components/main/index';
import defaultConfigSetting from '@/config/setting';
import defaultConfigConst from '@/config/const/index';
import { cloneDeep, isEmpty, omit } from 'lodash';
import type { diyData, headerAndFooter, diyConfig } from '@/api/diy';
import { createLocalCommonData } from '@/mock/shopxo';
import { getPage, updatePageDsl, type NexaHubPage } from '@/api/nexahub-page';
import { commonStore } from '@/store';
import { magic_config } from '@/config/const/tabs-magic';
const common_store = commonStore();
interface diy_data_item {
    id: string;
    model: {
        logo: string;
        name: string;
        is_enable: string;
        describe: string;
    };
    header: headerAndFooter;
    footer: headerAndFooter;
    tabs_data: Array<any>;
    diy_data: Array<any>;
}
const temp_form = ref<diy_data_item>({
    id: '',
    model: {
        logo: '',
        name: 'DIY模版',
        is_enable: '1',
        describe: '',
    },
    header: {
        name: '页面设置',
        show_tabs: '1',
        key: 'page-settings',
        com_data: defaultSettings.header_nav,
    },
    footer: {
        name: '底部导航',
        show_tabs: '0',
        key: 'footer-nav',
        com_data: defaultSettings.footer_nav,
    },
    tabs_data: [],
    diy_data: [],
});
const storage_prefix = 'nexahub:diy-editor:page:';
const default_page_id = 'local-default';
const page_id = ref('');
const form = ref<diy_data_item>({
    id: '',
    model: {
        logo: '',
        name: '',
        is_enable: '1',
        describe: '',
    },
    header: {
        name: '页面设置',
        show_tabs: '1',
        key: 'page-settings',
        com_data: {},
    },
    footer: {
        name: '底部导航',
        show_tabs: '0',
        key: 'footer-nav',
        com_data: {},
    },
    tabs_data: [],
    diy_data: [],
});
const diy_data_item = ref({});

const key = ref('');

const right_update = (item: any, diy: [Array<any>], header: headerAndFooter, footer: headerAndFooter, tabs_data: [Array<any>]) => {
    diy_data_item.value = item;
    form.value.diy_data = diy;
    form.value.header = header;
    form.value.footer = footer;
    form.value.tabs_data = tabs_data;
    // 生成随机id
    key.value = Math.random().toString(36).substring(2);
};
const import_temp_visible_dialog = ref(false);
// 导入数据
const import_data_event = () => {
    import_temp_visible_dialog.value = true;
};
const handleImportConfirm = () => {
    // 导入成功
    init();
};
// 导出数据
const export_data_event = () => {
    save_formmat_form_data(form.value);
};
// 清空数据
const clear_data_event = () => {
    let new_tem_form = cloneDeep(temp_form.value);
    form.value.header.show_tabs = '1';
    form.value.footer.show_tabs = '0';
    form.value.header.com_data = new_tem_form.header.com_data;
    form.value.footer.com_data = new_tem_form.footer.com_data;
    form.value.tabs_data = [];
    form.value.diy_data = [];
    // 数据清空之后，将公共沉浸模式判断为false
    common_store.set_is_immersion_model(false);
    common_store.set_is_general_safe_distance(false);
    diy_data_item.value = new_tem_form.header;
    persist_current_form();
};
//#region 页面初始化数据 ---------------------start
// 页面加载
onMounted(() => {
    common_init();
});

const is_empty = ref(false);
const empty_data = ref('编辑数据有误');
const init = async () => {
    try {
        const remote = await load_remote_page_data();
        if (remote) {
            apply_form_data(remote);
            loading_event();
            return;
        }
    } catch (err) {
        ElMessage.warning('后端页面读取失败，已尝试使用本地缓存');
    }

    const saved = load_page_data();
    if (saved) {
        apply_form_data(saved);
    } else {
        apply_blank_form();
    }
    loading_event();
};
// 数据合并
const data_merge = (list: string[]) => {
    list.forEach((item: any) => {
        item.com_data = default_merge(item.com_data, item.key);
    });
    return list;
};
// 浅层数据合并
const default_merge = (data: any, key: string) => {
    if (data.style) {
        data.style = Object.assign({}, cloneDeep((defaultSettings as any)[key.replace(/-/g, '_')]).style, data.style);
        // 历史的值，赋值给新的值
        if (key == 'header_nav' && !isEmpty(data.style.position_color)) {
            data.style.location_color = data.style.position_color;
        }
    } else {
        data.style = cloneDeep((defaultSettings as any)[key.replace(/-/g, '_')]).style;
    }
    // 兼融老数据
    if (!isEmpty(data.style.common_style)) {
        data.style.common_style = Object.assign({}, cloneDeep(defaultConfigConst), data.style.common_style);
    }
    if (data.content) {
        data.content = Object.assign({}, cloneDeep((defaultSettings as any)[key.replace(/-/g, '_')]).content, data.content);
    } else {
        data.content = cloneDeep((defaultSettings as any)[key.replace(/-/g, '_')]).content;
    }
    // 选项卡魔方数据补全
    if (key == 'tabs-magic') {
        if (data.content.home_data) {
            data.content.home_data = Object.assign({}, magic_config, data.content.home_data);
        }
        if (data.content.tabs_list.length > 0) {
            data.content.tabs_list = data.content.tabs_list.map((item: any) => {
                return Object.assign({}, magic_config, item);
            })
        }
    }
    return data;
};

const get_page_id_from_url = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('pageId') || params.get('id') || default_page_id;
};
const get_storage_key = () => `${storage_prefix}${page_id.value || default_page_id}`;
const load_page_data = (): diyData | null => {
    const text = localStorage.getItem(get_storage_key());
    if (!text) {
        return null;
    }
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
};
const load_remote_page_data = async (): Promise<diyData | null> => {
    if (!page_id.value || page_id.value === default_page_id) {
        return null;
    }

    const page = await getPage(page_id.value);
    return page_to_diy_data(page);
};
const page_to_diy_data = (page: NexaHubPage): diyData | null => {
    const text = page.dsl?.trim();
    if (!text || text === '{}') {
        const blank = diy_data_transfor_form_data(create_blank_form(page));
        return blank;
    }

    const parsed = JSON.parse(text);
    if (parsed?.config) {
        return {
            id: page.id,
            logo: parsed.logo || '',
            name: parsed.name || page.name || 'DIY模版',
            is_enable: parsed.is_enable || '1',
            describe: parsed.describe || '',
            config: typeof parsed.config === 'string' ? parsed.config : JSON.stringify(parsed.config)
        };
    }

    if (parsed?.header || parsed?.footer || parsed?.diy_data || parsed?.tabs_data) {
        return {
            id: page.id,
            logo: '',
            name: page.name || 'DIY模版',
            is_enable: '1',
            describe: '',
            config: JSON.stringify({
                header: parsed.header,
                footer: parsed.footer,
                diy_data: parsed.diy_data || [],
                tabs_data: parsed.tabs_data || []
            })
        };
    }

    return null;
};
const persist_current_form = () => {
    const data = diy_data_transfor_form_data(cloneDeep(form.value));
    localStorage.setItem(get_storage_key(), JSON.stringify(data));
};
const create_blank_form = (page?: Partial<NexaHubPage>) => {
    const new_tem_form = cloneDeep(temp_form.value);
    new_tem_form.id = page?.id || page_id.value;
    new_tem_form.model.name = page?.name || 'DIY模版';
    new_tem_form.header.com_data = cloneDeep(defaultSettings.header_nav);
    new_tem_form.footer.com_data = cloneDeep(defaultSettings.footer_nav);
    return new_tem_form;
};
const apply_blank_form = () => {
    const new_tem_form = create_blank_form();
    form.value = new_tem_form;
    diy_data_item.value = new_tem_form.header;
};
const apply_form_data = (source: diyData) => {
    const data = form_data_transfor_diy_data(source);
    data.header.com_data = default_merge(data.header.com_data, 'header_nav');
    data.footer.com_data = default_merge(data.footer.com_data, 'footer_nav');
    data.diy_data = data_merge(data.diy_data);
    data.tabs_data = data_merge(data.tabs_data);
    apply_immersion_state(data);
    form.value = data;
    diy_data_item.value = data.header;
    persist_current_form();
};
const apply_immersion_state = (data: diy_data_item) => {
    if (data.header.com_data.style?.immersive_style === '1') {
        common_store.set_is_immersion_model(true);
        common_store.set_is_general_safe_distance(data.header.com_data.style?.general_safe_distance_value == '1');
    } else {
        common_store.set_is_immersion_model(false);
        common_store.set_is_general_safe_distance(false);
    }
};
// 初始化公共数据
const common_init = async () => {
    page_id.value = get_page_id_from_url();
    common_store.set_common(createLocalCommonData());
    await init();
};
// 加载动画
const loading = ref(true);
const loading_content = ref(true);
const loading_event = () => {
    loading_content.value = false;
    setTimeout(() => {
        loading.value = false;
    }, 1000);
};
//#endregion 页面初始化数据 ---------------------end

//#region 顶部导航回调方法 ---------------------start
const preview_dialog = ref(false);
const diy_id = ref('');
const preview_event = (bool: boolean) => {
    save_disabled.value = bool;
    diy_id.value = page_id.value && page_id.value !== default_page_id ? page_id.value : form.value.id || page_id.value || default_page_id;
    ElMessage.closeAll();
    preview_dialog.value = true;
    nextTick(() => {
        save_formmat_form_data(form.value, false, false, true);
    });
};
const save_disabled = ref(false);
const save_event = (bool: boolean) => {
    save_disabled.value = bool;
    save_formmat_form_data(form.value);
};
const save_close_event = (bool: boolean) => {
    save_disabled.value = bool;
    save_formmat_form_data(form.value, true);
};
// save_formmat_form_data: 保存数据， data： 数据， close： 是否关闭， is_export： 是否导出， is_preview： 是否预览
const save_formmat_form_data = async (data: diy_data_item, close: boolean = false, is_export: boolean = false, is_preview: boolean = false) => {
    try {
    const clone_form = cloneDeep(data);
    clone_form.header ||= { name: '页面设置', show_tabs: '1', key: 'page-settings', com_data: {} } as any;
    clone_form.footer ||= { name: '底部导航', show_tabs: '0', key: 'footer-nav', com_data: {} } as any;
    clone_form.header.com_data ||= {} as any;
    clone_form.footer.com_data ||= {} as any;
    clone_form.header.com_data.style ||= {} as any;
    clone_form.footer.com_data.style ||= {} as any;
    clone_form.tabs_data ||= [] as any[];
    clone_form.diy_data ||= [] as any[];

    clone_form.header.show_tabs = '1';
    // 去除位置颜色
    clone_form.header.com_data.style = omit(cloneDeep(clone_form.header.com_data.style), ['position_color']);

    clone_form.footer.show_tabs = '0';

    // 预览：不走导出前大批量清洗逻辑，避免因个别组件数据缺失抛错而无法弹窗，且不要使用 duration:0 的常驻 Message（易遮挡画布点击）
    if (is_preview) {
        clone_form.header.show_tabs = '0';
        clone_form.footer.show_tabs = '0';
        clone_form.tabs_data = clone_form.tabs_data.map((item: any) => ({ ...item, show_tabs: '0' }));
        clone_form.diy_data = clone_form.diy_data.map((item: any) => ({ ...item, show_tabs: '0' }));
        const saved_data = diy_data_transfor_form_data(cloneDeep(clone_form));
        const pid =
            page_id.value && page_id.value !== default_page_id ? page_id.value : clone_form.id || page_id.value || default_page_id;
        try {
            sessionStorage.setItem(`nexahub:diy-preview-draft:${pid}`, JSON.stringify(saved_data));
            localStorage.setItem(get_storage_key(), JSON.stringify(diy_data_transfor_form_data(cloneDeep(data))));
        } catch (_) {
            /* ignore */
        }
        diy_id.value = pid;
        ElMessage.closeAll();
        // 延后到下一轮宏任务打开弹窗，避免与当前提交的响应式补丁/ElMessage 更新并发触发 Vue renderer 内部 subTree 异常
        setTimeout(() => {
            preview_dialog.value = true;
        }, 0);
        return;
    }

    ElMessage.closeAll();
    ElMessage({
        message: '保存中',
        type: 'success',
        duration: 1200,
        showClose: false,
    });
    // 字段比coupon多
    const new_array_1 = ['goods-list', 'article-list', 'blog', 'shop', 'realstore', 'binding', 'ask', 'activity', 'plugins-video'];
    // 数据比正常list多一级
    const new_array_2 = ['goods-tabs', 'article-tabs', 'blog-tabs', 'ask-tabs', 'plugins-video-tabs'];
    // 数据格式简单
    const new_array_3 = ['coupon'];
    // 层级更深
    const new_array_4 = ['data-magic'];
    // 自定义数据
    const new_array_5 = ['custom', 'goods-magic'];
    // 导航组
    const new_array_6 = ['nav-group'];
    // 选项卡数据更新
    clone_form.tabs_data = clone_form.tabs_data.map((item: any) => { 
        if (['tabs-magic'].includes(item.key)) {
            item.com_data.content.tabs_active_index = 0;
            // 获取所有组件名称
            const all_type = ['hot_zone', 'custom', 'img_magic', 'goods_magic', 'goods_list', 'article_list', 'nav_group', 'video', 'carousel'];
            // 将数据信息合并起来
            const new_data_list = cloneDeep([item.com_data.content.home_data, ...item.com_data.content.tabs_list]);
            // 对整个数据进行处理
            const data_list_handle: any[] = [];
            new_data_list.forEach((item1: any) => {
                if (['goods_list', 'article_list'].includes(item1.magic_type)) {
                    // 处理商品或者文章的数据
                    goods_or_article_data_processing(item1[item1.magic_type].content, item1.magic_type == new_array_1[0], item1.magic_type);
                } else if (['custom', 'goods_magic'].includes(item1.magic_type)) {
                    // 自定义数据处理
                    custom_data_processing(item1[item1.magic_type].content);
                }
                data_list_handle.push(Object.keys(item1)
                    .filter(key => !(all_type.filter((item2: string) => !isEmpty(item1.magic_type) ? (item2 !== item1.magic_type) : item2).includes(key)))
                    .reduce((acc: Record<string, any>, key: string) => { 
                        acc[key] = item1[key];
                        return acc;
                    }, {}));
            });
            // 处理完成之后拆分开
            item.com_data.content.home_data = data_list_handle.length > 0 ? data_list_handle[0] : null;
            item.com_data.content.tabs_list = data_list_handle.slice(1, data_list_handle.length);
        } 
        return {
            ...item,
            show_tabs: '0',
        }
    });
    // 拖拽区域更新
    clone_form.diy_data = clone_form.diy_data.map((item: any) => {
        if (new_array_1.includes(item.key)) {
            // 商品或文章的数据处理
            goods_or_article_data_processing(item.com_data.content, item.key == new_array_1[0], item.key);
        } else if (new_array_2.includes(item.key)) {
            item.com_data.content.tabs_active_index = 0;
            item.com_data.content.tabs_list.forEach((item0: any) => {
                // 商品或文章的数据处理
                goods_or_article_data_processing(item0, item.key == new_array_1[0], item.key);
            });
        } else if (new_array_3.includes(item.key)) {
            // 提取数据ID列表，用于后续的数据查询或处理
            item.com_data.content.data_ids = item.com_data.content.data_list.map((item: any) => item.data.id).join(',') || '';
            // 重构数据列表，保留原始数据结构的同时，添加或修改必要的字段
            item.com_data.content.data_list = item.com_data.content.data_list.map((item1: any) => {
                return {
                    ...item1,
                    data: [],
                    data_id: item1.data.id,
                };
            });
            item.com_data.content.data_auto_list = [];
            if (item.com_data.content.data_type == '0') {
                item.com_data.content = {
                    ...cloneDeep(item.com_data.content),
                    keywords: '',
                    type: defaultConfigSetting.coupon_ids,
                    expire_type_ids: defaultConfigSetting.coupon_ids,
                    use_limit_type_ids: defaultConfigSetting.coupon_ids,
                    number: defaultConfigSetting.page_size,
                    order_by_type: 0,
                    order_by_rule: 0,
                    is_repeat_receive: '0',
                }
            }
        } else if (new_array_4.includes(item.key)) {
            item.com_data.content.data_magic_list.forEach((item1: any) => {
                if (item1.data_content.data_type == 'goods') {
                    item1.data_content.goods_ids = item1.data_content.goods_list.map((item2: any) => item2.data.id).join(',') || '';
                    item1.data_content.goods_list = item1.data_content.goods_list.map((item3: any) => {
                        return {
                            ...item3,
                            data: [],
                            data_id: item3.data.id,
                        };
                    });
                    // 判断值是否存在
                    if (!isEmpty(item1.data_content.data_source_content)) {
                        // 清除自定义里的数据
                        item1.data_content.data_source_content.data_ids = [];
                        item1.data_content.data_source_content.data_list = [];
                        item1.data_content.data_source_content.data_auto_list = [];
                        item1.data_content.data_source_content.data_type = 0;
                    } else {
                        item1.data_content.data_source_content = { data_type: 0, data_ids: '', data_list: [], data_auto_list: []}
                    }
                } else if (item1.data_content.data_type == 'custom') {
                    // 自定义里的数据处理
                    custom_data_processing(item1.data_content);
                    // 清除商品里的数据
                    item1.data_content.goods_ids = '';
                    item1.data_content.goods_list= [];
                } else {
                    // 清除商品里的数据
                    item1.data_content.goods_ids = '';
                    item1.data_content.goods_list= [];
                    // 判断值是否存在
                    if (!isEmpty(item1.data_content.data_source_content)) {
                        // 清除自定义里的数据
                        item1.data_content.data_source_content.data_type = 0;
                        item1.data_content.data_source_content.data_ids = '';
                        item1.data_content.data_source_content.data_list = [];
                        item1.data_content.data_source_content.data_auto_list = [];
                    } else {
                        item1.data_content.data_source_content = { data_type: 0, data_ids: '', data_list: [], data_auto_list: []}
                    }
                }
            });
        } else if (new_array_5.includes(item.key)) {
            // 从数据中剔除data_source_content_value字段
            item.com_data.content = omit(cloneDeep(item.com_data.content), ['data_source_content_value']);
            // 自定义数据处理
            custom_data_processing(item.com_data.content);
        } else if (new_array_6.includes(item.key)) {
            item.com_data.content.nav_content_list = item.com_data.content.nav_content_list.map((item0: any) => ({...omit(item0, 'tabs_name') }));
        } else if (['data-tabs'].includes(item.key)) {
            item.com_data.content.tabs_active_index = 0;
            const new_tabs_list = item?.com_data?.content?.tabs_list || [];
            new_tabs_list.forEach((item: any) => {
                item.tabs_name = 'content';
                if (item.tabs_data_type == 'goods' || item.tabs_data_type == 'article') {
                    const new_com_data = item.tabs_data_type == 'goods' ? item.goods_config : item.article_config;
                    // 商品或文章的数据处理
                    goods_or_article_data_processing(new_com_data.content, item.tabs_data_type == 'goods');
                    // 是商品的时候需要将其他的两个数据清楚掉，避免下次切换时出现问题
                    if (item.tabs_data_type == 'goods') {
                        // item.article_config = cloneDeep(article_default_parameter);
                        // item.custom_config = cloneDeep(defaultCustom)
                        delete item.article_config;
                        delete item.custom_config;
                    } else {
                        // 是文章时清除掉其他的内容
                        // item.goods_config = cloneDeep(goods_default_parameter);
                        // item.custom_config = cloneDeep(defaultCustom)
                        delete item.goods_config;
                        delete item.custom_config;
                    }
                } else if (item.tabs_data_type == 'custom') {
                    const new_com_data = item.custom_config;
                    // 从数据中剔除data_source_content_value字段
                    new_com_data.content = omit(cloneDeep(new_com_data.content), ['data_source_content_value']);
                    // 自定义数据处理
                    custom_data_processing(new_com_data.content);
                    // 是自定义的时候清除掉其他的内容，避免下次点击时出现问题
                    delete item.goods_config;
                    delete item.article_config;
                    // item.goods_config = cloneDeep(goods_default_parameter);
                    // item.article_config = cloneDeep(article_default_parameter);
                }
            });
        } else if (['salerecords'].includes(item.key)) {
            item.com_data.content.data_auto_list = [];
            item.com_data.content.is_left = '0';
        } else if (['seckill'].includes(item.key)) {
            item.com_data.content.data = [];
            item.com_data.content.is_left = '0';
        }
        return {
            ...item,
            show_tabs: '0',
        };
    });
    form.value = clone_form;
    persist_current_form();
    const saved_data = diy_data_transfor_form_data(clone_form);

    if (is_export) {
        const blob = new Blob([JSON.stringify(saved_data, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${page_id.value || default_page_id}.json`;
        link.click();
        URL.revokeObjectURL(link.href);
        ElMessage.closeAll();
        return;
    }

    try {
        if (!page_id.value || page_id.value === default_page_id) {
            throw new Error('缺少后端页面 pageId');
        }
        await updatePageDsl(page_id.value, JSON.stringify(saved_data));
        ElMessage.closeAll();
        ElMessage.success('保存成功');
    } catch (err) {
        ElMessage.closeAll();
        ElMessage.error(err instanceof Error ? `后端保存失败，已保留本地缓存：${err.message}` : '后端保存失败，已保留本地缓存');
    }

    if (close) {
        ElMessageBox.confirm('页面已保存，是否关闭本页？', '提示')
            .then(() => {
                window.close();
            })
            .catch(() => {});
    }
    } catch (err) {
        ElMessage.closeAll();
        ElMessage.error(err instanceof Error ? `处理数据失败：${err.message}` : '处理数据失败');
    } finally {
        save_disabled.value = false;
    }
};
/**
 * 商品或文章数据处理函数
 * 该函数根据提供的数据类型和是否为商品的标志，处理数据内容的结构
 * 主要目的是为了标准化数据处理逻辑，使得数据格式符合预期的要求
 * 
 * @param new_com_data_content 传入的新数据内容对象，包含需要处理的数据列表和其他相关信息
 * @param is_goods 是否为商品的标志，用于决定数据处理的具体方式
 */
 const goods_or_article_data_processing = (new_com_data_content: any, is_goods: boolean, type: string = '') => {
    // 判断数据类型，如果为'0'，则进行详细的数据处理
    if (new_com_data_content.data_type == '0') {
        // 提取数据ID列表，用于后续的数据查询或处理
        new_com_data_content.data_ids = new_com_data_content.data_list.map((item: any) => item.data.id).join(',') || '';
        
        // 重构数据列表，保留原始数据结构的同时，添加或修改必要的字段
        new_com_data_content.data_list = new_com_data_content.data_list.map((item1: any) => {
            return {
                ...item1,
                data: [],
                data_id: item1.data.id,
            };
        });
        // 设置分类ID、数量、排序规则等默认值，确保数据的一致性和完整性
        new_com_data_content.keywords = '';
        new_com_data_content.category_ids = defaultConfigSetting.category_ids;
        new_com_data_content.number = defaultConfigSetting.page_size;
        // 视频列表的排序规则
        if (['plugins-video', 'plugins-video-tabs'].includes(type)) {
            new_com_data_content.order_by_type = 'default';
            new_com_data_content.order_by_release_time_rule = 'default';
            new_com_data_content.order_by_duration_rule = 'default';
        } else {
            new_com_data_content.order_by_type = defaultConfigSetting.order_by_type;
            new_com_data_content.order_by_rule = defaultConfigSetting.order_by_rule;
        }
       
        // 根据是否为商品，决定是否设置品牌ID或封面标志
        if (is_goods) {
            new_com_data_content.brand_ids = defaultConfigSetting.brand_ids;
        } else {
            // 文章博客的显示
            if (['article-list', 'article-tabs', 'blog', 'blog-tabs', 'plugins-video', 'plugins-video-tabs'].includes(type)) {
                new_com_data_content.is_cover = defaultConfigSetting.is_cover;
                if (['blog', 'blog-tabs', 'plugins-video', 'plugins-video-tabs'].includes(type)) {
                    new_com_data_content.is_recommended = '0';
                    new_com_data_content.is_hot = '0';
                }
            } else if (['realstore', 'shop'].includes(type)) {
                // 多商户多门店的显示
                new_com_data_content.is_goods_list = '0';
            } else if (type === 'binding') {
                // 组合搭配的显示
                new_com_data_content.is_home_show = '0';
            } else if (['ask', 'ask-tabs'].includes(type)) {
                // 组合搭配的显示
                new_com_data_content.is_reply = '0';
            } else if (type === 'activity') {
                // 商品列表的显示
                new_com_data_content.is_home = '0';
            }
        }
    } else {
        // 如果数据类型不是'0'，清空数据ID列表和数据列表，确保数据处理的一致性
        new_com_data_content.data_ids = '';
        new_com_data_content.data_list = [];
    }
    
    // 清空自动数据列表，为后续的数据处理或展示做准备
    new_com_data_content.data_auto_list = [];
};

/**
 * 自定义数据处理函数
 * 该函数用于处理新组件数据内容，根据数据是否为自定义以及数据类型，对数据进行相应的处理和格式化
 * @param {any} new_com_data_content - 新组件的数据内容对象，包含数据源和显示数据等信息
 */
 const custom_data_processing = (new_com_data_content: any) => {
    // 判断数据是否为自定义且数据类型为0（假设0代表某种特定数据类型）
    if (new_com_data_content.is_custom_data == '1' && new_com_data_content.data_source_content.data_type === 0) {
        // 手动的数据内容
        const data_list = cloneDeep(new_com_data_content.data_source_content.data_list);
        // 数据改造,存放手动的id
        new_com_data_content.data_source_content.data_ids = data_list.map((list_item: any) => list_item.data[new_com_data_content?.show_data.data_key || 'id'] || '').join(',') || '';
        // 数据改造,存放手动的清除里边的data
        new_com_data_content.data_source_content.data_list = data_list.map((list_item: any) => {
            return {
                ...list_item,
                data: [],
                data_id: list_item.data[new_com_data_content?.show_data.data_key || 'id'],
            };
        });
    } else {
        // 如果数据不是自定义或数据类型不是0，清空相关数据字段
        new_com_data_content.data_source_content.data_ids = [];
        new_com_data_content.data_source_content.data_list = [];
    }
    // 自动数据清空
    new_com_data_content.data_source_content.data_auto_list = [];
};
//#endregion 顶部导航回调方法 ---------------------end


// 数据改造
const diy_data_transfor_form_data = (clone_form: diy_data_item) => {
    return {
        id: clone_form.id,
        logo: clone_form.model.logo,
        name: clone_form.model.name,
        is_enable: clone_form.model.is_enable,
        describe: clone_form.model.describe,
        config: JSON.stringify({
            header: clone_form.header,
            footer: clone_form.footer,
            diy_data: clone_form.diy_data,
            tabs_data: clone_form.tabs_data,
        }),
    };
};
const form_data_transfor_diy_data = (clone_form: diyData) => {
    let temp_config = clone_form.config;
    let new_tem_form = cloneDeep(temp_form.value);
    try {
        return {
            id: clone_form.id,
            model: {
                logo: clone_form.logo,
                name: clone_form.name,
                is_enable: clone_form.is_enable,
                describe: clone_form.describe,
            },
            header: is_obj(temp_config) ? (temp_config as diyConfig).header : JSON.parse(temp_config as string).header,
            footer: is_obj(temp_config) ? (temp_config as diyConfig).footer : JSON.parse(temp_config as string).footer,
            tabs_data: is_obj(temp_config) ? (temp_config as diyConfig).tabs_data : JSON.parse(temp_config as string).tabs_data,
            diy_data: is_obj(temp_config) ? (temp_config as diyConfig).diy_data : JSON.parse(temp_config as string).diy_data,
        };
    } catch (error) {
        return {
            id: clone_form.id,
            model: {
                logo: clone_form.logo,
                name: clone_form.name,
                is_enable: clone_form.is_enable,
                describe: clone_form.describe,
            },
            header: new_tem_form.header,
            footer: new_tem_form.footer,
            tabs_data: new_tem_form.tabs_data,
            diy_data: new_tem_form.diy_data,
        };
    }
};
</script>

<style scoped lang="scss">
.app-wrapper {
    background-color: #f0f2f5;
    .app-wrapper-content {
        height: calc(100vh - 6rem);
    }
}
.no-copy {
    -webkit-touch-callout: none; /* iOS Safari */
    -webkit-user-select: none; /* Safari */
    -khtml-user-select: none; /* Konqueror HTML */
    -moz-user-select: none; /* Firefox */
    -ms-user-select: none; /* Internet Explorer/Edge */
    user-select: none; /* Non-prefixed version, currently supported by Chrome and Opera */
}
</style>

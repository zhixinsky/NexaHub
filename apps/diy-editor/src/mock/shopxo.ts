export function createLocalCommonData() {
    return {
        article_category: [],
        blog_category: [],
        attachment_category: [],
        brand_category: [],
        brand_list: [],
        goods_category: [],
        page_link_list: [],
        plugins: {},
        article_order_by_type_list: [],
        blog_order_by_type_list: [],
        goods_order_by_type_list: [],
        data_order_by_rule_list: [],
        brand_order_by_type_list: [],
        module_list: [
            {
                name: '基础组件',
                key: 'base',
                data: [
                    { name: '轮播', key: 'carousel', src: '' },
                    { name: '图片魔方', key: 'img-magic', src: '' },
                    { name: '导航组', key: 'nav-group', src: '' },
                    { name: '标题', key: 'title', src: '' },
                    { name: '搜索', key: 'search', src: '' },
                    { name: '公告', key: 'notice', src: '' },
                    { name: '富文本', key: 'rich-text', src: '' },
                    { name: '辅助线', key: 'row-line', src: '' },
                    { name: '辅助空白', key: 'auxiliary-blank', src: '' },
                    { name: '热区', key: 'hot-zone', src: '' },
                    { name: '自定义', key: 'custom', src: '' }
                ]
            },
            {
                name: '业务组件',
                key: 'plugins',
                data: [
                    { name: '商品列表', key: 'goods-list', src: '' },
                    { name: '商品选项卡', key: 'goods-tabs', src: '' },
                    { name: '商品魔方', key: 'goods-magic', src: '' },
                    { name: '文章列表', key: 'article-list', src: '' },
                    { name: '文章选项卡', key: 'article-tabs', src: '' },
                    { name: '优惠券', key: 'coupon', src: '' },
                    { name: '活动', key: 'activity', src: '' }
                ]
            },
            {
                name: '高级组件',
                key: 'tool',
                data: [
                    { name: '视频', key: 'video', src: '' },
                    { name: '选项卡', key: 'tabs', src: '' },
                    { name: '选项卡轮播', key: 'tabs-carousel', src: '' },
                    { name: '选项卡魔方', key: 'tabs-magic', src: '' },
                    { name: '悬浮按钮', key: 'float-window', src: '' }
                ]
            }
        ],
        config: {
            common_amap_map_ak: '',
            common_amap_map_safety_ak: '',
            common_baidu_map_ak: '',
            common_map_type: '',
            common_tencent_map_ak: '',
            common_tianditu_map_ak: '',
            currency_symbol: '¥',
            attachment_host: '',
            store_diy_url: '',
            site_logo_app: '',
            site_logo_wap: '',
            site_logo: '',
            site_name: 'NexaHub DIY',
            app_tabbar_data_url: '',
            app_tabbar_save_url: '',
            diy_detail_url: '',
            diy_download_url: '',
            diy_install_url: '',
            diy_market_url: '',
            diy_save_url: '',
            diy_upload_url: '',
            attachment_category_operate: {
                is_add: '1',
                is_edit: '1',
                is_del: '1'
            },
            attachment_operate: {
                is_upload: '1',
                is_edit: '1',
                is_del: '1',
                is_move: '1'
            },
            diy_config_operate: {
                is_base_data: 1,
                is_upload_admin: 1,
                is_preview_button: 1,
                is_save_button: 1,
                is_save_close_button: 0
            }
        },
        preview_url: ''
    };
}

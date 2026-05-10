import vue from '@vitejs/plugin-vue';

import { UserConfig, ConfigEnv, loadEnv, defineConfig } from 'vite';

import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';

import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import path from 'path';
const pathSrc = path.resolve(__dirname, 'src');

function sendJson(res: any, data: unknown) {
    res.setHeader('Content-Type', 'application/json;charset=utf-8');
    res.end(JSON.stringify(data));
}

function readBody(req: any) {
    return new Promise<Record<string, any>>((resolve) => {
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(chunk));
        req.on('end', () => {
            const text = Buffer.concat(chunks).toString('utf-8');
            if (!text) {
                resolve({});
                return;
            }
            try {
                resolve(JSON.parse(text));
                return;
            } catch {
                const params = new URLSearchParams(text);
                resolve(Object.fromEntries(params.entries()));
            }
        });
        req.on('error', () => resolve({}));
    });
}

function readRawBody(req: any) {
    return new Promise<Buffer>((resolve) => {
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', () => resolve(Buffer.alloc(0)));
    });
}

function parseMultipartBody(buffer: Buffer, contentType = '') {
    const boundary = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/)?.[1] || contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/)?.[2];
    const fields: Record<string, string> = {};
    let file:
        | {
              filename: string;
              contentType: string;
              data: Buffer;
          }
        | undefined;

    if (!boundary || buffer.length === 0) {
        return { fields, file };
    }

    const body = buffer.toString('binary');
    const parts = body.split(`--${boundary}`);

    for (const part of parts) {
        if (!part || part === '--\r\n' || part === '--') continue;

        const headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd < 0) continue;

        const rawHeaders = part.slice(0, headerEnd);
        let rawContent = part.slice(headerEnd + 4);
        rawContent = rawContent.replace(/\r\n$/, '');

        const name = rawHeaders.match(/name="([^"]+)"/)?.[1];
        const filename = rawHeaders.match(/filename="([^"]*)"/)?.[1];
        const partContentType = rawHeaders.match(/Content-Type:\s*([^\r\n]+)/i)?.[1] || '';

        if (!name) continue;

        if (filename) {
            file = {
                filename,
                contentType: partContentType,
                data: Buffer.from(rawContent, 'binary')
            };
        } else {
            fields[name] = Buffer.from(rawContent, 'binary').toString('utf-8');
        }
    }

    return { fields, file };
}

function createMockShopxoPlugin(enabled: boolean) {
    let nextCategoryId = 4;
    let nextAttachmentId = 4;
    const mockAttachmentCategories = [
        {
            id: '1',
            pid: '0',
            name: '图片',
            path: 'images',
            is_enable: '1',
            sort: 0,
            icon: '',
            items: [
                {
                    id: '2',
                    pid: '1',
                    name: '装修素材',
                    path: 'diy-images',
                    is_enable: '1',
                    sort: 0,
                    icon: '',
                    items: []
                }
            ]
        },
        {
            id: '3',
            pid: '0',
            name: '文件',
            path: 'files',
            is_enable: '1',
            sort: 0,
            icon: '',
            items: []
        }
    ];
    let mockAttachmentList = [
        {
            id: '1',
            category_id: '2',
            url: '/images/empty.png',
            original: 'empty.png',
            title: 'empty.png',
            ext: '.png',
            mime_type: 'image/png',
            type: 'img',
            size: 0,
            add_time: Math.floor(Date.now() / 1000)
        },
        {
            id: '2',
            category_id: '2',
            url: '/images/no-data.png',
            original: 'no-data.png',
            title: 'no-data.png',
            ext: '.png',
            mime_type: 'image/png',
            type: 'img',
            size: 0,
            add_time: Math.floor(Date.now() / 1000)
        }
    ];

    const flattenCategories = (list: any[]): any[] => {
        return list.flatMap((item) => [item, ...flattenCategories(item.items || [])]);
    };

    const findCategory = (id: string, list = mockAttachmentCategories): any => {
        for (const item of list) {
            if (String(item.id) === String(id)) return item;
            const child = findCategory(id, item.items || []);
            if (child) return child;
        }
        return null;
    };

    const removeCategory = (id: string, list = mockAttachmentCategories): boolean => {
        const index = list.findIndex((item) => String(item.id) === String(id));
        if (index >= 0) {
            list.splice(index, 1);
            return true;
        }
        return list.some((item) => removeCategory(id, item.items || []));
    };

    const addOrUpdateCategory = (data: Record<string, any>) => {
        const id = String(data.id || '');
        const pid = String(data.pid || '0');
        const category = {
            id: id || String(nextCategoryId++),
            pid,
            name: data.name || '新分类',
            path: data.path || `category-${Date.now()}`,
            sort: Number(data.sort || 0),
            is_enable: String(data.is_enable ?? '1'),
            icon: data.icon || '',
            items: []
        };

        if (id) {
            const current = findCategory(id);
            if (current) {
                Object.assign(current, category, { items: current.items || [] });
                return current;
            }
        }

        if (pid && pid !== '0') {
            const parent = findCategory(pid);
            if (parent) {
                parent.items = parent.items || [];
                parent.items.push(category);
                return category;
            }
        }

        mockAttachmentCategories.push(category);
        return category;
    };

    const normalizeAttachment = (data: Record<string, any>) => {
        const ext = data.ext || '.png';
        const type = data.type === 'video' ? 'video' : data.type === 'file' ? 'file' : 'img';
        const original = data.original || data.title || `local-${nextAttachmentId}${ext}`;
        return {
            id: String(nextAttachmentId++),
            category_id: String(data.category_id || '2'),
            url: data.url || (type === 'img' ? '/images/empty.png' : ''),
            original,
            title: original,
            ext,
            mime_type: type === 'img' ? 'image/png' : '',
            type,
            size: Number(data.size || 0),
            add_time: Math.floor(Date.now() / 1000)
        };
    };

    return {
        name: 'nexahub-mock-shopxo',
        configureServer(server: any) {
            if (!enabled) return;

            server.middlewares.use(async (req: any, res: any, next: any) => {
                const url = req.url || '';

                if (url === '/' || url.startsWith('/diy-editor')) {
                    res.statusCode = 302;
                    const queryIndex = url.indexOf('?');
                    const query = queryIndex >= 0 ? url.slice(queryIndex) : '';
                    res.setHeader('Location', `/index.html${query}#/`);
                    res.end();
                    return;
                }

                if (url.startsWith('/static/diy/images/')) {
                    req.url = url.replace('/static/diy/images/', '/images/');
                    next();
                    return;
                }

                if (url.includes('/diyapi/init')) {
                    sendJson(res, {
                        code: 0,
                        msg: 'success',
                        data: {
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
                                app_tabbar_data_url: 'diyapi/tabbardetail',
                                app_tabbar_save_url: 'diyapi/tabbarsave',
                                diy_detail_url: 'diyapi/diydetail',
                                diy_download_url: '',
                                diy_install_url: 'diyapi/diyinstall',
                                diy_market_url: '',
                                diy_save_url: 'diyapi/diysave',
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
                                    is_upload_admin: 1
                                }
                            },
                            preview_url: ''
                        }
                    });
                    return;
                }

                if (url.includes('/diyapi/diysave')) {
                    sendJson(res, {
                        code: 0,
                        msg: 'success',
                        data: 'local-mock-page'
                    });
                    return;
                }

                if (url.includes('/diyapi/diydetail')) {
                    sendJson(res, {
                        code: 0,
                        msg: 'success',
                        data: {
                            data: null
                        }
                    });
                    return;
                }

                if (url.includes('/attachmentapi/categorysave')) {
                    const body = await readBody(req);
                    const category = addOrUpdateCategory(body);
                    sendJson(res, {
                        code: 0,
                        msg: '操作成功',
                        data: category
                    });
                    return;
                }

                if (url.includes('/attachmentapi/categorydelete')) {
                    const body = await readBody(req);
                    removeCategory(String(body.id || ''));
                    sendJson(res, {
                        code: 0,
                        msg: '删除成功',
                        data: true
                    });
                    return;
                }

                if (url.includes('/attachmentapi/category')) {
                    sendJson(res, {
                        code: 0,
                        msg: 'success',
                        data: {
                            attachment_category: mockAttachmentCategories
                        }
                    });
                    return;
                }

                if (url.includes('/attachmentapi/movecategory')) {
                    const body = await readBody(req);
                    const ids = String(body.ids || '').split(',').filter(Boolean);
                    mockAttachmentList = mockAttachmentList.map((item) =>
                        ids.includes(String(item.id)) ? { ...item, category_id: String(body.category_id || item.category_id) } : item
                    );
                    sendJson(res, {
                        code: 0,
                        msg: '转移成功',
                        data: true
                    });
                    return;
                }

                if (url.includes('/attachmentapi/list')) {
                    const body = await readBody(req);
                    const page = Number(body.page || 1);
                    const pageSize = Number(body.page_size || 21);
                    const categoryId = String(body.category_id || '');
                    const keywords = String(body.keywords || '');
                    const requestedType = String(body.type || '');
                    const typeMap: Record<string, string> = {
                        image: 'img',
                        video: 'video',
                        file: 'file'
                    };
                    const localType = typeMap[requestedType] || '';
                    const filtered = mockAttachmentList.filter((item) => {
                        const matchCategory = !categoryId || String(item.category_id) === categoryId;
                        const matchKeyword = !keywords || item.original.includes(keywords) || item.title.includes(keywords);
                        const matchType = !localType || item.type === localType;
                        return matchCategory && matchKeyword && matchType;
                    });
                    const start = (page - 1) * pageSize;
                    const dataList = filtered.slice(start, start + pageSize);
                    sendJson(res, {
                        code: 0,
                        msg: 'success',
                        data: {
                            data_total: filtered.length,
                            page_total: Math.max(Math.ceil(filtered.length / pageSize), 1),
                            page,
                            page_size: pageSize,
                            data_list: dataList
                        }
                    });
                    return;
                }

                if (url.includes('/attachmentapi/upload')) {
                    const body = await readRawBody(req);
                    const { fields, file } = parseMultipartBody(body, req.headers['content-type'] || '');
                    const filename = file?.filename || `local-${nextAttachmentId}.png`;
                    const extMatch = filename.match(/\.[^.]+$/);
                    const ext = extMatch?.[0] || '.png';
                    const uploadType = fields.type === 'video' ? 'video' : fields.type === 'file' ? 'file' : 'img';
                    const url = file && uploadType === 'img' ? `data:${file.contentType || 'image/png'};base64,${file.data.toString('base64')}` : '';
                    const item = normalizeAttachment({
                        category_id: fields.category_id,
                        type: uploadType,
                        original: filename,
                        title: filename,
                        ext,
                        url,
                        size: file?.data.length || 0
                    });
                    mockAttachmentList.unshift(item);
                    sendJson(res, {
                        code: 0,
                        msg: '上传成功',
                        data: item
                    });
                    return;
                }

                if (url.includes('/attachmentapi/save')) {
                    const body = await readBody(req);
                    mockAttachmentList = mockAttachmentList.map((item) =>
                        String(item.id) === String(body.id)
                            ? { ...item, original: body.original || item.original, title: body.original || item.title }
                            : item
                    );
                    sendJson(res, {
                        code: 0,
                        msg: '保存成功',
                        data: true
                    });
                    return;
                }

                if (url.includes('/attachmentapi/delete')) {
                    const body = await readBody(req);
                    const ids = String(body.ids || '').split(',').filter(Boolean);
                    mockAttachmentList = mockAttachmentList.filter((item) => !ids.includes(String(item.id)));
                    sendJson(res, {
                        code: 0,
                        msg: '删除成功',
                        data: true
                    });
                    return;
                }

                if (url.includes('/attachmentapi/catch')) {
                    const body = await readBody(req);
                    const item = normalizeAttachment({
                        category_id: body.category_id,
                        url: body.source || '/images/empty.png',
                        original: body.source ? body.source.split('/').pop() : 'remote.png'
                    });
                    mockAttachmentList.unshift(item);
                    sendJson(res, {
                        code: 0,
                        msg: '提取成功',
                        data: [item]
                    });
                    return;
                }

                if (
                    url.includes('/attachmentapi/scanuploaddata')
                ) {
                    sendJson(res, {
                        code: 0,
                        msg: 'success',
                        data: true
                    });
                    return;
                }

                next();
            });
        }
    };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }: ConfigEnv): UserConfig => {
    const env = loadEnv(mode, process.cwd());
    return {
        resolve: {
            alias: {
                '@': pathSrc,
            },
        },
        css: {
            // CSS 预处理器
            preprocessorOptions: {
                //define global scss variable
                scss: {
                    javascriptEnabled: true,
                    additionalData: `@use "@/styles/variables.scss" as *;`,
                },
            },
        },
        server: {
            host: '0.0.0.0',
            port: Number(env.VITE_APP_PORT),
            open: true, // 运行是否自动打开浏览器
            proxy: {
                // 反向代理解决跨域
                [env.VITE_APP_BASE_API]: {
                    target: env.VITE_APP_BASE_API_URL, // 接口地址
                    changeOrigin: true,
                    rewrite: (path) => path.replace(new RegExp('^' + env.VITE_APP_BASE_API), ''), // 替换 /dev-admin 为 target 接口地址
                },
                // 反向代理解决跨域
                [env.VITE_APP_BASE_API_PHP]: {
                    target: env.VITE_APP_BASE_API_PHP_URL, // 接口地址
                    changeOrigin: true,
                    rewrite: (path) => path.replace(new RegExp('^' + env.VITE_APP_BASE_API_PHP), ''), // 替换 /dev-api 为 target 接口地址
                },
                // 反向代理解决跨域
                [env.VITE_APP_BASE_API_INDEX_PHP]: {
                    target: env.VITE_APP_BASE_API_INDEX_PHP_URL, // 接口地址
                    changeOrigin: true,
                    rewrite: (path) => path.replace(new RegExp('^' + env.VITE_APP_BASE_API_INDEX_PHP), ''), // 替换 /dev-index 为 target 接口地址
                },
                '/pages': {
                    target: 'http://localhost:3000',
                    changeOrigin: true,
                },
                '/attachmentapi': {
                    target: 'http://localhost:3000',
                    changeOrigin: true,
                },
                '/upload': {
                    target: 'http://localhost:3000',
                    changeOrigin: true,
                },
            },
        },
        plugins: [
            vue({
                script: {
                    // 开启defineModel配置
                    defineModel: true,
                },
            }),
            AutoImport({
                // 自动导入 Vue 相关函数，如：ref, reactive, toRef 等
                imports: ['vue', '@vueuse/core'],
                eslintrc: {
                    enabled: true,
                    filepath: './.eslintrc-auto-import.json',
                    globalsPropValue: true,
                },
                resolvers: [
                    // 自动导入 Element Plus 相关函数，如：ElMessage, ElMessageBox... (带样式)------若是没有自动引入，请耐心等待，反应特别慢，希望以后可以优化
                    ElementPlusResolver(),
                ],
                vueTemplate: true,
                // 配置文件生成位置(false:关闭自动生成)
                // dts: false,
                dts: path.resolve(pathSrc, 'types', 'auto-imports.d.ts'), // 指定自动导入函数TS类型声明文件路径
            }),
            Components({
                resolvers: [
                    // 自动导入 Element Plus 组件
                    ElementPlusResolver(),
                ],
                dirs: ['src/**/components'],
                // 配置文件生成位置(false:关闭自动生成)
                // dts:false,
                dts: path.resolve(pathSrc, 'types', 'components.d.ts'), // 指定自动导入组件TS类型声明文件路径
            }),
            createMockShopxoPlugin(env.VITE_APP_MOCK_SHOPXO === 'true'),
        ],

        // 构建配置
        build: {
            target: 'esnext',
            // 打包不压缩图片为base64
            assetsInlineLimit: 0,
            // 混淆器设置
            minify: 'terser',
            // 不生成source map文件，默认false
            sourcemap: false,
            // 指定输出路径（相对于项目根目录)，默认dist
            outDir: 'dist',
            // 指定生成静态资源的存放路径，默认assets
            assetsDir: 'assets',
            // chunk大小警告限制，默认500kbs
            chunkSizeWarningLimit: 1500,
            // 是否禁用css拆分(默认true)，设置false时所有CSS将被提取到一个CSS文件中
            cssCodeSplit: true,
            // 简要配置
            terserOptions: {
                compress: {
                    // 移除console
                    drop_console: false,
                    // 移除debugger
                    drop_debugger: true,
                },
                // 保留类名
                keep_classnames: true,
                format: {
                    // 移除所有的注释
                    comments: false,
                },
            },
            // js、css等文件打包到不同文件夹
            rollupOptions: {
                output: {
                    // 自定义 chunk 文件的输出路径和文件名格式
                    chunkFileNames: 'static/diy/js/chunk/[name]-[hash].js',
                    // 自定义 entry chunk 的输出路径和文件名格式
                    entryFileNames: 'static/diy/js/entry/[name]-[hash].js',
                    //非js文件夹，按照文件类型分类css,png,jpg
                    assetFileNames: 'static/diy/[ext]/[name]-[hash].[ext]',
                },
            },
        },
    };
});

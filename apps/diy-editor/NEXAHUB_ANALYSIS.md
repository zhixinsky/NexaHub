# shopxo-diy 接入分析

本文档记录 `apps/diy-editor` 中 shopxo-diy 原始装修编辑器的结构、启动方式和与 ShopXO 后端的耦合点。当前接入目标是保持其作为独立模块运行，暂不改造核心业务逻辑。

## 技术栈

- Vue 3.3.4
- TypeScript 5.0.x
- Vite 4.3.9
- Element Plus 2.8.1
- Pinia 2.1.3
- Vue Router 4.0.13，Hash 路由
- Axios
- Sass
- WangEditor
- Swiper
- vue-draggable-plus
- vue3-draggable-resizable
- unplugin-auto-import / unplugin-vue-components

## 项目结构

- `index.html`：Vite HTML 入口。
- `src/main.ts`：Vue 应用入口，注册 Router、Pinia、Particles、Vue3DraggableResizable。
- `src/App.vue`：根组件。
- `src/router/index.ts`：路由配置，主要路由为 `/` 和 `/tabbar`。
- `src/views/layout`：主 DIY 页面装修编辑器。
- `src/views/tabbar`：底部 tabbar 装修页面。
- `src/components`：装修组件、通用配置组件、上传组件、预览组件等。
- `src/config/const`：各装修组件默认配置。
- `src/config/setting`：通用默认设置。
- `src/api`：ShopXO 后端接口封装。
- `src/utils/request.ts`：后台/admin.php 请求封装。
- `src/utils/api-request.ts`：api.php 请求封装。
- `public/images`：原始静态图片资源。
- `public/js`、`public/css`：原仓库携带的静态构建资源。

## 启动命令

独立安装依赖：

```sh
cd apps/diy-editor
npm install --legacy-peer-deps
```

说明：原项目依赖版本较老，当前 npm 会对 `pinia/vue` peer dependency 做严格解析，直接 `npm install` 可能出现 `ERESOLVE`。使用 `--legacy-peer-deps` 可按原项目依赖锁定方式安装。

开发启动：

```sh
cd apps/diy-editor
npm run dev
```

当前开发端口已从原始 `3000` 调整为 `5174`，避免和 NexaHub Nest API 冲突。

访问地址：

```text
http://localhost:5174/index.html#/
```

构建命令：

```sh
cd apps/diy-editor
npm run build
```

生产模式构建：

```sh
cd apps/diy-editor
npm run build-pro
```

## 主要入口文件

- `src/main.ts`
- `src/App.vue`
- `src/router/index.ts`
- `src/views/layout/index.vue`
- `src/views/tabbar/index.vue`

`src/views/layout/index.vue` 是主装修编辑页面，当前已改为独立运行模式，负责：

- 初始化本地 mock 公共配置
- 按 URL 参数 `pageId` 从 localStorage 恢复页面详情
- 维护 `header`、`footer`、`tabs_data`、`diy_data`
- 本地保存、预览、导入、导出
- 将编辑器内部数据转换成后端保存格式

## 组件配置目录

组件默认配置集中在：

```text
src/config/const
```

典型配置文件：

- `header-nav.ts`
- `footer-nav.ts`
- `carousel.ts`
- `goods-list.ts`
- `goods-tabs.ts`
- `article-list.ts`
- `article-tabs.ts`
- `custom.ts`
- `img-magic.ts`
- `hot-zone.ts`
- `nav-group.ts`
- `rich-text.ts`
- `tabs.ts`
- `tabs-magic.ts`

组件实现集中在：

```text
src/components
```

命名模式通常为：

```text
model-xxx/index.vue
model-xxx/model-xxx-content.vue
model-xxx/model-xxx-setting.vue
model-xxx/model-xxx-styles.vue
```

## 环境变量

开发环境文件：

```text
.env.development
```

关键变量：

- `VITE_APP_TITLE`：应用标题。
- `VITE_APP_PORT`：开发端口，当前为 `5174`。
- `VITE_APP_BASE_API`：后台管理接口代理前缀，默认 `/dev-admin`。
- `VITE_APP_BASE_API_URL`：ShopXO `admin.php` 地址，默认 `http://shopxo.com/admin.php/`。
- `VITE_APP_BASE_API_PHP`：API 接口代理前缀，默认 `/dev-api`。
- `VITE_APP_BASE_API_PHP_URL`：ShopXO `api.php` 地址，默认 `http://shopxo.com/api.php`。
- `VITE_APP_BASE_API_INDEX_PHP`：前台 index.php 代理前缀，默认 `/dev-index`。
- `VITE_APP_BASE_API_INDEX_PHP_URL`：ShopXO `index.php` 地址。
- `VITE_APP_MOCK_SHOPXO`：当前项目新增的开发期兼容开关。为 `true` 时，Vite dev server 会 mock `diyapi/init`、`diyapi/diysave` 和基础 `attachmentapi/*`，并把 `/static/diy/images/*` 映射到本地 `public/images/*`，用于在没有 ShopXO 后端时看到原始装修页面。

生产环境文件：

```text
.env.production
```

当前仅保留：

- `VITE_APP_BASE_API`
- `VITE_APP_BASE_API_URL`
- `VITE_APP_PORT`

## 静态资源路径

代码中大量图片路径依赖 ShopXO 初始化接口返回的：

```text
common_store.common.config.attachment_host
```

常见拼接方式：

```text
{attachment_host}/static/diy/images/...
```

例如：

- `/static/diy/images/layout/siderbar/{component}.png`
- `/static/diy/images/layout/main/main-top.png`
- `/static/diy/images/components/page-settings/theme-1.png`
- `/static/diy/images/tabbar/phone-temp-bg.jpg`

当前源码目录里这些资源位于：

```text
public/images
```

后续若接入 NexaHub 自有后端，需要明确静态资源发布路径是否兼容 `/static/diy/images`，或者在初始化接口中返回合适的 `attachment_host`。

## 页面保存

保存逻辑位于：

```text
src/views/layout/index.vue
```

当前 NexaHub 独立运行模式不再调用 ShopXO 保存接口。保存按钮会将页面 DSL 写入 localStorage。

localStorage key：

```text
nexahub:diy-editor:page:{pageId}
```

URL 支持：

```text
/diy-editor?pageId=home
```

如果没有 `pageId`，使用默认本地页面：

```text
nexahub:diy-editor:page:local-default
```

原始 API 文件中也保留了固定封装：

```text
src/api/diy.ts
```

对应接口：

- `diyapi/diydetail`：获取 DIY 详情。
- `diyapi/diysave`：保存 DIY 页面。
- `diyapi/diymarket`：导入市场列表。
- `diyapi/diyupload`：上传导入文件。
- `diyapi/diyinstall`：安装导入模板。
- `diyapi/diydownload`：导出模板。

## 上传接口

上传封装位于：

```text
src/api/upload.ts
```

主要接口：

- `attachmentapi/category`：附件分类。
- `attachmentapi/categorysave`：保存附件分类。
- `attachmentapi/categorydelete`：删除附件分类。
- `attachmentapi/movecategory`：移动附件分类。
- `attachmentapi/list`：附件列表。
- `attachmentapi/save`：保存附件名称。
- `attachmentapi/delete`：删除附件。
- `attachmentapi/upload`：附件上传，`multipart/form-data`。
- `attachmentapi/scanuploaddata`：扫码上传。
- `attachmentapi/catch`：远程链接抓取。

上传请求通过 `src/utils/api-request.ts` 访问 `api.php` 侧接口。

## 其他依赖接口

初始化：

- `diyapi/init`
- 插件模式：`plugins/index/pluginsname/{type}/pluginscontrol/diyapi/pluginsaction/init.html`

商品/文章/品牌/链接：

- `diyapi/goodslist`
- `diyapi/goodsinit`
- `diyapi/goodsautodata`
- `diyapi/goodsmagicinit`
- `diyapi/articlelist`
- `diyapi/articleappointdata`
- `diyapi/articleautodata`
- `diyapi/linkinit`
- `diyapi/diylist`
- `diyapi/designlist`
- `diyapi/customviewlist`
- `diyapi/brandlist`
- `diyapi/brandautodata`
- `diyapi/custominit`

插件接口示例：

- `plugins/index/pluginsname/coupon/pluginscontrol/diycoupon/pluginsaction/index.html`
- `plugins/index/pluginsname/blog/pluginscontrol/diyblog/pluginsaction/index.html`
- `plugins/index/pluginsname/shop/pluginscontrol/diyshop/pluginsaction/index.html`
- `plugins/index/pluginsname/realstore/pluginscontrol/diyrealstore/pluginsaction/index.html`
- `plugins/index/pluginsname/ask/pluginscontrol/diyask/pluginsaction/index.html`
- `plugins/index/pluginsname/activity/pluginscontrol/diyactivity/pluginsaction/index.html`
- `plugins/index/pluginsname/video/pluginscontrol/diyvideo/pluginsaction/index`

## DSL 数据结构

编辑器保存时会生成 `diyData`：

```ts
{
  id: string;
  logo: string;
  name: string;
  describe: string;
  is_enable: string;
  config: string;
}
```

其中 `config` 是 JSON 字符串，结构为：

```json
{
  "header": {
    "name": "页面设置",
    "show_tabs": "1",
    "key": "page-settings",
    "com_data": {}
  },
  "footer": {
    "name": "底部导航",
    "show_tabs": "0",
    "key": "footer-nav",
    "com_data": {}
  },
  "diy_data": [
    {
      "name": "组件名称",
      "mark_name": "",
      "show_tabs": "0",
      "is_enable": "1",
      "src": "",
      "id": "随机ID",
      "key": "组件key",
      "com_data": {
        "content": {},
        "style": {}
      }
    }
  ],
  "tabs_data": []
}
```

核心字段说明：

- `header`：页面级设置。
- `footer`：底部导航设置。
- `diy_data`：主页面组件列表。
- `tabs_data`：顶部/内容选项卡类组件数据。
- `key`：组件类型，例如 `carousel`、`goods-list`、`custom`。
- `com_data.content`：组件内容配置。
- `com_data.style`：组件样式配置。

NexaHub `Page.dsl` 可以直接保存这段 `config` 字符串，`source` 标记为 `shopxo_diy`。

## 与 ShopXO 后端耦合点

1. 请求返回格式固定为 ShopXO 风格：

```json
{
  "code": 0,
  "msg": "",
  "data": {}
}
```

`src/utils/request.ts` 和 `src/utils/api-request.ts` 都依赖 `code == 0` 判断成功。

2. token 获取方式耦合 ShopXO：

- 开发环境动态导入 `temp.d.ts` 中的 `temp_token`。
- 生产环境读取 `admin_info` 或 `user_info` cookie。
- 所有请求追加 `token`、`diy_id`、`diy_type`。

3. URL 解析耦合 ShopXO 路由：

`src/utils/common.ts` 会从 URL 中解析：

- `id`
- `type`
- `business`
- `-saveinfo-`
- `-diyinfo-`
- `?s=diy/saveinfo/id/...`

4. 初始化接口决定大量运行时配置：

`diyapi/init` 返回的 `data.config` 决定：

- `attachment_host`
- `diy_detail_url`
- `diy_save_url`
- `diy_download_url`
- `diy_upload_url`
- `diy_install_url`
- `diy_market_url`
- `preview_url`
- 地图 key
- 站点 logo/name
- 货币符号
- 附件权限
- DIY 配置权限

5. 静态资源路径耦合 `/static/diy/images`。

6. 商品、文章、品牌、优惠券、插件数据选择器直接调用 ShopXO 或 ShopXO 插件接口。

7. 保存前会把商品、文章、优惠券、插件等组件数据转换为 ShopXO 后端期望字段，例如：

- `data_ids`
- `category_ids`
- `brand_ids`
- `order_by_type`
- `order_by_rule`
- `data_auto_list`

8. 预览和导出依赖 ShopXO 返回的 URL 和下载接口。

## 当前接入状态

- `apps/diy-editor` 保持独立应用。
- 已使用原项目 npm 依赖体系完成安装。
- 已将开发端口调整为 `5174`，避免和 NexaHub API 冲突。
- 已移除主编辑器对 ShopXO 初始化和保存接口的强依赖。
- 页面标题、组件列表、DSL 数据由前端状态管理。
- `pageId` 支持从 URL 参数读取。
- 保存和恢复使用 localStorage。
- `npm run build` 已通过。
- 当前可访问原始装修页面入口：

```text
http://localhost:5174/diy-editor?pageId=home
```

注意：当前主装修页面已不依赖 ShopXO 后端即可打开、添加组件、编辑属性并本地保存。附件弹窗和部分商品/文章/插件选择器仍使用开发期 mock 或空数据占位；后续接 NexaHub 后端时，建议做兼容适配层，而不是重写 shopxo-diy 内部组件逻辑。

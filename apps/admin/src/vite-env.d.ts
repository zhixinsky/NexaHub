/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_DIY_EDITOR_ORIGIN?: string;
  /** 移动端 H5 开发地址，用于后台「复制预览链接」（默认与 apps/mobile vite 5176 一致） */
  readonly VITE_MOBILE_PREVIEW_ORIGIN?: string;
}

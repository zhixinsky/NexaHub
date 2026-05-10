/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  /** 移动端 H5 开发入口，默认走 admin dev server 的 /mobile 代理。 */
  readonly VITE_MOBILE_PREVIEW_ORIGIN?: string;
  /** 开发期对手机可访问的 admin 5173 局域网入口。 */
  readonly VITE_PUBLIC_ORIGIN?: string;
}

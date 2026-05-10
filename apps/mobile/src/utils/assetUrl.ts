import { apiBase } from '@/api/http';

export type UploadItem = { url?: string };

/** shopxo-diy uploadList[] 第一项的地址，统一归一到 admin 5173 入口下的 /api 或代理资源路径。 */
export function resolveMediaUrl(raw?: string): string {
  const s = String(raw || '').trim();
  if (!s) return '';

  if (/^https?:\/\//i.test(s)) {
    try {
      const url = new URL(s);
      if (/^(localhost|127\.0\.0\.1)$/i.test(url.hostname) && ['3000', '5174', '5175'].includes(url.port)) {
        if (url.pathname.startsWith('/api/')) return `${url.pathname}${url.search}${url.hash}`;
        if (url.pathname.startsWith('/uploads/')) return `/api${url.pathname}${url.search}${url.hash}`;
        if (url.port === '5174' && (url.pathname.startsWith('/static/') || url.pathname.startsWith('/images/'))) {
          return `${url.pathname}${url.search}${url.hash}`;
        }
      }
    } catch {
      return s;
    }
    return s;
  }

  if (s.startsWith('/api/')) return s;
  if (s.startsWith('/uploads/')) return `/api${s}`;
  if (s.startsWith('/static/') || s.startsWith('/images/')) return s;

  const base = apiBase().replace(/\/$/, '');
  if (!base) return s;
  const path = s.startsWith('/') ? s : `/${s}`;
  return `${base}${path}`;
}

export function firstUploadUrl(arr: unknown): string {
  if (!Array.isArray(arr) || !arr.length) return '';
  const u = resolveMediaUrl((arr[0] as UploadItem)?.url || '');
  return u;
}

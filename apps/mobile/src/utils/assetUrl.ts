import { apiBase } from '@/api/http';

export type UploadItem = { url?: string };

/** shopxo-diy uploadList[] 第一项的地址，拼上 API base（用于静态资源 uploads 等）。 */
export function resolveMediaUrl(raw?: string): string {
  const s = String(raw || '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
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

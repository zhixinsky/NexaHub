export function apiBase(): string {
  const base = String(import.meta.env.VITE_NEXAHUB_API_BASE_URL || '/api').replace(/\/$/, '');
  if (base) return base;
  if (typeof location !== 'undefined' && /^https?:$/i.test(location.protocol)) return '';
  return '';
}

async function rawFetch(pathOrUrl: string, init?: RequestInit) {
  const base = apiBase();
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${base}${pathOrUrl}`;
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`请求失败 ${res.status}: ${await res.text().catch(() => '')}`);
  }
  return res;
}

export async function getJson<T>(pathOrUrl: string): Promise<T> {
  const res = await rawFetch(pathOrUrl, { credentials: 'include' });
  return res.json() as Promise<T>;
}

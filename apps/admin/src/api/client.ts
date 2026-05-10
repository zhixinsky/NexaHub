const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

export type ListResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    }
  });

  if (!response.ok) {
    const text = await response.text();
    let msg = text || `HTTP ${response.status}`;
    try {
      const body = JSON.parse(text) as { message?: string };
      if (typeof body?.message === 'string' && body.message.trim()) {
        msg = body.message.trim();
      }
    } catch {
      // 非 JSON，沿用原文本
    }
    throw new Error(msg);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('接口未返回 JSON，请检查 API 服务或 Vite 代理配置');
  }

  return response.json() as Promise<T>;
}

export function buildQuery(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });

  const text = query.toString();
  return text ? `?${text}` : '';
}

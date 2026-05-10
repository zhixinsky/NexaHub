export type NexaHubPage = {
    id: string;
    name: string;
    code: string;
    platform: string;
    dsl: string;
    source: string;
    status: string;
};

function normalizeBaseUrl(value: unknown) {
    const raw = String(value ?? '').trim();
    if (!raw) return '';
    const unquoted = raw.replace(/^['"]|['"]$/g, '');
    return unquoted.replace(/\/+$/, '');
}

const apiBaseUrl = normalizeBaseUrl(import.meta.env.VITE_NEXAHUB_API_BASE_URL) || '/api';

export async function getPage(id: string) {
    const response = await fetch(`${apiBaseUrl}/pages/${id}`);
    if (!response.ok) {
        throw new Error(await response.text() || `页面读取失败：${response.status}`);
    }
    return response.json() as Promise<NexaHubPage>;
}

export async function listPagesForPicker(params?: { search?: string; pageSize?: number }) {
  const q = new URLSearchParams();
  q.set('page', '1');
  q.set('pageSize', String(params?.pageSize ?? 100));
  if (params?.search?.trim()) q.set('search', params.search.trim());
  const response = await fetch(`${apiBaseUrl}/pages?${q.toString()}`);
  if (!response.ok) {
    throw new Error((await response.text()) || `页面列表失败：${response.status}`);
  }
  const data = (await response.json()) as { items?: NexaHubPage[] };
  return Array.isArray(data.items) ? data.items : [];
}

export async function updatePageDsl(id: string, dsl: string) {
    const response = await fetch(`${apiBaseUrl}/pages/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            dsl,
            source: 'shopxo_diy'
        })
    });

    if (!response.ok) {
        throw new Error(await response.text() || `页面保存失败：${response.status}`);
    }

    return response.json() as Promise<NexaHubPage>;
}

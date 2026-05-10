export type BusinessType = 'content' | 'activity' | 'product';
export type DataSourceType = 'manual' | 'business' | 'api';

export type DataSource = {
  type: DataSourceType;
  businessType?: BusinessType;
  query?: {
    category?: string;
    limit?: number;
    sort?: string;
    ids?: string[];
  };
  api?: {
    url?: string;
  };
};

export function getDataSource(ctx: Record<string, unknown>, fallbackBusinessType: BusinessType): DataSource {
  const raw = ctx.dataSource;
  if (!raw || typeof raw !== 'object') {
    return { type: 'manual', businessType: fallbackBusinessType, query: {} };
  }

  const source = raw as DataSource;
  return {
    type: source.type || 'manual',
    businessType: source.businessType || fallbackBusinessType,
    query: {
      category: source.query?.category || '',
      limit: Number(source.query?.limit || ctx.number || 6),
      sort: source.query?.sort || 'latest',
      ids: Array.isArray(source.query?.ids) ? source.query.ids.map(String).filter(Boolean) : []
    },
    api: {
      url: source.api?.url || ''
    }
  };
}

export function businessQuery(source: DataSource) {
  const q = source.query || {};
  return {
    limit: Math.min(Math.max(Number(q.limit || 6), 1), 100),
    category: String(q.category || ''),
    sort: String(q.sort || 'latest'),
    ids: Array.isArray(q.ids) ? q.ids.map(String).filter(Boolean) : []
  };
}

export function normalizeDataSourceItems<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.items)) return obj.items as T[];
    if (Array.isArray(obj.data)) return obj.data as T[];
    if (Array.isArray(obj.data_list)) return obj.data_list as T[];
  }
  return [];
}

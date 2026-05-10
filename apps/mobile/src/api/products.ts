import { getJson } from '@/api/http';

export type ProductItem = Record<string, unknown> & {
  id: string;
  title: string;
  cover?: string;
  subtitle?: string;
  price?: number;
  description?: string;
};

export type ListResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export function listProducts(params: { page?: number; pageSize?: number; search?: string; status?: string; category?: string; ids?: string[]; sort?: string }) {
  const q = new URLSearchParams();
  q.set('page', String(params.page ?? 1));
  q.set('pageSize', String(params.pageSize ?? 20));
  if (params.search) q.set('search', params.search);
  if (params.status) q.set('status', params.status);
  if (params.category) q.set('category', params.category);
  if (params.ids?.length) q.set('ids', params.ids.join(','));
  if (params.sort) q.set('sort', params.sort);
  return getJson<ListResult<ProductItem>>(`/products?${q}`);
}

export function listPublicProducts(params: { limit?: number; category?: string; ids?: string[]; sort?: string }) {
  const q = new URLSearchParams();
  q.set('limit', String(params.limit ?? 6));
  if (params.category) q.set('category', params.category);
  if (params.ids?.length) q.set('ids', params.ids.join(','));
  if (params.sort) q.set('sort', params.sort);
  return getJson<ListResult<ProductItem>>(`/public/products?${q}`);
}

export function getProduct(id: string) {
  return getJson<ProductItem>(`/products/${encodeURIComponent(id)}`);
}

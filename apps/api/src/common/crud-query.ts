export type ListQuery = {
  page?: string;
  pageSize?: string;
  limit?: string;
  search?: string;
  status?: string;
  category?: string;
  ids?: string;
  sort?: string;
};

export function parseListQuery(query: ListQuery) {
  const page = Math.max(Number(query.page || 1), 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize || query.limit || 10), 1), 100);
  const search = query.search?.trim() || '';
  const status = query.status?.trim() || '';
  const category = query.category?.trim() || '';
  const ids = String(query.ids || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
  const sort = query.sort?.trim() || '';

  return {
    page,
    pageSize,
    search,
    status,
    category,
    ids,
    sort,
    skip: (page - 1) * pageSize,
    take: ids.length ? Math.min(ids.length, 100) : pageSize
  };
}

export function parseDate(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

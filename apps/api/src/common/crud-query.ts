export type ListQuery = {
  page?: string;
  pageSize?: string;
  search?: string;
  status?: string;
};

export function parseListQuery(query: ListQuery) {
  const page = Math.max(Number(query.page || 1), 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize || 10), 1), 100);
  const search = query.search?.trim() || '';
  const status = query.status?.trim() || '';

  return {
    page,
    pageSize,
    search,
    status,
    skip: (page - 1) * pageSize,
    take: pageSize
  };
}

export function parseDate(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

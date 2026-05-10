export type NexaPublishedPage = {
  id: string;
  name: string;
  code: string;
  platform: string;
  dsl: string;
  source: string;
  status: string;
};

import { getJson } from '@/api/http';

export async function getPublishedPageByCode(code: string) {
  return getJson<NexaPublishedPage>(`/public/pages/${encodeURIComponent(code)}`);
}

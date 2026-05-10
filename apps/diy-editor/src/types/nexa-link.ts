export type NexaLinkType =
  | 'none'
  | 'home'
  | 'custom_page'
  | 'content_list'
  | 'content_detail'
  | 'activity_list'
  | 'activity_detail'
  | 'product_list'
  | 'product_detail'
  | 'external'
  | 'custom_path'
  | 'phone'
  | 'map';

/** 写入 DSL 的统一链接（与 shopxo 原 link 对象并存，使用 nexa_link 字段） */
export type NexaLink = {
  type: NexaLinkType;
  label: string;
  params: Record<string, unknown>;
};

export const emptyNexaLink = (): NexaLink => ({
  type: 'none',
  label: '',
  params: {}
});

export const NEXA_LINK_TYPE_OPTIONS: { label: string; value: NexaLinkType }[] = [
  { label: '不跳转', value: 'none' },
  { label: '首页', value: 'home' },
  { label: '自定义页面', value: 'custom_page' },
  { label: '内容列表', value: 'content_list' },
  { label: '内容详情', value: 'content_detail' },
  { label: '活动列表', value: 'activity_list' },
  { label: '活动详情', value: 'activity_detail' },
  { label: '商品列表', value: 'product_list' },
  { label: '商品详情', value: 'product_detail' },
  { label: '外部链接', value: 'external' },
  { label: '自定义路径', value: 'custom_path' },
  { label: '电话', value: 'phone' },
  { label: '地图位置', value: 'map' }
];

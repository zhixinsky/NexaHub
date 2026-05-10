export type AttachmentCategoryTreeItem = {
  id: string;
  pid: string;
  name: string;
  path: string;
  sort: number;
  is_enable: number | string;
  items?: AttachmentCategoryTreeItem[];
};

export type AttachmentListItem = {
  id: string;
  category_id?: string | null;
  url: string;
  original: string;
  title: string;
  ext: string;
  type: 'image' | 'video' | 'file' | 'icon';
  size?: number;
  add_time?: number;
  icon_class?: string;
};


/**
 * NexaHub 保存的 shopxo-diy DSL：根对象含 config 字段（常为 JSON 字符串），
 * config 内含 header/footer/diy_data/tabs_data。
 */
export type DiyConfigPayload = {
  header?: Record<string, unknown>;
  footer?: Record<string, unknown>;
  diy_data?: DiyBlock[];
  tabs_data?: unknown[];
};

export type DiyBlock = {
  key: string;
  name?: string;
  id?: string;
  /** '1' 显示，其他视为隐藏（与编辑器一致） */
  is_enable?: string;
  com_data?: Record<string, unknown>;
};

export type ParsedShopxoDsl = {
  raw: Record<string, unknown>;
  config: DiyConfigPayload;
  diyBlocks: DiyBlock[];
};

export function parseConfigObject(configVal: unknown): DiyConfigPayload {
  if (!configVal) return {};
  if (typeof configVal === 'string') {
    try {
      const o = JSON.parse(configVal);
      return typeof o === 'object' && o ? (o as DiyConfigPayload) : {};
    } catch {
      return {};
    }
  }
  if (typeof configVal === 'object') return configVal as DiyConfigPayload;
  return {};
}

export function parseShopxoDsl(dslText: string | null | undefined): ParsedShopxoDsl | null {
  const text = String(dslText || '').trim();
  if (!text || text === '{}') return null;

  let root: Record<string, unknown>;
  try {
    const p = JSON.parse(text);
    if (!p || typeof p !== 'object') return null;
    root = p as Record<string, unknown>;
  } catch {
    return null;
  }

  const nested =
    root.header || root.footer || root.diy_data || root.tabs_data
      ? (root as unknown as DiyConfigPayload)
      : null;

  const config = nested || parseConfigObject(root.config);

  let diyBlocks = Array.isArray(config.diy_data) ? (config.diy_data as DiyBlock[]) : [];
  diyBlocks = diyBlocks.filter((b) => b && typeof b.key === 'string');

  return { raw: root, config, diyBlocks };
}

export function visibleDiyBlocks(blocks: DiyBlock[]) {
  return blocks.filter((b) => String(b?.is_enable || '1') === '1');
}

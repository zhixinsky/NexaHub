/**
 * shopxo-diy UrlValue（单选 URL 模式）常见字段：page、id、name、title、link...
 */
export type ResolvedLink =
  | { kind: 'none' }
  | { kind: 'navigate'; path: string }
  | { kind: 'external'; href: string }
  | { kind: 'openLocation'; latitude: number; longitude: number; name: string };

const PATH_NORMALIZE: [string, string][] = [
  ['/pages/goods-detail/goods-detail', '/pages/product/detail'],
  ['/pages/article-detail/article-detail', '/pages/content/detail'],
  ['/pages/plugins/ask/detail/detail', '/pages/activity/detail']
];

function normalizeUniPath(full: string): string {
  const trimmed = full.trim().replace(/^\/+/, '');
  const [pathPart, qs] = trimmed.split('?', 2);
  let pathOnly = '/' + pathPart.replace(/^\/+/, '');
  for (const [from, to] of PATH_NORMALIZE) {
    if (pathOnly === from || pathOnly.startsWith(`${from}?`)) {
      pathOnly = to + pathOnly.slice(from.length);
      break;
    }
    if (pathOnly.startsWith(`${from}/`)) {
      pathOnly = to + pathOnly.slice(from.length);
      break;
    }
  }
  const out = qs !== undefined ? `${pathOnly}?${qs}` : pathOnly;
  return out.startsWith('/') ? out : `/${out}`;
}

function pickStr(obj: Record<string, unknown>, keys: string[]) {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string') {
      const s = v.trim();
      if (s) return s;
    }
  }
  return '';
}

/** 解析 shopxo-diy 链接对象为跳转信息（不触发路由）。 */
export function resolveLink(link: unknown): ResolvedLink {
  if (!link || typeof link !== 'object') return { kind: 'none' };
  const o = link as Record<string, unknown>;

  const absolute = pickStr(o, ['url', 'webview_url', 'h5']);
  if (/^https?:\/\//i.test(absolute)) return { kind: 'external', href: absolute };

  const pageLike = pickStr(o, ['page', 'path']);
  if (/^https?:\/\//i.test(pageLike)) return { kind: 'external', href: pageLike };
  if (/^tel:\/\//i.test(pageLike)) return { kind: 'external', href: `tel:${pageLike.slice('tel://'.length)}` };

  const customLink = typeof o.link === 'string' ? o.link.trim() : '';
  if (/^https?:\/\//i.test(customLink)) return { kind: 'external', href: customLink };
  if (/^tel:\/\//i.test(customLink)) return { kind: 'external', href: `tel:${customLink.slice('tel://'.length)}` };

  const candidates = [customLink, pageLike].filter((s) => s && !/^https?:/i.test(s));
  const id = typeof o.id === 'string' || typeof o.id === 'number' ? String(o.id) : '';

  for (let raw of candidates) {
    if (!raw.startsWith('/') && raw.startsWith('pages/')) raw = `/${raw}`;
    const pathNorm = normalizeUniPath(raw.startsWith('/') ? raw : `/${raw}`);
    if (pathNorm && pathNorm !== '/') return { kind: 'navigate', path: pathNorm };
  }

  if (!pageLike.startsWith('/') && pageLike.includes('/')) return { kind: 'navigate', path: normalizeUniPath(`/${pageLike}`) };

  const typeHint = String(o.event_type ?? o.type ?? '').toLowerCase();
  if (id) {
    if (typeHint.includes('goods') || typeHint.includes('product')) {
      return { kind: 'navigate', path: `/pages/product/detail?id=${encodeURIComponent(id)}` };
    }
    if (typeHint.includes('article') || typeHint.includes('blog') || typeHint.includes('content')) {
      return { kind: 'navigate', path: `/pages/content/detail?id=${encodeURIComponent(id)}` };
    }
    if (typeHint.includes('activity')) {
      return { kind: 'navigate', path: `/pages/activity/detail?id=${encodeURIComponent(id)}` };
    }
  }

  return { kind: 'none' };
}

function pickParam(params: Record<string, unknown>, k: string): string {
  const v = params[k];
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return '';
}

/** DSL 中 nexa_link：{ type, label, params } */
export function resolveNexaLink(link: unknown): ResolvedLink {
  if (!link || typeof link !== 'object') return { kind: 'none' };
  const L = link as Record<string, unknown>;
  const type = String(L.type || 'none').trim();
  const params =
    L.params && typeof L.params === 'object' && !Array.isArray(L.params)
      ? (L.params as Record<string, unknown>)
      : {};
  const pick = (k: string) => pickParam(params, k);

  switch (type) {
    case 'none':
    case '':
      return { kind: 'none' };
    case 'home': {
      const code = pick('code') || 'home';
      return { kind: 'navigate', path: `/pages/index/index?code=${encodeURIComponent(code)}` };
    }
    case 'custom_page': {
      const code = pick('pageCode') || pick('code');
      if (!code) return { kind: 'none' };
      return { kind: 'navigate', path: `/pages/index/index?code=${encodeURIComponent(code)}` };
    }
    case 'content_list':
      return { kind: 'navigate', path: '/pages/content/list' };
    case 'content_detail': {
      const id = pick('id');
      if (!id) return { kind: 'none' };
      return { kind: 'navigate', path: `/pages/content/detail?id=${encodeURIComponent(id)}` };
    }
    case 'activity_list':
      return { kind: 'navigate', path: '/pages/activity/list' };
    case 'activity_detail': {
      const id = pick('id');
      if (!id) return { kind: 'none' };
      return { kind: 'navigate', path: `/pages/activity/detail?id=${encodeURIComponent(id)}` };
    }
    case 'product_list':
      return { kind: 'navigate', path: '/pages/product/list' };
    case 'product_detail': {
      const id = pick('id');
      if (!id) return { kind: 'none' };
      return { kind: 'navigate', path: `/pages/product/detail?id=${encodeURIComponent(id)}` };
    }
    case 'external': {
      let url = pick('url');
      if (!url) return { kind: 'none' };
      if (!/^https?:\/\//i.test(url)) url = `https://${url.replace(/^\/\//, '')}`;
      return { kind: 'external', href: url };
    }
    case 'custom_path': {
      let raw = pick('path');
      if (!raw) return { kind: 'none' };
      if (!raw.startsWith('/') && raw.startsWith('pages/')) raw = `/${raw}`;
      const pathNorm = normalizeUniPath(raw.startsWith('/') ? raw : `/${raw}`);
      if (!pathNorm || pathNorm === '/') return { kind: 'none' };
      return { kind: 'navigate', path: pathNorm };
    }
    case 'phone': {
      const phone = pick('phone').replace(/^tel:/i, '');
      if (!phone) return { kind: 'none' };
      return { kind: 'external', href: `tel:${phone}` };
    }
    case 'map': {
      const lat = Number(params.latitude);
      const lng = Number(params.longitude);
      const name = pick('name') || '位置';
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { kind: 'openLocation', latitude: lat, longitude: lng, name };
      }
      const addr = pick('address');
      if (addr) {
        return { kind: 'external', href: `https://uri.amap.com/search?keyword=${encodeURIComponent(addr)}` };
      }
      return { kind: 'none' };
    }
    default:
      return { kind: 'none' };
  }
}

/**
 * 优先 nexa_link（NexaHub 业务链接），否则解析 shopxo 原 link / carousel_link / img_link。
 */
export function resolveDiyItemLink(
  item: Record<string, unknown>,
  legacyKey: 'carousel_link' | 'link' | 'img_link'
): ResolvedLink {
  const nex = item.nexa_link;
  if (nex && typeof nex === 'object') {
    const r = resolveNexaLink(nex);
    if (r.kind !== 'none') return r;
  }
  const legacy = item[legacyKey];
  return resolveLink(legacy);
}

export function invokeResolvedLink(target: ResolvedLink) {
  if (target.kind === 'none') return;

  const tryNavigate = (url: string) => {
    uni.navigateTo({
      url,
      fail() {
        uni.switchTab({ url, fail() {} });
      }
    });
  };

  switch (target.kind) {
    case 'external':
      if (target.href.startsWith('tel:')) {
        const raw = target.href.slice('tel:'.length).replace(/^\/+/, '').trim();
        if (raw) uni.makePhoneCall({ phoneNumber: raw });
        return;
      }
      try {
        if (typeof window !== 'undefined') window.open(target.href, '_blank');
      } catch {
        // ignore
      }
      break;
    case 'navigate':
      tryNavigate(target.path);
      break;
    case 'openLocation':
      uni.openLocation({
        latitude: target.latitude,
        longitude: target.longitude,
        name: target.name,
        fail() {}
      });
      break;
    default:
  }
}

export function invokeLink(link: unknown) {
  invokeResolvedLink(resolveLink(link));
}

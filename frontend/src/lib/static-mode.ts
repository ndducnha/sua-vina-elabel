/**
 * Static-mode adapter: turns the internal app into a fully client-side
 * GitHub-Pages-ready demo without any backend.
 *
 * Activated when `VITE_STATIC_MODE === "true"`. The frontend's axios instance
 * uses {@link staticAdapter} which intercepts requests for known endpoints and
 * returns mock responses synthesized from `/public/data/products.json` plus
 * a small in-memory + localStorage overlay for writes (sync state, edits).
 */
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

export const STATIC_MODE = import.meta.env.VITE_STATIC_MODE === 'true';

type Json = unknown;

interface StaticDataset {
  generated_at: string;
  business: { tax_code?: string; company_name?: string; business_email?: string; business_phone?: string; address?: string };
  products: any[];
}

let cache: StaticDataset | null = null;
let inflight: Promise<StaticDataset> | null = null;

async function loadDataset(): Promise<StaticDataset> {
  if (cache) return cache;
  if (inflight) return inflight;
  // Always resolve relative to the Vite `base` so it works under /<repo>/internal/
  const url = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '') + '/data/products.json';
  inflight = fetch(url)
    .then((r) => r.json() as Promise<StaticDataset>)
    .then((d) => {
      cache = d;
      return d;
    });
  return inflight;
}

function ok(data: Json, config: InternalAxiosRequestConfig, status = 200): AxiosResponse {
  return {
    data: { data, status, version: '0.1.0-static' },
    status,
    statusText: 'OK',
    headers: {},
    config,
  } as AxiosResponse;
}

function notFound(config: InternalAxiosRequestConfig): AxiosResponse {
  return {
    data: { message: 'Not found in static dataset', status: 404 },
    status: 404,
    statusText: 'Not Found',
    headers: {},
    config,
  } as AxiosResponse;
}

const ADMIN = {
  id: 'static-admin-id',
  username: 'admin',
  role: 'admin',
  is_gs1_user: false,
};

function fakeToken(): string {
  // Real JWT format so payloads decode; signature is bogus.
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '');
  const payload = btoa(
    JSON.stringify({ sub: `${ADMIN.id}:${ADMIN.username}`, iat: Date.now() / 1000, exp: Date.now() / 1000 + 86400 * 30 }),
  ).replace(/=/g, '');
  return `${header}.${payload}.static-signature`;
}

async function handle(config: InternalAxiosRequestConfig): Promise<AxiosResponse> {
  const method = (config.method ?? 'get').toLowerCase();
  // Strip query string for matching; reapply query params via URLSearchParams
  const rawUrl = (config.url ?? '').replace(/^\/+/, '');
  const [pathOnly, queryString] = rawUrl.split('?');
  const path = '/' + pathOnly.replace(/^api\//, '');
  const query = new URLSearchParams(queryString ?? '');

  // ---- AUTH ----
  if (method === 'post' && path === '/auth/login') {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    if (body?.username === 'admin' && body?.password === '123456') {
      return ok(
        {
          access_token: fakeToken(),
          refresh_token: 'static-refresh-token',
          expires_in: 86400 * 30,
          refresh_expires_in: 86400 * 60,
          token_type: 'Bearer',
        },
        config,
      );
    }
    return Promise.reject({
      response: {
        data: { message: 'Tài khoản hoặc mật khẩu không đúng (demo: admin / 123456)' },
        status: 401,
      },
      isAxiosError: true,
      config,
    });
  }

  if (method === 'post' && path === '/auth/refresh') {
    return ok(
      { access_token: fakeToken(), refresh_token: 'static-refresh-token', expires_in: 86400 * 30, refresh_expires_in: 86400 * 60, token_type: 'Bearer' },
      config,
    );
  }

  if (method === 'post' && (path === '/auth/logout' || path === '/auth/logout-all')) {
    return ok(null, config, 204);
  }

  if (method === 'get' && path === '/auth/business/exists') {
    return ok({ exists: false }, config);
  }

  // ---- USERS ----
  if (method === 'get' && path === '/users/me') {
    const ds = await loadDataset();
    return ok(
      {
        id: ADMIN.id,
        username: ADMIN.username,
        role: ADMIN.role,
        is_gs1_user: ADMIN.is_gs1_user,
        business: {
          address: ds.business.address ?? '88 Đại lộ Sữa, Quận 1, TP.HCM',
          business_license_number: 'GP-SUAVINA-001',
          company_name: ds.business.company_name ?? 'Công ty Cổ phần Sữa Vina',
          email: ds.business.business_email ?? 'admin@suavina.local',
          license_issued_date: null,
          license_issued_place: null,
          phone: ds.business.business_phone ?? '0901234567',
          tax_code: ds.business.tax_code ?? '0312345678',
        },
        representative: {
          address: null,
          email: null,
          full_name: 'Quản trị viên Sữa Vina',
          identity_number: null,
          phone: null,
        },
      },
      config,
    );
  }

  // ---- PRODUCTS ----
  if (method === 'get' && path === '/products') {
    const ds = await loadDataset();
    const limit = parseInt(query.get('limit') ?? '20', 10);
    const page = parseInt(query.get('page') ?? '1', 10);
    const q = (query.get('q') ?? '').trim().toLowerCase();
    const statusCsv = query.get('status') ?? '';
    const allowed = statusCsv ? new Set(statusCsv.split(',').map((s) => s.trim())) : null;

    let list = ds.products.slice();
    if (q) {
      list = list.filter(
        (p) =>
          String(p.gtin ?? '').toLowerCase().includes(q) ||
          String(p.name ?? '').toLowerCase().includes(q),
      );
    }
    if (allowed) list = list.filter((p) => allowed.has(p.status));
    const total = list.length;
    const slice = list.slice((page - 1) * limit, page * limit);

    return ok({ items: slice, total, page, limit, total_pages: Math.ceil(total / limit) }, config);
  }

  // /products/by-code?gtin=... or ?sku=...
  if (method === 'get' && path === '/products/by-code') {
    const ds = await loadDataset();
    const gtin = query.get('gtin');
    const sku = query.get('sku');
    const found = ds.products.find((p) =>
      gtin ? p.gtin === gtin : sku ? p.sku === sku : false,
    );
    return found ? ok(found, config) : notFound(config);
  }

  // /products/:id  and  /products/:id/...
  const productIdMatch = path.match(/^\/products\/([^/]+)(?:\/(.*))?$/);
  if (method === 'get' && productIdMatch) {
    const id = productIdMatch[1];
    const rest = productIdMatch[2] ?? '';
    const ds = await loadDataset();
    const product = ds.products.find((p) => p.id === id);
    if (!product) return notFound(config);
    if (!rest) return ok(product, config);
    if (rest === 'batches') return ok(product.batches ?? [], config);
    if (rest === 'versions') return ok({ items: [product], total: 1 }, config);
  }

  // ---- TAXONOMY / CATALOG / DASHBOARD ----
  if (method === 'get' && path === '/product-groups') {
    return ok([], config);
  }
  if (method === 'get' && (path === '/segments' || path === '/families' || path === '/classes' || path === '/bricks')) {
    return ok([], config);
  }
  if (method === 'get' && path === '/fields') {
    return ok([], config);
  }
  if (method === 'get' && path === '/dashboard') {
    const ds = await loadDataset();
    return ok(
      {
        products: ds.products.length,
        batches: ds.products.reduce((s, p) => s + (p.batches?.length ?? 0), 0),
        qrJobs: 0,
      },
      config,
    );
  }
  if (method === 'get' && path === '/audit-logs') {
    return ok({ items: [], total: 0 }, config);
  }
  if (method === 'get' && path === '/api-keys') {
    return ok([], config);
  }

  // ---- QR SCAN ----
  if (method === 'get' && path === '/qr/scan') {
    const ds = await loadDataset();
    const gtin = query.get('gtin');
    const taxCode = query.get('tax_code');
    const batchCode = query.get('batch_code');
    const product = ds.products.find(
      (p) => p.gtin === gtin && (!taxCode || p.tax_code === taxCode),
    );
    if (!product) return notFound(config);
    const highlight = batchCode ? product.batches?.find((b: any) => b.batch_code === batchCode) : product.batches?.[0];
    return ok({ product, batch: highlight ?? null }, config);
  }

  // ---- WRITES — accept and pretend success (local-only overlay) ----
  if (['post', 'patch', 'put', 'delete'].includes(method)) {
    return ok({ success: true, demo: 'Write ignored in static demo (no persistence)' }, config);
  }

  // Fallback
  return notFound(config);
}

export const staticAdapter: AxiosAdapter = async (config) => {
  return handle(config as InternalAxiosRequestConfig);
};

/**
 * Mark Vite-injected env vars so users know they're in demo mode.
 */
export function staticModeBannerText(): string | null {
  if (!STATIC_MODE) return null;
  return 'Phiên bản demo — dữ liệu tĩnh, không có backend.';
}

/**
 * Unified API client for calling the NestJS backend.
 *
 * Server components: import { serverApi } from '@/lib/api'
 * Client components: import { api } from '@/lib/api'
 */

import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
const CLIENT_KEY = process.env.NEXT_PUBLIC_CLIENT_KEY;

type FetchOptions = RequestInit & { token?: string };

// ─── Server-side (Server Components, Route Handlers) ─────────────────────────

export async function serverApi(path: string, options: FetchOptions = {}) {
  const session = await getServerSession(authOptions);
  const token = (session as any)?.apiToken;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(CLIENT_KEY ? { 'X-Client-Key': CLIENT_KEY } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err?.error || err?.message || `API error ${res.status}`);
  }

  const body = await res.json();
  return body?.data !== undefined ? body.data : body;
}

// ─── Client-side helper (reads token from window.__JWT set by SessionSync) ───

export async function clientApi(path: string, options: FetchOptions = {}) {
  const token = typeof window !== 'undefined' ? (window as any).__JWT : undefined;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(CLIENT_KEY ? { 'X-Client-Key': CLIENT_KEY } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err?.error || err?.message || `API error ${res.status}`);
  }

  const body = await res.json();
  return body?.data !== undefined ? body.data : body;
}

// Convenience wrappers
export const api = {
  get:    (path: string) => clientApi(path),
  post:   (path: string, data: any) => clientApi(path, { method: 'POST', body: JSON.stringify(data) }),
  patch:  (path: string, data: any) => clientApi(path, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (path: string) => clientApi(path, { method: 'DELETE' }),
};

export const server = {
  get:    (path: string) => serverApi(path),
  post:   (path: string, data: any) => serverApi(path, { method: 'POST', body: JSON.stringify(data) }),
  patch:  (path: string, data: any) => serverApi(path, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (path: string) => serverApi(path, { method: 'DELETE' }),
};

import type { APIRequestContext } from '@playwright/test';

const DEFAULT_API = 'https://medmate-backend-176393011547.asia-southeast1.run.app';

export function defaultApiBase(): string {
  const raw = process.env.E2E_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API;
  return raw.replace(/\/$/, '');
}

/** True when tests should hit real backend (no auth/roster mocks). */
export function useRealBackend(): boolean {
  const token = process.env.E2E_AUTH_TOKEN?.trim();
  if (token) return true;
  const email = process.env.E2E_EMAIL?.trim();
  const password = process.env.E2E_PASSWORD?.trim();
  return Boolean(email && password);
}

export function playwrightOrigin(): string {
  const u = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000';
  return u.replace(/\/$/, '');
}

export async function loginAccessToken(
  request: APIRequestContext,
  apiBase: string,
  email: string,
  password: string,
): Promise<string> {
  const res = await request.post(`${apiBase}/auth/login`, {
    headers: { 'Content-Type': 'application/json' },
    data: { email, password },
  });
  if (!res.ok()) {
    const text = await res.text().catch(() => '');
    throw new Error(`POST /auth/login failed: ${res.status()} ${text}`);
  }
  const body = (await res.json()) as { access_token?: string };
  if (!body.access_token) {
    throw new Error('Login JSON missing access_token');
  }
  return body.access_token;
}

export async function resolveAccessToken(request: APIRequestContext): Promise<string> {
  const fromEnv = process.env.E2E_AUTH_TOKEN?.trim();
  if (fromEnv) return fromEnv;
  const email = process.env.E2E_EMAIL?.trim();
  const password = process.env.E2E_PASSWORD?.trim();
  if (!email || !password) {
    throw new Error('Set E2E_AUTH_TOKEN or both E2E_EMAIL and E2E_PASSWORD for real-backend mode');
  }
  return loginAccessToken(request, defaultApiBase(), email, password);
}

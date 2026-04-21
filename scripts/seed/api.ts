import { API_BASE_URL } from './config.js';

export async function post<T>(path: string, body?: unknown): Promise<T> {
  const resp: Response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`POST ${path} failed (${resp.status}): ${text}`);
  }

  return (await resp.json()) as T;
}

export async function get<T>(path: string): Promise<T> {
  const resp: Response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`GET ${path} failed (${resp.status}): ${text}`);
  }

  return (await resp.json()) as T;
}

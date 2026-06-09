const base = import.meta.env.DEV ? "" : "http://127.0.0.1:10783";
const TIMEOUT_MS = 120_000;

async function parseErr(r: Response): Promise<string> {
  try {
    const j = await r.json();
    if (j && typeof j.detail === "string") return j.detail;
    return JSON.stringify(j);
  } catch {
    return `${r.status} ${r.statusText}`;
  }
}

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const r = await fetchWithTimeout(`${base}${path}`);
  if (!r.ok) throw new Error(await parseErr(r));
  return r.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const r = await fetchWithTimeout(`${base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await parseErr(r));
  return r.json() as Promise<T>;
}

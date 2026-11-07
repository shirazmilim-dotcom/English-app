// עטיפת fetch: כותרת CSRF, JSON, והודעות שגיאה ידידותיות בעברית
export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function api(path, { method = 'GET', body, raw, headers = {}, timeout = 45000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      signal: ctrl.signal,
      headers: {
        'X-Requested-With': 'english-app',
        ...(body !== undefined && !raw ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
  } catch (e) {
    clearTimeout(timer);
    if (e.name === 'AbortError') throw new ApiError('הבקשה לקחה יותר מדי זמן. ייתכן שהחיבור חלש – נסו שוב.', 0);
    throw new ApiError(navigator.onLine === false ? 'אין חיבור לאינטרנט. בדקו את החיבור ונסו שוב.' : 'בעיית תקשורת עם השרת. נסו שוב בעוד רגע.', 0);
  }
  clearTimeout(timer);
  const type = res.headers.get('Content-Type') || '';
  if (!res.ok) {
    const data = type.includes('json') ? await res.json().catch(() => ({})) : {};
    throw new ApiError(data.error || 'משהו השתבש. נסו שוב.', res.status, data);
  }
  if (type.includes('json')) return res.json();
  return res.blob();
}

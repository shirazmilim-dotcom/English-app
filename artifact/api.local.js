// במקום fetch לשרת: אותו קוד שרת רץ בתוך הדפדפן
import { app } from '../server/index.js';

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function api(path, { method = 'GET', body } = {}) {
  let r;
  try {
    r = await app.handle(method, `/api${path}`, body === undefined ? undefined : JSON.parse(JSON.stringify(body)));
  } catch (e) {
    throw new ApiError(e?.message || 'משהו השתבש. נסו שוב.', 500);
  }
  if (r.status >= 400) throw new ApiError(r.data?.error || 'משהו השתבש. נסו שוב.', r.status, r.data);
  return r.data;
}

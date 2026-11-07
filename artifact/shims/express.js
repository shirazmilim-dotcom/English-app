// מימוש מינימלי של Express שרץ בתוך הדפדפן: אותם נתיבים של השרת, בלי רשת.
const stack = [];
function compile(path) {
  if (path instanceof RegExp) return { re: path, keys: [] };
  const keys = [];
  const re = new RegExp('^' + path.replace(/\/:([A-Za-z_]+)/g, (_, k) => (keys.push(k), '/([^/]+)')) + '/?$');
  return { re, keys };
}
function add(method, path, handlers) {
  const { re, keys } = compile(path);
  stack.push({ method, re, keys, handlers, prefix: null });
}
const app = {
  set() {},
  use(a, ...rest) {
    if (typeof a === 'string') stack.push({ method: null, prefix: a, handlers: rest });
    else stack.push({ method: null, prefix: '', handlers: [a, ...rest] });
  },
  get: (p, ...h) => add('GET', p, h),
  post: (p, ...h) => add('POST', p, h),
  put: (p, ...h) => add('PUT', p, h),
  delete: (p, ...h) => add('DELETE', p, h),
  listen() {},
  async handle(method, url, body) {
    const [path] = url.split('?');
    const req = {
      method, path, url, body, params: {}, cookies: {}, ip: 'local', protocol: 'https',
      get: (h) => (h.toLowerCase() === 'x-requested-with' ? 'english-app' : h.toLowerCase() === 'host' ? 'local' : undefined),
    };
    let result = { status: 200, data: null };
    let done = false;
    const res = {
      statusCode: 200,
      status(c) { this.statusCode = c; return this; },
      json(d) { result = { status: this.statusCode, data: d }; done = true; return this; },
      send(d) { result = { status: this.statusCode, data: d }; done = true; return this; },
      set() { return this; },
      cookie() { return this; },
      clearCookie() { globalThis.__trialClearSession?.(); return this; },
      sendFile() { done = true; },
    };
    for (const layer of stack) {
      if (done) break;
      let match;
      if (layer.method === null) {
        if (!path.startsWith(layer.prefix)) continue;
      } else {
        if (layer.method !== method) continue;
        match = path.match(layer.re);
        if (!match) continue;
        req.params = Object.fromEntries(layer.keys.map((k, i) => [k, decodeURIComponent(match[i + 1])]));
      }
      for (const h of layer.handlers) {
        if (done) break;
        let nextCalled = false;
        await h(req, res, () => (nextCalled = true));
        if (!nextCalled) break;
      }
    }
    return result;
  },
};
function express() { return app; }
express.json = () => (_q, _s, n) => n();
express.raw = () => (_q, _s, n) => n();
express.static = () => (_q, _s, n) => n();
export default express;

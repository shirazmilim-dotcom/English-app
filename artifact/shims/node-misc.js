export const existsSync = () => false;
export const mkdirSync = () => {};
export const join = (...a) => a.join('/');
export const dirname = () => '/';
export const fileURLToPath = () => '/app/server/index.js';
export default { existsSync, mkdirSync, join, dirname, fileURLToPath };

// בניית גרסת הניסיון: קובץ HTML יחיד שמריץ את השרת והממשק בדפדפן
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import fs from 'node:fs';
import path from 'node:path';

const r = (p) => path.resolve(import.meta.dirname, p);
const shims = {
  express: r('artifact/shims/express.js'),
  'cookie-parser': r('artifact/shims/cookie-parser.js'),
  'node:sqlite': r('artifact/shims/sqlite.js'),
  'node:fs': r('artifact/shims/node-misc.js'),
  'node:path': r('artifact/shims/node-misc.js'),
  'node:url': r('artifact/shims/node-misc.js'),
  '@anthropic-ai/sdk': r('artifact/shims/anthropic.js'),
};

function trialResolver() {
  return {
    name: 'trial-resolver',
    enforce: 'pre',
    resolveId(source, importer) {
      if (shims[source]) return shims[source];
      if (source === 'virtual:sql-wasm') return '\0sql-wasm';
      if (!importer) return null;
      const from = importer.replace(/\\/g, '/');
      if (from.endsWith('/server/index.js') && source === './auth.js') return r('artifact/shims/auth.js');
      if (from.includes('/server/') && source === './mailer.js') return r('artifact/shims/mailer.js');
      if (from.includes('/client/src/') && /(^|\/)api\.js$/.test(source)) return r('artifact/api.local.js');
      return null;
    },
    load(id) {
      if (id === '\0sql-wasm') return `export default ${JSON.stringify(fs.readFileSync(r('node_modules/sql.js/dist/sql-wasm.wasm')).toString('base64'))};`;
    },
  };
}

export default defineConfig({
  root: 'artifact',
  plugins: [trialResolver(), react(), viteSingleFile()],
  define: { 'process.env.NODE_ENV': '"production"', 'process.env': 'globalThis.__ENV' },
  build: { outDir: r('artifact/dist'), emptyOutDir: true, target: 'es2022' },
});

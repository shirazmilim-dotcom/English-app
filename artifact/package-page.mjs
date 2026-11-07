// ממיר את ה-HTML הבנוי לתבנית של עמוד Artifact (בלי doctype/html/head/body)
import fs from 'node:fs';
const src = fs.readFileSync('artifact/dist/index.html', 'utf8');
const head = src.match(/<head>([\s\S]*?)<\/head>/)[1];
const body = src.match(/<body>([\s\S]*?)<\/body>/)[1];
const title = head.match(/<title>[\s\S]*?<\/title>/)[0];
const rest = head.replace(/<meta[^>]*>/g, '').replace(title, '');
fs.writeFileSync('artifact/dist/english-coach.html', `${title}\n${rest.trim()}\n${body.trim()}\n`);
console.log('ok', fs.statSync('artifact/dist/english-coach.html').size);

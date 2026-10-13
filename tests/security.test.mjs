// Repository-wide scan for secrets, personal data and removed integrations.
// Patterns are assembled from fragments so this file does not match itself.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ROOT } from './lib/paths.mjs';

const SKIP_DIRS = new Set(['.git', 'node_modules']);
const files = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (!SKIP_DIRS.has(entry)) walk(full);
    } else {
      files.push(full);
    }
  }
})(ROOT);

const f = (...parts) => parts.join('');
const RULES = [
  { name: 'session cookie names', re: new RegExp(f('YM', 'MD', '|__cf', '_bm|_f', 'bp=|_cl', 'ck=|_cl', 'sk=|_pk', '_id|_gcl', '_au'), 'i') },
  { name: 'removed job portal', re: new RegExp(f('you', 'mmday'), 'i') },
  { name: 'removed scraping source', re: new RegExp(f('linked', 'in'), 'i') },
  { name: 'Google Sheet URL', re: new RegExp(f('docs\\.google\\.com/', 'spreadsheets/d/'), 'i') },
  { name: 'Cookie header', re: new RegExp(f('"Coo', 'kie"')) },
  { name: 'n8n instance metadata', re: new RegExp(f('instance', 'Id')) },
  { name: 'Bearer token', re: new RegExp(f('Bear', 'er\\s+[A-Za-z0-9._-]{20,}')) },
  { name: 'private key', re: new RegExp(f('BEGIN [A-Z ]*PRIVATE', ' KEY')) },
  { name: 'GitHub token', re: new RegExp(f('gh[pousr]', '_[A-Za-z0-9]{30,}')) },
  { name: 'Google API key', re: new RegExp(f('AI', 'za[0-9A-Za-z_-]{30,}')) },
  { name: 'AWS key', re: new RegExp(f('AK', 'IA[0-9A-Z]{16}')) },
  { name: 'Slack token', re: new RegExp(f('xo', 'x[abpr]-[A-Za-z0-9-]{10,}')) },
  { name: '64-char hex string', re: /\b[0-9a-f]{64}\b/i },
  { name: 'local Windows user path', re: new RegExp(f('C:\\\\', 'Users\\\\'), 'i') },
];

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const ALLOWED_EMAIL = /@example\.(com|org|net)$/i;

test('repository contains files to scan', () => {
  assert.ok(files.length > 10);
});

for (const rule of RULES) {
  test(`no ${rule.name} in any file`, () => {
    const hits = files.filter((file) => rule.re.test(readFileSync(file, 'utf8'))).map((file) => relative(ROOT, file));
    assert.deepEqual(hits, []);
  });
}

test('only example.com email addresses appear', () => {
  const hits = [];
  for (const file of files) {
    for (const m of readFileSync(file, 'utf8').matchAll(EMAIL)) {
      if (!ALLOWED_EMAIL.test(m[0])) hits.push(`${relative(ROOT, file)}: ${m[0]}`);
    }
  }
  assert.deepEqual(hits, []);
});

test('no .env or private workflow exports are present', () => {
  const bad = files
    .map((file) => relative(ROOT, file).replace(/\\/g, '/'))
    .filter((p) => /(^|\/)\.env$/.test(p) || /Version \d/.test(p) || /\.private\./.test(p));
  assert.deepEqual(bad, []);
});

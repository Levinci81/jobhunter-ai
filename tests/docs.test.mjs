// Documentation checks: local links resolve, the three languages stay structurally in sync.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { ROOT } from './lib/paths.mjs';

const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const docs = readdirSync(join(ROOT, 'docs')).filter((f) => f.endsWith('.md')).map((f) => `docs/${f}`);
const markdown = ['README.md', 'README.de.md', 'README.it.md', 'SECURITY.md', 'CHANGELOG.md', ...docs];

const TRIPLETS = [
  ['README.md', 'README.de.md', 'README.it.md'],
  ...['architecture', 'setup', 'testing', 'recruiter-summary'].map((d) => ['en', 'de', 'it'].map((l) => `docs/${d}.${l}.md`)),
];

const stripCode = (md) => md.replace(/```[\s\S]*?```/g, '');
const headings = (md, level) => stripCode(md).split('\n').filter((l) => l.startsWith(`${'#'.repeat(level)} `));

test('all expected documentation files exist', () => {
  for (const file of TRIPLETS.flat()) assert.ok(existsSync(join(ROOT, file)), `missing ${file}`);
});

test('all relative markdown links resolve to existing files', () => {
  const broken = [];
  for (const file of markdown) {
    for (const [, target] of stripCode(read(file)).matchAll(/\]\(([^)\s]+)\)/g)) {
      if (/^(https?:|mailto:|#)/.test(target)) continue;
      const path = join(ROOT, dirname(file), decodeURIComponent(target.split('#')[0]));
      if (!existsSync(path)) broken.push(`${file} -> ${target}`);
    }
  }
  assert.deepEqual(broken, []);
});

test('external links only point to expected hosts', () => {
  const allowed = /^https:\/\/(github\.com|docs\.github\.com|docs\.n8n\.io|www\.arbeitnow\.com|remotive\.com|nodejs\.org|n8n\.io|choosealicense\.com)(\/|$)/;
  const bad = [];
  for (const file of markdown) {
    for (const [, target] of stripCode(read(file)).matchAll(/\]\((https?:[^)\s]+)\)/g)) {
      if (!allowed.test(target)) bad.push(`${file} -> ${target}`);
    }
  }
  assert.deepEqual(bad, []);
});

for (const [en, de, it] of TRIPLETS) {
  test(`${en}: DE and IT versions have the same structure as EN`, () => {
    const [e, d, i] = [en, de, it].map(read);
    for (const level of [2, 3]) {
      assert.equal(headings(d, level).length, headings(e, level).length, `${de} h${level}`);
      assert.equal(headings(i, level).length, headings(e, level).length, `${it} h${level}`);
    }
    const blocks = (md) => (md.match(/```/g) || []).length;
    assert.equal(blocks(d), blocks(e), `${de} code blocks`);
    assert.equal(blocks(i), blocks(e), `${it} code blocks`);
    const tableRows = (md) => stripCode(md).split('\n').filter((l) => l.startsWith('|')).length;
    assert.equal(tableRows(d), tableRows(e), `${de} table rows`);
    assert.equal(tableRows(i), tableRows(e), `${it} table rows`);
  });
}

test('every README links to the other two languages', () => {
  for (const file of ['README.md', 'README.de.md', 'README.it.md']) {
    const md = read(file);
    for (const other of ['README.md', 'README.de.md', 'README.it.md'].filter((x) => x !== file)) {
      assert.ok(md.includes(`](${other})`), `${file} does not link ${other}`);
    }
  }
});

test('copyright is stated consistently and no open-source license is added', () => {
  const notice = 'Copyright (c) 2026 Levinci81. All rights reserved.';
  for (const file of ['README.md', 'README.de.md', 'README.it.md']) {
    assert.ok(read(file).includes(notice), `${file} lacks the copyright notice`);
  }
  for (const name of ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'COPYING']) {
    assert.ok(!existsSync(join(ROOT, name)), `${name} must not exist`);
  }
  assert.equal(JSON.parse(read('package.json')).license, 'UNLICENSED');
  for (const file of markdown) {
    assert.ok(!/\b(MIT|Apache|GPL|BSD|MPL)[- ]?(license|licence|lizenz|licenza)\b/i.test(read(file)), `${file} mentions an open-source license`);
  }
});

test('AI scoring is only described as planned, never as an existing feature', () => {
  for (const file of markdown) {
    for (const line of read(file).split('\n')) {
      if (/\b(LLM|GPT|machine learning|KI-Bewertung|AI scoring|valutazione (con )?IA)\b/i.test(line)) {
        assert.match(line, /plan|geplant|pianificat|roadmap|not |nicht |non |kein|nessun/i, `${file}: "${line.trim()}"`);
      }
    }
  }
});

// End-to-end offline simulation of the workflow with synthetic fixtures.
// Network access is blocked for the whole test file.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import https from 'node:https';
import { loadWorkflow, runWorkflow } from './lib/simulator.mjs';
import { WORKFLOW_PATH, loadFixtures } from './lib/paths.mjs';

const blocked = [];
const originals = {};
before(() => {
  const block = (name) => () => {
    blocked.push(name);
    throw new Error(`Network access blocked in tests (${name})`);
  };
  originals.fetch = globalThis.fetch;
  originals.httpRequest = http.request;
  originals.httpsRequest = https.request;
  globalThis.fetch = block('fetch');
  http.request = block('http.request');
  https.request = block('https.request');
});
after(() => {
  globalThis.fetch = originals.fetch;
  http.request = originals.httpRequest;
  https.request = originals.httpsRequest;
});

const wf = loadWorkflow(WORKFLOW_PATH);
const run = (fixtures = loadFixtures()) => runWorkflow(wf, { fixtures });
const urls = (items) => items.map((i) => i.json.url);
const slugs = (items) => items.map((i) => i.json.slug);

test('full run executes every node, uses only fixtures and makes no network calls', () => {
  const r = run();
  assert.equal(r.skipped.length, 0);
  assert.equal(r.executed.length, 17);
  assert.deepEqual(r.httpCalls.map((c) => c.node).sort(), ['Fetch Arbeitnow Jobs', 'Fetch Remotive Jobs']);
  assert.deepEqual(blocked, []);
});

test('Arbeitnow branch: remote only, max. 7 days old, support roles without sales', () => {
  const r = run();
  // A2 (remote=false) and A12 (remote="true" as string) removed
  assert.deepEqual(slugs(r.outputs['Remote Only']), ['a1', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9', 'a10', 'a11']);
  // A3 (10 days old) and A7 (future date) removed
  assert.deepEqual(slugs(r.outputs['Posted Within 7 Days']), ['a1', 'a4', 'a5', 'a6', 'a8', 'a9', 'a10', 'a11']);
  // A4 (sales) and A5 (no support keyword) removed; A11 (no title) passes via its description without crashing
  assert.deepEqual(slugs(r.outputs['Support Roles Without Sales']), ['a1', 'a6', 'a8', 'a9', 'a10', 'a11']);
});

test('Remotive branch: every job is tagged with source=remotive and fed once into the merge', () => {
  const r = run();
  const tagged = r.outputs['Tag Source Remotive'];
  assert.equal(tagged.length, 6);
  assert.ok(tagged.every((i) => i.json.source === 'remotive'));
  assert.equal(r.outputs['Combine Sources'].length, 6 + 6);
});

test('title/region filter, URL validation, title check and URL de-duplication', () => {
  const r = run();
  const region = urls(r.outputs['Support Title or Target Region']);
  assert.ok(!region.includes('https://example.com/jobs/r4')); // neither title nor region
  assert.ok(!region.includes('https://example.com/jobs/r6')); // no title, numeric location
  assert.ok(region.includes('https://example.com/jobs/r2')); // region "Worldwide"
  assert.ok(region.includes('https://example.com/jobs/a11')); // region "Italy", no title
  assert.equal(region.length, 10);

  const normalized = urls(r.outputs['Normalize Job Schema']);
  assert.ok(!normalized.includes('javascript:alert(1)')); // A10 dropped: not an http(s) URL
  assert.equal(normalized.length, 9);

  const titled = urls(r.outputs['Support Title Check']);
  assert.ok(!titled.includes('https://example.com/jobs/r2')); // not a support title
  assert.ok(!titled.includes('https://example.com/jobs/a11')); // empty title
  assert.equal(titled.length, 7);

  assert.deepEqual(urls(r.outputs['Deduplicate by URL']), [
    'https://example.com/jobs/r1',
    'https://example.com/jobs/shared',
    'https://example.com/jobs/a1',
    'https://example.com/jobs/a8',
    'https://example.com/jobs/a9',
  ]);
  const shared = r.outputs['Deduplicate by URL'].find((i) => i.json.url === 'https://example.com/jobs/shared');
  assert.equal(shared.json.source, 'remotive'); // first occurrence (Remotive, merge input 0) wins
});

test('known limitation is reproduced: substring "eu" in "Deutschland" satisfies the region condition', () => {
  const r = run();
  const a8 = r.outputs['Support Title or Target Region'].find((i) => i.json.url === 'https://example.com/jobs/a8');
  assert.ok(a8, 'A8 passes only via the location condition');
});

test('normalized schema: ten text fields, source defaults to arbeitnow, Unix timestamps become ISO 8601', () => {
  const r = run();
  const rows = r.outputs['Normalize Job Schema'];
  for (const row of rows) {
    assert.deepEqual(Object.keys(row.json), [
      'title', 'company', 'location', 'salary', 'job_type', 'language', 'remote_region', 'source', 'date', 'url',
    ]);
    assert.ok(Object.values(row.json).every((v) => typeof v === 'string'));
  }
  const byUrl = (u) => rows.find((i) => i.json.url === u).json;
  assert.equal(byUrl('https://example.com/jobs/a1').source, 'arbeitnow');
  assert.equal(byUrl('https://example.com/jobs/a1').date, '2026-10-11T08:00:00.000Z');
  assert.equal(byUrl('https://example.com/jobs/a9').job_type, 'full time, part time');
  assert.equal(byUrl('https://example.com/jobs/r1').date, '2026-10-10T08:15:00'); // ISO strings unchanged
  assert.equal(byUrl('https://example.com/jobs/r1').location, 'Europe');
});

test('Google Sheets receives one upsert with 5 rows matched on url', () => {
  const r = run();
  assert.equal(r.sheetWrites.length, 1);
  const [write] = r.sheetWrites;
  assert.equal(write.operation, 'appendOrUpdate');
  assert.deepEqual(write.matchingColumns, ['url']);
  assert.equal(write.rows.length, 5);
  assert.deepEqual(write.rows.map((row) => row.source), ['remotive', 'remotive', 'arbeitnow', 'arbeitnow', 'arbeitnow']);
});

test('exactly one digest email with the correct count, sent to the placeholder address', () => {
  const r = run();
  assert.equal(r.sentEmails.length, 1);
  const [mail] = r.sentEmails;
  assert.equal(mail.subject, 'Jobhunter AI Agent – 5 neue Jobtreffer');
  assert.equal(mail.to, 'you@example.com');
  assert.match(mail.html, /<strong>5<\/strong> passende Jobs/);
  assert.equal((mail.html.match(/<h3>/g) || []).length, 5);
  assert.equal((mail.html.match(/<a href="https:\/\/example\.com\//g) || []).length, 5);
});

test('email HTML escapes tags, ampersands and quotes from job data', () => {
  const { html } = run().sentEmails[0];
  assert.ok(!html.includes('<script>'), 'raw script tag in email');
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(html.includes('Evil &amp; Co &lt;b&gt;&quot;quoted&quot;'));
  assert.ok(!/href="javascript:/i.test(html));
});

test('empty API results: nodes after the empty branches are skipped and no email is sent', () => {
  const r = run({ 'Fetch Arbeitnow Jobs': { data: [] }, 'Fetch Remotive Jobs': { jobs: [] } });
  assert.equal(r.sheetWrites.length, 0);
  assert.equal(r.sentEmails.length, 0);
  assert.ok(r.skipped.includes('Send Email Digest'));
});

test('one source empty: the other source is still processed and emailed', () => {
  const fixtures = loadFixtures();
  fixtures['Fetch Arbeitnow Jobs'] = { data: [] };
  const r = run(fixtures);
  assert.equal(r.sheetWrites[0].rows.length, 2); // R1 and R3
  assert.equal(r.sentEmails[0].subject, 'Jobhunter AI Agent – 2 neue Jobtreffer');
});

test('unexpected response without the expected array is treated as empty (simulator assumption)', () => {
  const fixtures = loadFixtures();
  fixtures['Fetch Arbeitnow Jobs'] = { error: 'rate limited' };
  const r = run(fixtures);
  assert.equal(r.outputs['Split Arbeitnow Jobs'].length, 0);
  assert.equal(r.sentEmails.length, 1);
});

test('response with a non-array data field stops the run (simulator assumption)', () => {
  const fixtures = loadFixtures();
  fixtures['Fetch Arbeitnow Jobs'] = { data: 'unexpected' };
  assert.throws(() => run(fixtures), /is not an array/);
});

test('missing fixture fails loudly instead of reaching the network', () => {
  const fixtures = loadFixtures();
  delete fixtures['Fetch Remotive Jobs'];
  assert.throws(() => run(fixtures), /network access is not allowed/);
  assert.deepEqual(blocked, []);
});

// Unit tests for single nodes with synthetic edge cases: missing fields, odd types,
// invalid dates and URLs, HTML special characters and region matching.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadWorkflow, runNode, FIXED_NOW } from './lib/simulator.mjs';
import { WORKFLOW_PATH } from './lib/paths.mjs';

const wf = loadWorkflow(WORKFLOW_PATH);
const node = (name, items) => runNode(wf, name, items);
const SECONDS = (ms) => Math.floor(ms / 1000);
const DAY = 24 * 60 * 60 * 1000;

test('Remote Only: only the boolean true passes; strings, numbers, null and missing values are dropped', () => {
  const out = node('Remote Only', [
    { id: 1, remote: true },
    { id: 2, remote: 'true' },
    { id: 3, remote: 1 },
    { id: 4, remote: null },
    { id: 5 },
    { id: 6, remote: false },
  ]);
  assert.deepEqual(out.map((j) => j.id), [1]);
});

test('Posted Within 7 Days: boundaries, invalid and missing dates', () => {
  const out = node('Posted Within 7 Days', [
    { id: 'now', created_at: SECONDS(FIXED_NOW) },
    { id: 'exactly-7-days', created_at: SECONDS(FIXED_NOW - 7 * DAY) },
    { id: '7-days-1-second', created_at: SECONDS(FIXED_NOW - 7 * DAY) - 1 },
    { id: 'future', created_at: SECONDS(FIXED_NOW) + 60 },
    { id: 'string-number', created_at: String(SECONDS(FIXED_NOW - DAY)) },
    { id: 'text', created_at: 'yesterday' },
    { id: 'null', created_at: null },
    { id: 'missing' },
  ]);
  assert.deepEqual(out.map((j) => j.id), ['now', 'exactly-7-days', 'string-number']);
});

test('Support Roles Without Sales: missing title/description do not crash; description-only match passes', () => {
  const out = node('Support Roles Without Sales', [
    { id: 'empty' },
    { id: 'description-only', description: 'Customer support for EU clients' },
    { id: 'title-null', title: null, description: 'helpdesk' },
    { id: 'number-title', title: 12345, description: 'chat support' },
    { id: 'sales', title: 'Sales Representative', description: 'customer support' },
  ]);
  assert.deepEqual(out.map((j) => j.id), ['description-only', 'title-null', 'number-title']);
});

test('known limitation: the sales exclusion is a substring match ("Salesforce" is excluded too)', () => {
  const out = node('Support Roles Without Sales', [{ title: 'Salesforce Support Specialist', description: 'IT support' }]);
  assert.equal(out.length, 0);
});

test('Support Title or Target Region: odd location types do not crash; matching is case-insensitive', () => {
  const out = node('Support Title or Target Region', [
    { id: 'null-location', title: 'Data Analyst', candidate_required_location: null },
    { id: 'number-location', title: 'Data Analyst', location: 42 },
    { id: 'upper-case', title: 'Data Analyst', candidate_required_location: 'EUROPE' },
    { id: 'no-title-italy', location: 'Italy' },
    { id: 'usa', title: 'Data Analyst', candidate_required_location: 'USA Only' },
  ]);
  assert.deepEqual(out.map((j) => j.id), ['upper-case', 'no-title-italy']);
});

test('known limitation: "eu" is matched as a substring (Neuss, Eurasia, Deutschland)', () => {
  const out = node('Support Title or Target Region', [
    { title: 'Data Analyst', location: 'Neuss' },
    { title: 'Data Analyst', location: 'Eurasia' },
    { title: 'Data Analyst', location: 'Deutschland' },
  ]);
  assert.equal(out.length, 3);
});

test('Normalize Job Schema: missing fields, arrays, objects and odd types become text', () => {
  const [row] = node('Normalize Job Schema', [
    { title: '  Helpdesk  ', company_name: null, location: ['Berlin', 'Remote'], salary: { min: 1 }, job_types: ['full time'], url: ' https://example.com/x ' },
  ]);
  assert.deepEqual(row, {
    title: 'Helpdesk',
    company: '',
    location: 'Berlin, Remote',
    salary: '',
    job_type: 'full time',
    language: '',
    remote_region: 'Berlin, Remote',
    source: 'arbeitnow',
    date: '',
    url: 'https://example.com/x',
  });
});

test('Normalize Job Schema: invalid and out-of-range dates never throw', () => {
  const rows = node('Normalize Job Schema', [
    { url: 'https://example.com/1', created_at: 1e20 },
    { url: 'https://example.com/2', publication_date: 'not a date' },
    { url: 'https://example.com/3', created_at: '1791705600' },
    { url: 'https://example.com/4', publication_date: '' },
  ]);
  assert.deepEqual(rows.map((r) => r.date), ['', 'not a date', '2026-10-11T08:00:00.000Z', '']);
});

test('Normalize Job Schema: only absolute http(s) URLs without spaces are kept', () => {
  const rows = node('Normalize Job Schema', [
    { title: 'a', url: 'https://example.com/ok' },
    { title: 'b', url: 'HTTP://EXAMPLE.COM/upper' },
    { title: 'c', url: 'javascript:alert(1)' },
    { title: 'd', url: 'ftp://example.com/file' },
    { title: 'e', url: '/relative/path' },
    { title: 'f', url: 'https://example.com/with space' },
    { title: 'g', url: '' },
    { title: 'h' },
  ]);
  assert.deepEqual(rows.map((r) => r.title), ['a', 'b']);
});

test('Deduplicate by URL keeps the first of several identical URLs', () => {
  const out = node('Deduplicate by URL', [
    { title: 'first', url: 'https://example.com/same' },
    { title: 'second', url: 'https://example.com/same' },
    { title: 'other', url: 'https://example.com/other' },
  ]);
  assert.deepEqual(out.map((j) => j.title), ['first', 'other']);
});

test('Build Email Digest: special characters, missing fields and unsafe links', () => {
  const [mail] = node('Build Email Digest', [
    { title: 'Ünïcödé & "Quotes" <i>', company: "O'Brien & Söhne", source: 'remotive', url: 'https://example.com/?a=1&b="2"' },
    { url: 'javascript:alert(1)' },
    { title: 'Data URL', url: 'data:text/html,<b>x</b>' },
  ]);
  assert.equal(mail.subject, 'Jobhunter AI Agent – 3 neue Jobtreffer');
  assert.ok(mail.html.includes('Ünïcödé &amp; &quot;Quotes&quot; &lt;i&gt;'));
  assert.ok(mail.html.includes('O&#39;Brien &amp; Söhne'));
  assert.ok(mail.html.includes('<a href="https://example.com/?a=1&amp;b=&quot;2&quot;">'));
  assert.ok(mail.html.includes('<h3>2. Stellenangebot</h3>')); // missing title falls back to a default
  assert.equal((mail.html.match(/<a href=/g) || []).length, 1); // javascript: and data: links are dropped
});

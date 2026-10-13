// Static checks of the exported n8n workflow: structure, wiring and import readiness.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { WORKFLOW_PATH } from './lib/paths.mjs';

const raw = readFileSync(WORKFLOW_PATH, 'utf8');
const wf = JSON.parse(raw);
const executable = wf.nodes.filter((n) => n.type !== 'n8n-nodes-base.stickyNote');
const names = wf.nodes.map((n) => n.name);

const edges = Object.entries(wf.connections).flatMap(([from, conn]) =>
  Object.entries(conn).flatMap(([type, outputs]) =>
    outputs.flatMap((out, outIndex) => out.map((c) => ({ from, to: c.node, type, index: c.index, outIndex }))),
  ),
);

// Node types and versions as exported by the n8n instance the workflow was built with (n8n 2.37.10).
const EXPECTED_TYPES = {
  'n8n-nodes-base.scheduleTrigger': 1.4,
  'n8n-nodes-base.httpRequest': 4.5,
  'n8n-nodes-base.splitOut': 1,
  'n8n-nodes-base.filter': 2.3,
  'n8n-nodes-base.code': 2,
  'n8n-nodes-base.set': 3.5,
  'n8n-nodes-base.merge': 3.2,
  'n8n-nodes-base.removeDuplicates': 2,
  'n8n-nodes-base.googleSheets': 4.7,
  'n8n-nodes-base.emailSend': 2.1,
  'n8n-nodes-base.stickyNote': 1,
};

test('workflow is valid JSON with the top-level fields n8n imports', () => {
  for (const key of ['name', 'nodes', 'connections', 'settings']) assert.ok(key in wf, `missing ${key}`);
  assert.ok(Array.isArray(wf.nodes));
});

test('workflow is inactive and carries no instance-specific identifiers', () => {
  assert.equal(wf.active, false);
  for (const key of ['id', 'versionId', 'meta', 'activeVersionId']) assert.ok(!(key in wf), `unexpected top-level ${key}`);
  assert.deepEqual(wf.pinData, {});
});

test('node names and ids are unique', () => {
  assert.equal(new Set(names).size, names.length);
  const ids = wf.nodes.map((n) => n.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('expected node count: 17 executable nodes plus 1 sticky note', () => {
  assert.equal(executable.length, 17);
  assert.equal(wf.nodes.length, 18);
});

test('only known node types and versions are used', () => {
  for (const n of wf.nodes) {
    assert.ok(n.type in EXPECTED_TYPES, `unexpected type ${n.type}`);
    assert.equal(n.typeVersion, EXPECTED_TYPES[n.type], `${n.name} has typeVersion ${n.typeVersion}`);
  }
});

test('every connection references existing nodes and uses the main channel', () => {
  for (const e of edges) {
    assert.ok(names.includes(e.from), `unknown source ${e.from}`);
    assert.ok(names.includes(e.to), `unknown target ${e.to}`);
    assert.equal(e.type, 'main');
    assert.equal(e.outIndex, 0);
  }
  assert.equal(edges.length, 17);
});

test('merge node receives exactly inputs 0 (Remotive) and 1 (Arbeitnow)', () => {
  const merges = wf.nodes.filter((n) => n.type === 'n8n-nodes-base.merge');
  assert.equal(merges.length, 1);
  const merge = merges[0];
  const max = merge.parameters.numberInputs ?? 2;
  const inbound = edges.filter((e) => e.to === merge.name);
  for (const e of inbound) assert.ok(e.index < max, `invalid merge input ${e.index}`);
  assert.deepEqual(
    inbound.map((e) => `${e.index}:${e.from}`).sort(),
    ['0:Tag Source Remotive', '1:Support Roles Without Sales'],
  );
});

test('each non-merge node has at most one inbound connection (no duplicated feeds)', () => {
  for (const n of executable) {
    if (n.type === 'n8n-nodes-base.merge') continue;
    assert.ok(edges.filter((e) => e.to === n.name).length <= 1, `${n.name} has multiple inbound connections`);
  }
});

test('all executable nodes are reachable from the trigger and only the email node is a sink', () => {
  const trigger = executable.find((n) => n.type === 'n8n-nodes-base.scheduleTrigger');
  const seen = new Set([trigger.name]);
  const queue = [trigger.name];
  while (queue.length) {
    const cur = queue.shift();
    for (const e of edges.filter((x) => x.from === cur)) if (!seen.has(e.to)) seen.add(e.to), queue.push(e.to);
  }
  assert.deepEqual([...seen].sort(), executable.map((n) => n.name).sort());
  const sinks = executable.filter((n) => !edges.some((e) => e.from === n.name)).map((n) => n.name);
  assert.deepEqual(sinks, ['Send Email Digest']);
});

test('graph is acyclic', () => {
  const visiting = new Set();
  const done = new Set();
  const visit = (name) => {
    assert.ok(!visiting.has(name), `cycle at ${name}`);
    if (done.has(name)) return;
    visiting.add(name);
    for (const e of edges.filter((x) => x.from === name)) visit(e.to);
    visiting.delete(name);
    done.add(name);
  };
  executable.forEach((n) => visit(n.name));
});

test('no credentials, webhook ids or real addresses are embedded', () => {
  for (const n of wf.nodes) {
    assert.ok(!('credentials' in n), `${n.name} has credentials`);
    assert.ok(!('webhookId' in n), `${n.name} has webhookId`);
  }
  const sheet = wf.nodes.find((n) => n.type === 'n8n-nodes-base.googleSheets');
  assert.equal(sheet.parameters.documentId.value, 'YOUR_GOOGLE_SHEET_ID');
  assert.ok(!JSON.stringify(sheet).includes('docs.google.com'));
  const mail = wf.nodes.find((n) => n.type === 'n8n-nodes-base.emailSend');
  assert.match(mail.parameters.fromEmail, /@example\.com$/);
  assert.match(mail.parameters.toEmail, /@example\.com$/);
});

test('HTTP requests only target the two public job APIs', () => {
  const urls = wf.nodes.filter((n) => n.type === 'n8n-nodes-base.httpRequest').map((n) => n.parameters.url).sort();
  assert.deepEqual(urls, ['https://remotive.com/api/remote-jobs', 'https://www.arbeitnow.com/api/job-board-api']);
  for (const n of wf.nodes.filter((x) => x.type === 'n8n-nodes-base.httpRequest')) {
    assert.ok(!n.parameters.sendHeaders, `${n.name} sends custom headers`);
  }
});

test('Google Sheets upsert matches on url and maps all ten schema columns', () => {
  const sheet = wf.nodes.find((n) => n.type === 'n8n-nodes-base.googleSheets');
  assert.equal(sheet.parameters.operation, 'appendOrUpdate');
  assert.deepEqual(sheet.parameters.columns.matchingColumns, ['url']);
  assert.deepEqual(Object.keys(sheet.parameters.columns.value), [
    'title', 'company', 'location', 'salary', 'job_type', 'language', 'remote_region', 'source', 'date', 'url',
  ]);
});

test('schedule: daily at 09:00 in Europe/Rome with execution order v1', () => {
  const trigger = wf.nodes.find((n) => n.type === 'n8n-nodes-base.scheduleTrigger');
  assert.deepEqual(trigger.parameters.rule.interval, [{ triggerAtHour: 9 }]);
  assert.equal(wf.settings.timezone, 'Europe/Rome');
  assert.equal(wf.settings.executionOrder, 'v1');
});

// The committed example outputs must match what the workflow produces from the fixtures.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderExamples } from '../scripts/render-examples.mjs';
import { ROOT } from './lib/paths.mjs';

const normalize = (s) => s.replace(/\r\n/g, '\n');

test('examples/ are up to date with the workflow (run "npm run examples" to refresh)', () => {
  const { csv, html } = renderExamples();
  assert.equal(normalize(readFileSync(join(ROOT, 'examples', 'sample-sheet-rows.csv'), 'utf8')), csv);
  assert.equal(normalize(readFileSync(join(ROOT, 'examples', 'sample-email.html'), 'utf8')), html);
});

test('sheet column template matches the workflow mapping', () => {
  const header = readFileSync(join(ROOT, 'config', 'google-sheet-columns.csv'), 'utf8').trim();
  const wf = JSON.parse(readFileSync(join(ROOT, 'workflow', 'jobhunter-ai.json'), 'utf8'));
  const sheet = wf.nodes.find((n) => n.type === 'n8n-nodes-base.googleSheets');
  assert.equal(header, Object.keys(sheet.parameters.columns.value).join(','));
});

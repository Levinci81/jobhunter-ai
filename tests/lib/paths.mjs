import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const WORKFLOW_PATH = join(ROOT, 'workflow', 'jobhunter-ai.json');

const readJson = (...parts) => JSON.parse(readFileSync(join(ROOT, ...parts), 'utf8'));

export function loadFixtures() {
  return {
    'Fetch Arbeitnow Jobs': readJson('tests', 'fixtures', 'arbeitnow.json'),
    'Fetch Remotive Jobs': readJson('tests', 'fixtures', 'remotive.json'),
  };
}

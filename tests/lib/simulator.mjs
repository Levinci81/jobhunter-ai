// Offline simulator for the Jobhunter AI Agent workflow.
//
// - Code nodes run the original JavaScript from the workflow file in a sandbox.
// - Filter, Merge, Split Out, Set and Remove Duplicates are re-implemented with the
//   subset of n8n semantics this workflow uses (approximation, see docs/testing.*.md).
// - HTTP Request, Google Sheets and Send Email are replaced by fixtures and recorders.
//   Nothing in this file performs network I/O.
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

export const FIXED_NOW = Date.parse('2026-10-13T08:00:00Z');

export function loadWorkflow(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function makeFixedDate(now) {
  return class FixedDate extends Date {
    constructor(...args) {
      if (args.length === 0) super(now);
      else super(...args);
    }
    static now() {
      return now;
    }
  };
}

export function evaluateExpression(value, json, ctx) {
  if (typeof value !== 'string' || !value.startsWith('=')) return value;
  const body = value.slice(1);
  const run = (code) => vm.runInNewContext(`(${code})`, { $json: json, Date: ctx.Date }, { timeout: 1000 });
  const single = body.match(/^\{\{([\s\S]*)\}\}$/);
  if (single) return run(single[1]);
  return body.replace(/\{\{([\s\S]*?)\}\}/g, (_, code) => String(run(code)));
}

function evaluateCondition(condition, json, options, ctx) {
  const left = evaluateExpression(condition.leftValue, json, ctx);
  const right = evaluateExpression(condition.rightValue, json, ctx);
  const { type, operation } = condition.operator;
  const ignoreCase = options.ignoreCase === true || options.caseSensitive === false;

  if (options.typeValidation === 'strict' && typeof left !== type) {
    throw new TypeError(`Strict type validation: expected ${type}, got ${typeof left} (${condition.leftValue})`);
  }

  const flags = ignoreCase ? 'i' : '';
  const norm = (s) => (ignoreCase ? String(s).toLowerCase() : String(s));
  switch (`${type}:${operation}`) {
    case 'boolean:equals':
      return left === right;
    case 'boolean:true':
      return left === true;
    case 'string:equals':
      return norm(left) === norm(right);
    case 'string:contains':
      return norm(left).includes(norm(right));
    case 'string:regex':
      return new RegExp(right, flags).test(left);
    case 'string:notRegex':
      return !new RegExp(right, flags).test(left);
    default:
      throw new Error(`Unsupported operator ${type}:${operation}`);
  }
}

function runFilter(node, items, ctx) {
  const { conditions, combinator } = node.parameters.conditions;
  const options = { ...node.parameters.conditions.options, ...node.parameters.options };
  return items.filter((item) => {
    const results = conditions.map((c) => evaluateCondition(c, item.json, options, ctx));
    return combinator === 'or' ? results.some(Boolean) : results.every(Boolean);
  });
}

function runCode(node, items, ctx) {
  const $input = {
    all: () => structuredClone(items),
    first: () => structuredClone(items[0]),
    last: () => structuredClone(items.at(-1)),
  };
  const result = vm.runInNewContext(
    `(function () {\n${node.parameters.jsCode}\n})()`,
    { $input, Date: ctx.Date },
    { timeout: 1000 },
  );
  if (!Array.isArray(result)) throw new Error(`Code node "${node.name}" must return an array`);
  return result.map((r) => ({ json: JSON.parse(JSON.stringify(r && r.json !== undefined ? r.json : r)) }));
}

const handlers = {
  'n8n-nodes-base.scheduleTrigger': (node, inputs, ctx) => [{ json: { timestamp: new ctx.Date().toISOString() } }],

  'n8n-nodes-base.httpRequest': (node, inputs, ctx) => {
    if (!(node.name in ctx.fixtures)) {
      throw new Error(`No fixture for "${node.name}" – network access is not allowed in tests`);
    }
    ctx.httpCalls.push({ node: node.name, url: node.parameters.url });
    return [{ json: structuredClone(ctx.fixtures[node.name]) }];
  },

  // Assumption (not verified against n8n): a missing field yields no items; a non-array value fails.
  'n8n-nodes-base.splitOut': (node, inputs) =>
    inputs[0].flatMap((item) => {
      const value = item.json[node.parameters.fieldToSplitOut] ?? [];
      if (!Array.isArray(value)) throw new TypeError(`Split Out: "${node.parameters.fieldToSplitOut}" is not an array`);
      return value.map((v) => ({ json: v }));
    }),

  'n8n-nodes-base.filter': (node, inputs, ctx) => runFilter(node, inputs[0], ctx),

  'n8n-nodes-base.code': (node, inputs, ctx) => runCode(node, inputs[0], ctx),

  'n8n-nodes-base.set': (node, inputs, ctx) =>
    inputs[0].map((item) => {
      const base = node.parameters.includeOtherFields ? { ...item.json } : {};
      for (const a of node.parameters.assignments.assignments) {
        base[a.name] = evaluateExpression(a.value, item.json, ctx);
      }
      return { json: base };
    }),

  'n8n-nodes-base.merge': (node, inputs) => inputs.flat(),

  'n8n-nodes-base.removeDuplicates': (node, inputs) => {
    const fields = node.parameters.fieldsToCompare.split(',').map((f) => f.trim());
    const seen = new Set();
    return inputs[0].filter((item) => {
      const key = JSON.stringify(fields.map((f) => item.json[f]));
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },

  'n8n-nodes-base.googleSheets': (node, inputs, ctx) => {
    const mapping = node.parameters.columns.value;
    const rows = inputs[0].map((item) =>
      Object.fromEntries(Object.entries(mapping).map(([col, expr]) => [col, evaluateExpression(expr, item.json, ctx)])),
    );
    ctx.sheetWrites.push({ node: node.name, operation: node.parameters.operation, matchingColumns: node.parameters.columns.matchingColumns, rows });
    return rows.map((json) => ({ json }));
  },

  'n8n-nodes-base.emailSend': (node, inputs, ctx) =>
    inputs[0].map((item) => {
      const mail = {
        from: node.parameters.fromEmail,
        to: node.parameters.toEmail,
        subject: evaluateExpression(node.parameters.subject, item.json, ctx),
        html: evaluateExpression(node.parameters.html, item.json, ctx),
      };
      ctx.sentEmails.push(mail);
      return { json: mail };
    }),
};

// Runs a single node of the workflow on the given input items (for unit tests).
export function runNode(workflow, name, items, { now = FIXED_NOW } = {}) {
  const node = workflow.nodes.find((n) => n.name === name);
  if (!node) throw new Error(`Unknown node ${name}`);
  const ctx = { Date: makeFixedDate(now), fixtures: {}, httpCalls: [], sheetWrites: [], sentEmails: [] };
  return handlers[node.type](node, [items.map((json) => ({ json }))], ctx).map((i) => i.json);
}

// Executes the workflow graph from its trigger. A node runs once all of its parents
// have run; a node whose inputs are all empty is skipped (n8n does not execute nodes
// without input items unless "Always Output Data" is enabled).
export function runWorkflow(workflow, { fixtures, now = FIXED_NOW } = {}) {
  const ctx = { Date: makeFixedDate(now), fixtures, httpCalls: [], sheetWrites: [], sentEmails: [] };
  const incoming = {};
  for (const [from, conn] of Object.entries(workflow.connections)) {
    for (const output of conn.main) {
      for (const c of output) (incoming[c.node] ??= []).push({ from, index: c.index });
    }
  }
  const trigger = workflow.nodes.find((n) => n.type === 'n8n-nodes-base.scheduleTrigger');
  const outputs = { [trigger.name]: handlers[trigger.type](trigger, [], ctx) };
  const executed = [trigger.name];
  const skipped = [];
  const pending = workflow.nodes.filter((n) => n.name !== trigger.name && incoming[n.name]);

  while (pending.length) {
    const i = pending.findIndex((n) => incoming[n.name].every((e) => e.from in outputs));
    if (i === -1) throw new Error(`Unresolvable graph near: ${pending.map((n) => n.name).join(', ')}`);
    const [node] = pending.splice(i, 1);
    const inputCount = Math.max(...incoming[node.name].map((e) => e.index)) + 1;
    const inputs = Array.from({ length: inputCount }, () => []);
    for (const e of incoming[node.name]) inputs[e.index].push(...outputs[e.from]);

    if (inputs.every((items) => items.length === 0)) {
      outputs[node.name] = [];
      skipped.push(node.name);
      continue;
    }
    const handler = handlers[node.type];
    if (!handler) throw new Error(`No simulator handler for node type ${node.type}`);
    outputs[node.name] = handler(node, inputs, ctx);
    executed.push(node.name);
  }
  return { outputs, executed, skipped, ...ctx };
}

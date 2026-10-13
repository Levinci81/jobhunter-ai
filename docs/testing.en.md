# Testing

**English** · [Deutsch](testing.de.md) · [Italiano](testing.it.md) · [Back to README](../README.md)

## How to run

```bash
npm test            # all tests, no dependencies, no network access
npm run examples    # regenerate examples/ from the synthetic fixtures
```

Requires Node.js 22 or newer. The same command is configured to run in GitHub Actions on every push and pull request ([`.github/workflows/tests.yml`](../.github/workflows/tests.yml)); it will run for the first time after the repository is published.

## Verification levels

| Level | Status | What it covers |
|---|---|---|
| Offline tests | **69 of 69 passed** | Workflow file structure, original JavaScript of the Code nodes, documentation, secret scan |
| Simulated n8n behaviour | covered by the offline tests | Filter, Merge, Split Out, Set, Remove Duplicates, HTTP Request, Google Sheets and Send Email are re-implemented or replaced in the simulator |
| Isolated run in n8n 2.37.10 | **all checks passed** | Test variant executed with synthetic data; identical results to the simulation in all 17 nodes |
| Real APIs, Google Sheets, SMTP in n8n | **not tested** | Requires real credentials; not part of the isolated test |

## What is tested

| File | Tests | What it checks |
|---|---|---|
| [`tests/structure.test.mjs`](../tests/structure.test.mjs) | 14 | JSON validity, unique names and IDs, node types and versions, every connection target exists, merge inputs, reachability from the trigger, no cycles, no credentials or IDs, only the two public APIs, schedule and time zone |
| [`tests/pipeline.test.mjs`](../tests/pipeline.test.mjs) | 14 | Full offline run with synthetic data: every filter, merge, normalization, URL check, de-duplication, sheet upsert, email, escaping, empty and malformed API responses; network access is blocked |
| [`tests/edge-cases.test.mjs`](../tests/edge-cases.test.mjs) | 11 | Single nodes with edge cases: odd types, missing fields, date boundaries, invalid dates and URLs, special characters, region and sales matching |
| [`tests/security.test.mjs`](../tests/security.test.mjs) | 17 | Repository-wide scan for cookies, tokens, keys, sheet URLs, instance metadata, personal email addresses, local paths and private exports |
| [`tests/docs.test.mjs`](../tests/docs.test.mjs) | 11 | Local links resolve, external links only to expected hosts, EN/DE/IT documents have the same structure, copyright notice, no license file, AI only described as planned |
| [`tests/examples.test.mjs`](../tests/examples.test.mjs) | 2 | `examples/` matches the workflow output, sheet header template matches the column mapping |

## Test data

The fixtures in [`tests/fixtures/`](../tests/fixtures/) are synthetic. They follow the response shape of the public Arbeitnow and Remotive APIs, but all companies are fictitious and all links point to `example.com`. The reference time is fixed at 2026-10-13 08:00 UTC so that the 7-day filter gives the same result on every run.

## Pipeline test matrix

| Case | Source | Expected result | Reason |
|---|---|---|---|
| A1 | Arbeitnow | kept | remote, 2 days old, IT support title |
| A2 | Arbeitnow | removed by *Remote Only* | not remote |
| A3 | Arbeitnow | removed by *Posted Within 7 Days* | 10 days old |
| A4 | Arbeitnow | removed by *Support Roles Without Sales* | sales term in the title |
| A5 | Arbeitnow | removed by *Support Roles Without Sales* | no support keyword |
| A6 | Arbeitnow | removed by *Deduplicate by URL* | same URL as R3 |
| A7 | Arbeitnow | removed by *Posted Within 7 Days* | date in the future |
| A8 | Arbeitnow | kept | passes the region condition only via `eu` in *Deutschland* (known limitation) |
| A9 | Arbeitnow | kept, escaped in the email | script tag, ampersand and quotes in title and company |
| A10 | Arbeitnow | removed by *Normalize Job Schema* | `javascript:` URL is not a valid link |
| A11 | Arbeitnow | removed by *Support Title Check* | title missing; must not stop the run |
| A12 | Arbeitnow | removed by *Remote Only* | `remote` is the string `"true"` |
| R1 | Remotive | kept | support title, Europe |
| R2 | Remotive | removed by *Support Title Check* | region *Worldwide* but not a support title |
| R3 | Remotive | kept | technical support, Italy |
| R4 | Remotive | removed by *Support Title or Target Region* | neither support title nor target region |
| R5 | Remotive | removed by *Deduplicate by URL* | same URL as R1 |
| R6 | Remotive | removed by *Support Title or Target Region* | title missing, location is a number; must not stop the run |

Expected end result: 5 rows in the sheet (R1, R3, A1, A8, A9) and one email with 5 entries and 5 links. The rendered output is in [`examples/`](../examples/).

## Edge cases

- **Empty results:** both APIs empty → no sheet write, no email; one API empty → the other source is still processed.
- **Duplicates:** within one source and across sources; the first occurrence wins.
- **Invalid URLs:** `javascript:`, `data:`, `ftp:`, relative paths, URLs with spaces and empty values are dropped or not rendered as links.
- **HTML special characters:** `<`, `>`, `&`, `"` and `'` are escaped in titles, companies and links.
- **Missing fields and odd types:** missing titles, `null`, numbers, arrays and objects do not stop the run.
- **Dates:** 7-day boundary, future dates, text instead of timestamps, out-of-range numbers.
- **Unexpected API formats:** a response without the expected array is treated as empty, a non-array value stops the run – both are simulator assumptions that still need to be confirmed in n8n.

## Results

- Last local run: 2026-10-13, Node.js 24.20.0 on Windows 11 – **69 of 69 tests passed**.
- Mutation check: re-introducing the two fixed wiring bugs or the previous email code without escaping makes the expected results fail.
- Before sanitizing, equivalent structural checks (JSON validity, connection references, merge inputs) were run on the private predecessor.

## Isolated n8n test

Run on 2026-10-13 with n8n 2.37.10 in a separate, empty n8n data folder (no credentials, telemetry disabled, production instance stopped and untouched), using the n8n CLI (`import:workflow`, `execute`).

- **Test variant:** the schedule trigger was replaced by a manual trigger, the two HTTP nodes by Code nodes that return the synthetic fixtures, and the Google Sheets and email nodes by NoOp nodes. All other nodes ran unchanged.
- **Result:** all checks passed – the item counts of all 17 nodes, the nine normalized records, the five de-duplicated URLs and the complete email HTML were identical to the offline simulation.
- **Findings:** CLI import requires a workflow `id`; `n8n execute` needs a manual trigger; `n8n execute` ignores pinned data (a first attempt with pinned data reached the HTTP nodes, which pointed to a closed local port, so no request left the machine).
- **Not covered:** real API responses, Google Sheets OAuth and upsert, SMTP, the schedule trigger and the import via the n8n editor.


- The JavaScript of the Code nodes runs unchanged, but Filter, Merge, Split Out, Set and Remove Duplicates are re-implemented in [`tests/lib/simulator.mjs`](../tests/lib/simulator.mjs) for the options this workflow uses. It is an approximation of n8n, not n8n itself.
- HTTP Request, Google Sheets and Send Email are replaced by fixtures and recorders; real API responses, OAuth and SMTP are not exercised.
- The isolated n8n test above confirms the simulated nodes for this data set; it does not replace a run with real credentials.

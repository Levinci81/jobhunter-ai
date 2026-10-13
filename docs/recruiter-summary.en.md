# Recruiter summary – Jobhunter AI Agent GitHub

**English** · [Deutsch](recruiter-summary.de.md) · [Italiano](recruiter-summary.it.md) · [Back to README](../README.md)

## In one sentence

An AI-assisted development project: a self-hosted n8n automation that finds relevant remote support and customer-service jobs every morning, stores them without duplicates in Google Sheets and emails a short digest – documented in three languages, tested offline and cleaned of all secrets.

## Problem

Checking several job boards every day for the same kind of role takes time and produces duplicates and irrelevant results (for example sales positions that mention "customer support").

## Solution

One scheduled, rule-based workflow that queries two public job APIs, applies clear keyword rules, unifies the data, removes duplicates and delivers the result to a spreadsheet and an inbox.

## What the project contains

- An n8n workflow with 17 nodes: schedule, two API branches, merge, four filters, three JavaScript steps, de-duplication, Google Sheets upsert and SMTP email.
- A common ten-field job schema for two differently structured APIs, robust against missing and unexpected values.
- An offline test suite (69 tests) with a small workflow simulator, synthetic test data and blocked network access, prepared for GitHub Actions.
- Documentation in English, German and Italian.

## AI-assisted way of working

- **Owner:** [Levinci81](https://github.com/Levinci81) set the goal, requirements and safety rules, made the scope and security decisions and approved every step.
- **AI assistant:** Claude Code (Anthropic) performed the analysis, code changes, tests and documentation drafts within these rules.
- **Verification:** results were accepted only with evidence – automated tests, read-only checks of local data, and comparison against the private originals.
- **Separation:** AI was a development tool. The workflow itself contains no AI model; AI-based job scoring is planned, not implemented.

## Skills and evidence

| Area | Evidence in this repository |
|---|---|
| Workflow automation (n8n) | [`workflow/jobhunter-ai.json`](../workflow/jobhunter-ai.json): schedule, branching, merge, filters, verified wiring |
| API integration | Two REST/JSON APIs mapped to one schema ([architecture](architecture.en.md#data-schema)) |
| JavaScript | Code nodes for the 7-day window, normalization and the HTML email |
| Data quality | Regex classification, URL validation and de-duplication, idempotent upsert |
| Google Workspace integration | Google Sheets via OAuth2 with *append or update* |
| Automated testing | [`tests/`](../tests/): structure, pipeline, edge-case, security and documentation tests |
| Security awareness | Secrets removed, credential store, HTML escaping, repository-wide secret scan ([SECURITY.md](../SECURITY.md)) |
| Troubleshooting | Root cause of missed scheduled runs identified and documented ([setup](setup.en.md#troubleshooting)) |
| AI-assisted development | Requirements, approval steps and verification documented ([README](../README.md#ai-assisted-development)) |
| Technical writing | Trilingual README, architecture, setup and test documentation |

## Problems found and how they were handled

- **Session cookie stored in the private workflow** → source removed, public version rebuilt from a clean copy, secret scan added.
- **Scheduled runs missing for days** → cause found (n8n was not running at 09:00), operating notes added.
- **Wiring bugs** (duplicate processing, bypassed role filter) → fixed; tests fail if they are re-introduced.
- **Malformed job data could stop the whole run** → filters and normalization hardened, covered by edge-case tests.
- **Ambiguous filter rules** → not changed silently; options and recommendations documented ([open design decisions](architecture.en.md#open-design-decisions)).

## Honest scope

- The filtering is rule-based. AI-based scoring is planned, not implemented.
- The public version is verified with static checks, an offline simulation and one isolated run in n8n 2.37.10 with synthetic data; real API requests, Google Sheets and SMTP were not tested.

## Links

- Project overview: [README](../README.md)
- Author: [Levinci81 on GitHub](https://github.com/Levinci81)

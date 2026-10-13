# Setup

**English** · [Deutsch](setup.de.md) · [Italiano](setup.it.md) · [Back to README](../README.md)

## Prerequisites

- A self-hosted n8n instance (the workflow was built with n8n 2.37.10).
- A Google account and a Google Sheet for the results.
- An SMTP mailbox that n8n may send from.
- Optional, for the offline tests: Node.js 22 or newer.

## 1. Import the workflow

In n8n open *Workflows → Import from File* and select [`workflow/jobhunter-ai.json`](../workflow/jobhunter-ai.json). The workflow is imported as a new, inactive workflow named **Jobhunter AI Agent**.

## 2. Prepare the Google Sheet

Create a sheet and put the header row from [`config/google-sheet-columns.csv`](../config/google-sheet-columns.csv) into row 1:

```text
title,company,location,salary,job_type,language,remote_region,source,date,url
```

## 3. Create credentials

Create the credentials in n8n (never in node parameters or headers):

- **Google Sheets OAuth2 API** – see the [n8n Google credentials guide](https://docs.n8n.io/integrations/builtin/credentials/google/).
- **SMTP** – host, port, user and password of your mailbox.

## 4. Replace the placeholders

| Node | Field | Replace with |
|---|---|---|
| Upsert Jobs to Google Sheet | Credential | your Google Sheets OAuth2 credential |
| Upsert Jobs to Google Sheet | Document | your sheet ID instead of `YOUR_GOOGLE_SHEET_ID` |
| Upsert Jobs to Google Sheet | Sheet | the tab that contains the header row |
| Send Email Digest | Credential | your SMTP credential |
| Send Email Digest | From / To | your addresses instead of the `example.com` placeholders |

## 5. Safe first test

A manual execution calls the two public job APIs, writes to your sheet and sends an email. For a first test without side effects:

1. Deactivate the node **Send Email Digest** (right-click → *Deactivate*).
2. Point **Upsert Jobs to Google Sheet** to a copy of your sheet, or deactivate it as well.
3. Optional, to avoid any external call: in the output panel of **Fetch Arbeitnow Jobs** and **Fetch Remotive Jobs** set mock data from [`tests/fixtures/arbeitnow.json`](../tests/fixtures/arbeitnow.json) and [`tests/fixtures/remotive.json`](../tests/fixtures/remotive.json) and pin it. Pinned nodes do not send requests in manual runs.
4. Click *Execute workflow* and inspect the output of **Build Email Digest**.
5. Re-activate the nodes and remove pinned data before going live.

## 6. Activate

Publish (activate) the workflow. The schedule runs every day at 09:00 in the time zone set in the workflow settings (Europe/Rome). n8n only runs schedules while it is running: if the computer is off or asleep at 09:00, that day's run is skipped and not caught up.

## 7. Optional hardening

[`config/n8n.env.example`](../config/n8n.env.example) contains suggested environment variables, for example:

```bash
N8N_LISTEN_ADDRESS=127.0.0.1
EXECUTIONS_DATA_PRUNE=true
EXECUTIONS_DATA_MAX_AGE=168
```

## Troubleshooting

| Symptom | Likely cause | What to do |
|---|---|---|
| No email on a given day | No job passed the filters, so the following nodes were skipped | Expected behaviour; check the execution in n8n |
| No execution at 09:00 | n8n was not running or the computer was asleep | Run n8n as a service or with autostart, or choose another time |
| Google Sheets error about columns | Header row missing or different | Copy the header from `config/google-sheet-columns.csv` |
| Run fails at a *Fetch* node | API unreachable or response changed | Retry later; the workflow has no automatic retry yet |

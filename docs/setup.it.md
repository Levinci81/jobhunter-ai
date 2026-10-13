# Installazione

[English](setup.en.md) · [Deutsch](setup.de.md) · **Italiano** · [Torna al README](../README.it.md)

## Prerequisiti

- Un'istanza n8n self-hosted (il workflow è stato creato con n8n 2.37.10).
- Un account Google e un Google Sheet per i risultati.
- Una casella SMTP da cui n8n possa inviare.
- Facoltativo, per i test offline: Node.js 22 o successivo.

## 1. Importare il workflow

In n8n aprire *Workflows → Import from File* e selezionare [`workflow/jobhunter-ai.json`](../workflow/jobhunter-ai.json). Il workflow viene importato come nuovo workflow inattivo con il nome **Jobhunter AI Agent**.

## 2. Preparare il Google Sheet

Creare un foglio e inserire nella riga 1 l'intestazione da [`config/google-sheet-columns.csv`](../config/google-sheet-columns.csv):

```text
title,company,location,salary,job_type,language,remote_region,source,date,url
```

## 3. Creare le credenziali

Creare le credenziali in n8n (mai nei parametri dei nodi o negli header):

- **Google Sheets OAuth2 API** – vedi la [guida n8n alle credenziali Google](https://docs.n8n.io/integrations/builtin/credentials/google/).
- **SMTP** – host, porta, utente e password della casella.

## 4. Sostituire i segnaposto

| Nodo | Campo | Sostituire con |
|---|---|---|
| Upsert Jobs to Google Sheet | Credential | la propria credenziale Google Sheets OAuth2 |
| Upsert Jobs to Google Sheet | Document | l'ID del proprio foglio al posto di `YOUR_GOOGLE_SHEET_ID` |
| Upsert Jobs to Google Sheet | Sheet | la scheda che contiene l'intestazione |
| Send Email Digest | Credential | la propria credenziale SMTP |
| Send Email Digest | From / To | i propri indirizzi al posto dei segnaposto `example.com` |

## 5. Primo test sicuro

Un'esecuzione manuale chiama le due API pubbliche, scrive nel foglio e invia un'e-mail. Per un primo test senza effetti collaterali:

1. Disattivare il nodo **Send Email Digest** (clic destro → *Deactivate*).
2. Collegare **Upsert Jobs to Google Sheet** a una copia del foglio oppure disattivarlo.
3. Facoltativo, per evitare qualsiasi chiamata esterna: nel pannello di output di **Fetch Arbeitnow Jobs** e **Fetch Remotive Jobs** inserire i dati di prova da [`tests/fixtures/arbeitnow.json`](../tests/fixtures/arbeitnow.json) e [`tests/fixtures/remotive.json`](../tests/fixtures/remotive.json) e fissarli (pin). I nodi con dati fissati non inviano richieste nelle esecuzioni manuali.
4. Fare clic su *Execute workflow* e controllare l'output di **Build Email Digest**.
5. Prima della messa in produzione riattivare i nodi e rimuovere i dati fissati.

## 6. Attivare

Pubblicare (attivare) il workflow. La pianificazione viene eseguita ogni giorno alle 09:00 nel fuso orario impostato nel workflow (Europe/Rome). n8n esegue le pianificazioni solo mentre è in funzione: se alle 09:00 il computer è spento o in sospensione, l'esecuzione di quel giorno salta e non viene recuperata.

## 7. Hardening facoltativo

[`config/n8n.env.example`](../config/n8n.env.example) contiene variabili d'ambiente consigliate, ad esempio:

```bash
N8N_LISTEN_ADDRESS=127.0.0.1
EXECUTIONS_DATA_PRUNE=true
EXECUTIONS_DATA_MAX_AGE=168
```

## Risoluzione dei problemi

| Sintomo | Causa probabile | Cosa fare |
|---|---|---|
| Nessuna e-mail in un certo giorno | Nessuna offerta ha superato i filtri, i nodi successivi sono stati saltati | Comportamento previsto; controllare l'esecuzione in n8n |
| Nessuna esecuzione alle 09:00 | n8n non era in esecuzione o il computer era in sospensione | Eseguire n8n come servizio o con avvio automatico, oppure scegliere un altro orario |
| Errore di Google Sheets sulle colonne | Intestazione mancante o diversa | Copiare l'intestazione da `config/google-sheet-columns.csv` |
| L'esecuzione fallisce in un nodo *Fetch* | API non raggiungibile o risposta cambiata | Riprovare più tardi; il workflow non ha ancora nuovi tentativi automatici |

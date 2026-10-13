# Einrichtung

[English](setup.en.md) · **Deutsch** · [Italiano](setup.it.md) · [Zurück zur README](../README.de.md)

## Voraussetzungen

- Eine selbst gehostete n8n-Instanz (der Workflow wurde mit n8n 2.37.10 erstellt).
- Ein Google-Konto und ein Google Sheet für die Ergebnisse.
- Ein SMTP-Postfach, über das n8n versenden darf.
- Optional, für die Offline-Tests: Node.js 22 oder neuer.

## 1. Workflow importieren

In n8n *Workflows → Import from File* öffnen und [`workflow/jobhunter-ai.json`](../workflow/jobhunter-ai.json) auswählen. Der Workflow wird als neuer, inaktiver Workflow mit dem Namen **Jobhunter AI Agent** angelegt.

## 2. Google Sheet vorbereiten

Ein Sheet anlegen und die Kopfzeile aus [`config/google-sheet-columns.csv`](../config/google-sheet-columns.csv) in Zeile 1 eintragen:

```text
title,company,location,salary,job_type,language,remote_region,source,date,url
```

## 3. Zugangsdaten anlegen

Die Zugangsdaten in n8n anlegen (niemals in Node-Parametern oder Headern):

- **Google Sheets OAuth2 API** – siehe die [n8n-Anleitung für Google-Zugangsdaten](https://docs.n8n.io/integrations/builtin/credentials/google/).
- **SMTP** – Host, Port, Benutzer und Passwort des Postfachs.

## 4. Platzhalter ersetzen

| Node | Feld | Ersetzen durch |
|---|---|---|
| Upsert Jobs to Google Sheet | Credential | eigene Google-Sheets-OAuth2-Zugangsdaten |
| Upsert Jobs to Google Sheet | Document | eigene Sheet-ID statt `YOUR_GOOGLE_SHEET_ID` |
| Upsert Jobs to Google Sheet | Sheet | das Tabellenblatt mit der Kopfzeile |
| Send Email Digest | Credential | eigene SMTP-Zugangsdaten |
| Send Email Digest | From / To | eigene Adressen statt der `example.com`-Platzhalter |

## 5. Sicherer erster Test

Eine manuelle Ausführung ruft die beiden öffentlichen Job-APIs auf, schreibt in das Sheet und versendet eine E-Mail. Für einen ersten Test ohne Nebenwirkungen:

1. Den Node **Send Email Digest** deaktivieren (Rechtsklick → *Deactivate*).
2. **Upsert Jobs to Google Sheet** auf eine Kopie des Sheets zeigen lassen oder ebenfalls deaktivieren.
3. Optional, um jeden externen Aufruf zu vermeiden: im Ausgabebereich von **Fetch Arbeitnow Jobs** und **Fetch Remotive Jobs** Testdaten aus [`tests/fixtures/arbeitnow.json`](../tests/fixtures/arbeitnow.json) und [`tests/fixtures/remotive.json`](../tests/fixtures/remotive.json) eintragen und anheften (Pin). Angeheftete Nodes senden bei manuellen Läufen keine Anfragen.
4. *Execute workflow* anklicken und die Ausgabe von **Build Email Digest** prüfen.
5. Vor dem Livebetrieb die Nodes wieder aktivieren und angeheftete Daten entfernen.

## 6. Aktivieren

Den Workflow veröffentlichen (aktivieren). Der Zeitplan läuft täglich um 09:00 Uhr in der Zeitzone aus den Workflow-Einstellungen (Europe/Rome). n8n führt Zeitpläne nur aus, solange es läuft: Ist der Rechner um 09:00 Uhr aus oder im Ruhezustand, entfällt der Lauf dieses Tages und wird nicht nachgeholt.

## 7. Optionale Härtung

[`config/n8n.env.example`](../config/n8n.env.example) enthält empfohlene Umgebungsvariablen, zum Beispiel:

```bash
N8N_LISTEN_ADDRESS=127.0.0.1
EXECUTIONS_DATA_PRUNE=true
EXECUTIONS_DATA_MAX_AGE=168
```

## Fehlerbehebung

| Symptom | Wahrscheinliche Ursache | Vorgehen |
|---|---|---|
| An einem Tag keine E-Mail | Keine Stelle hat die Filter passiert, die folgenden Nodes wurden übersprungen | Erwartetes Verhalten; Ausführung in n8n prüfen |
| Keine Ausführung um 09:00 Uhr | n8n lief nicht oder der Rechner war im Ruhezustand | n8n als Dienst oder mit Autostart betreiben oder eine andere Uhrzeit wählen |
| Google-Sheets-Fehler zu Spalten | Kopfzeile fehlt oder weicht ab | Kopfzeile aus `config/google-sheet-columns.csv` übernehmen |
| Lauf scheitert an einem *Fetch*-Node | API nicht erreichbar oder Antwort geändert | Später erneut versuchen; automatische Wiederholung gibt es noch nicht |

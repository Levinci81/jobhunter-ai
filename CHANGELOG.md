# Changelog

[English](#english) · [Deutsch](#deutsch) · [Italiano](#italiano)

## English

### 2.2.0 – 2026-10-13 – first public release

- Sources: Arbeitnow and Remotive only. Removed an authenticated job-portal source (session cookie in a request header) and an HTML-scraping source.
- Fixed: Remotive jobs were fed into both merge inputs and processed twice.
- Fixed: Arbeitnow jobs reached the email directly after the age filter, bypassing the role filters.
- Removed two dead-end nodes, a filter whose condition was always true and the merge nodes that only served the removed sources.
- Email: job data is HTML-escaped, only `http(s)` links are rendered.
- Schema: Unix timestamps are converted to ISO 8601; all fields are text.
- Robustness: missing fields and unexpected data types no longer stop the run; jobs without a valid `http(s)` URL are dropped; `remote` must be the boolean `true`.
- Descriptive English node names and a setup note on the canvas.
- Sanitized: no credentials, IDs, personal addresses, spreadsheet IDs or instance metadata; workflow is inactive after import.
- Added offline tests, a workflow simulator, synthetic fixtures, CI and trilingual documentation.
- Verified: one isolated run in n8n 2.37.10 with synthetic data matched the offline simulation in all 17 nodes.
- Documentation: AI-assisted development section, copyright notice (all rights reserved, no open-source license), open design decisions.

### 2.1 – 2026-10-13 – private test version

- Removed the authenticated job-portal branch and its merge input; workflow set to inactive.

### 2.0 – 2026-09-24 – private version

- Four sources, Google Sheets upsert and daily email digest.

## Deutsch

### 2.2.0 – 2026-10-13 – erste öffentliche Version

- Quellen: nur noch Arbeitnow und Remotive. Eine authentifizierte Jobportal-Quelle (Sitzungscookie in einem Request-Header) und eine HTML-Scraping-Quelle entfernt.
- Behoben: Remotive-Stellen wurden in beide Merge-Eingänge eingespeist und doppelt verarbeitet.
- Behoben: Arbeitnow-Stellen gelangten nach dem Altersfilter direkt in die E-Mail und umgingen die Rollenfilter.
- Zwei Nodes ohne Weiterverarbeitung, ein Filter mit stets wahrer Bedingung und die nur für die entfernten Quellen benötigten Merge-Nodes entfernt.
- E-Mail: Jobdaten werden HTML-maskiert, nur `http(s)`-Links werden ausgegeben.
- Schema: Unix-Zeitstempel werden in ISO 8601 umgewandelt; alle Felder sind Text.
- Robustheit: Fehlende Felder und unerwartete Datentypen brechen den Lauf nicht mehr ab; Stellen ohne gültige `http(s)`-URL werden verworfen; `remote` muss der Boolean-Wert `true` sein.
- Sprechende englische Node-Namen und eine Einrichtungsnotiz auf der Arbeitsfläche.
- Bereinigt: keine Zugangsdaten, IDs, persönlichen Adressen, Tabellen-IDs oder Instanz-Metadaten; der Workflow ist nach dem Import inaktiv.
- Offline-Tests, Workflow-Simulator, künstliche Testdaten, CI und dreisprachige Dokumentation ergänzt.
- Verifiziert: Ein isolierter Lauf in n8n 2.37.10 mit künstlichen Daten stimmte in allen 17 Nodes mit der Offline-Simulation überein.
- Dokumentation: Abschnitt zur KI-gestützten Entwicklung, Copyright-Hinweis (alle Rechte vorbehalten, keine Open-Source-Lizenz), offene Designentscheidungen.

### 2.1 – 2026-10-13 – private Testversion

- Zweig des authentifizierten Jobportals samt Merge-Eingang entfernt; Workflow auf inaktiv gesetzt.

### 2.0 – 2026-09-24 – private Version

- Vier Quellen, Google-Sheets-Upsert und tägliche E-Mail-Zusammenfassung.

## Italiano

### 2.2.0 – 2026-10-13 – primo rilascio pubblico

- Fonti: solo Arbeitnow e Remotive. Rimosse una fonte di un portale autenticato (cookie di sessione in un header della richiesta) e una fonte basata su scraping HTML.
- Corretto: le offerte Remotive entravano in entrambi gli input del merge ed erano elaborate due volte.
- Corretto: le offerte Arbeitnow arrivavano all'e-mail subito dopo il filtro di età, aggirando i filtri sul ruolo.
- Rimossi due nodi senza seguito, un filtro con condizione sempre vera e i nodi merge che servivano solo alle fonti rimosse.
- E-mail: i dati delle offerte sono sottoposti a escape HTML, vengono mostrati solo link `http(s)`.
- Schema: i timestamp Unix vengono convertiti in ISO 8601; tutti i campi sono testo.
- Robustezza: campi mancanti e tipi di dati inattesi non interrompono più l'esecuzione; le offerte senza un URL `http(s)` valido vengono scartate; `remote` deve essere il valore booleano `true`.
- Nomi dei nodi descrittivi in inglese e una nota di configurazione sul canvas.
- Ripulito: nessuna credenziale, ID, indirizzo personale, ID di foglio o metadato dell'istanza; il workflow è inattivo dopo l'importazione.
- Aggiunti test offline, simulatore del workflow, dati sintetici, CI e documentazione in tre lingue.
- Verificato: un'esecuzione isolata in n8n 2.37.10 con dati sintetici ha dato in tutti i 17 nodi gli stessi risultati della simulazione offline.
- Documentazione: sezione sullo sviluppo assistito dall'IA, nota di copyright (tutti i diritti riservati, nessuna licenza open source), decisioni progettuali aperte.

### 2.1 – 2026-10-13 – versione privata di test

- Rimosso il ramo del portale autenticato con il relativo input del merge; workflow impostato come inattivo.

### 2.0 – 2026-09-24 – versione privata

- Quattro fonti, upsert in Google Sheets e riepilogo giornaliero via e-mail.

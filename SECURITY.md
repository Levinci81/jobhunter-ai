# Security

[English](#english) · [Deutsch](#deutsch) · [Italiano](#italiano)

## English

### What this repository contains

- The workflow file contains **no credentials, tokens, cookies, personal email addresses, spreadsheet IDs or instance identifiers**. Google Sheets and SMTP are configured through n8n credentials after import; the file only holds placeholders (`YOUR_GOOGLE_SHEET_ID`, `you@example.com`).
- All test data is synthetic and uses `example.com`.
- `npm test` runs a repository-wide scan for cookies, tokens, keys, spreadsheet URLs, instance metadata, non-example email addresses and local paths ([`tests/security.test.mjs`](tests/security.test.mjs)).

### Lesson learned from the private version

An earlier private version requested an authenticated job portal with a **browser session cookie pasted into an HTTP header**. That cookie was stored in clear text in the workflow, in every saved version and in the execution history. Before publishing:

1. the source was removed completely,
2. the account session was to be invalidated on the provider side (log out, password reset),
3. the public workflow was rebuilt from a clean copy instead of editing the original export.

Rule since then: secrets belong in the n8n credential store, never in node parameters, headers or exported files.

### Recommendations for running n8n

- Bind the editor to localhost (`N8N_LISTEN_ADDRESS=127.0.0.1`) unless remote access is needed, especially on public Wi-Fi.
- Enable execution pruning; executions can contain request details and third-party data.
- Treat exported workflows as sensitive until they have been checked.
- See [`config/n8n.env.example`](config/n8n.env.example).

### Reporting a problem

Please open a GitHub issue **without** sensitive details, or use GitHub's private vulnerability reporting for this repository if it is enabled.

## Deutsch

### Inhalt dieses Repositorys

- Die Workflow-Datei enthält **keine Zugangsdaten, Tokens, Cookies, persönlichen E-Mail-Adressen, Tabellen-IDs oder Instanzkennungen**. Google Sheets und SMTP werden nach dem Import über n8n-Credentials eingerichtet; die Datei enthält nur Platzhalter (`YOUR_GOOGLE_SHEET_ID`, `you@example.com`).
- Alle Testdaten sind künstlich und verwenden `example.com`.
- `npm test` durchsucht das gesamte Repository nach Cookies, Tokens, Schlüsseln, Tabellen-URLs, Instanz-Metadaten, E-Mail-Adressen außerhalb von example.com und lokalen Pfaden ([`tests/security.test.mjs`](tests/security.test.mjs)).

### Lehre aus der privaten Version

Eine frühere private Version rief ein authentifiziertes Jobportal mit einem **in einen HTTP-Header kopierten Browser-Sitzungscookie** auf. Dieses Cookie lag im Klartext im Workflow, in jeder gespeicherten Version und im Ausführungsverlauf. Vor der Veröffentlichung wurde

1. die Quelle vollständig entfernt,
2. die Kontositzung beim Anbieter ungültig zu machen eingeplant (Abmelden, Passwort zurücksetzen),
3. der öffentliche Workflow aus einer sauberen Kopie neu aufgebaut, statt den Original-Export zu bearbeiten.

Regel seitdem: Geheimnisse gehören in den Credential-Speicher von n8n, niemals in Node-Parameter, Header oder exportierte Dateien.

### Empfehlungen für den Betrieb von n8n

- Den Editor an localhost binden (`N8N_LISTEN_ADDRESS=127.0.0.1`), sofern kein Fernzugriff nötig ist, besonders in öffentlichen WLANs.
- Die Bereinigung alter Ausführungen aktivieren; Ausführungen können Anfragedetails und Daten Dritter enthalten.
- Exportierte Workflows als sensibel behandeln, bis sie geprüft sind.
- Siehe [`config/n8n.env.example`](config/n8n.env.example).

### Probleme melden

Bitte ein GitHub-Issue **ohne** sensible Details eröffnen oder, falls aktiviert, die private Schwachstellenmeldung von GitHub für dieses Repository nutzen.

## Italiano

### Contenuto di questo repository

- Il file del workflow **non contiene credenziali, token, cookie, indirizzi e-mail personali, ID di fogli di calcolo o identificatori dell'istanza**. Google Sheets e SMTP si configurano dopo l'importazione tramite le credenziali n8n; il file contiene solo segnaposto (`YOUR_GOOGLE_SHEET_ID`, `you@example.com`).
- Tutti i dati di test sono sintetici e usano `example.com`.
- `npm test` esegue una scansione dell'intero repository alla ricerca di cookie, token, chiavi, URL di fogli, metadati dell'istanza, indirizzi e-mail non di esempio e percorsi locali ([`tests/security.test.mjs`](tests/security.test.mjs)).

### Lezione appresa dalla versione privata

Una versione privata precedente interrogava un portale autenticato con un **cookie di sessione del browser copiato in un header HTTP**. Quel cookie era salvato in chiaro nel workflow, in ogni versione salvata e nello storico delle esecuzioni. Prima della pubblicazione:

1. la fonte è stata rimossa completamente,
2. è stata pianificata l'invalidazione della sessione presso il fornitore (logout, reimpostazione della password),
3. il workflow pubblico è stato ricostruito da una copia pulita invece di modificare l'esportazione originale.

Regola da allora: i segreti vanno nell'archivio credenziali di n8n, mai nei parametri dei nodi, negli header o nei file esportati.

### Raccomandazioni per l'uso di n8n

- Collegare l'editor a localhost (`N8N_LISTEN_ADDRESS=127.0.0.1`) se non serve l'accesso remoto, soprattutto su Wi-Fi pubbliche.
- Attivare la pulizia delle esecuzioni; possono contenere dettagli delle richieste e dati di terzi.
- Trattare i workflow esportati come sensibili finché non sono stati controllati.
- Vedi [`config/n8n.env.example`](config/n8n.env.example).

### Segnalare un problema

Aprire una issue su GitHub **senza** dettagli sensibili oppure, se attiva, usare la segnalazione privata delle vulnerabilità di GitHub per questo repository.

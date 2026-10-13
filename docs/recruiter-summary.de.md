# Recruiter-Zusammenfassung – Jobhunter AI Agent GitHub

[English](recruiter-summary.en.md) · **Deutsch** · [Italiano](recruiter-summary.it.md) · [Zurück zur README](../README.de.md)

## In einem Satz

Ein KI-gestütztes Entwicklungsprojekt: eine selbst gehostete n8n-Automatisierung, die jeden Morgen passende Remote-Stellen im Support und Kundenservice findet, sie ohne Dubletten in Google Sheets speichert und eine kurze Zusammenfassung per E-Mail verschickt – dreisprachig dokumentiert, offline getestet und frei von Geheimnissen.

## Problem

Mehrere Jobbörsen täglich nach derselben Art von Stelle zu durchsuchen, kostet Zeit und liefert Dubletten sowie unpassende Treffer (zum Beispiel Vertriebsstellen, die „Customer Support“ erwähnen).

## Lösung

Ein zeitgesteuerter, regelbasierter Workflow, der zwei öffentliche Job-APIs abfragt, klare Schlüsselwortregeln anwendet, die Daten vereinheitlicht, Dubletten entfernt und das Ergebnis in eine Tabelle und ein Postfach liefert.

## Inhalt des Projekts

- Ein n8n-Workflow mit 17 Nodes: Zeitplan, zwei API-Zweige, Merge, vier Filter, drei JavaScript-Schritte, Dubletten-Erkennung, Google-Sheets-Upsert und SMTP-E-Mail.
- Ein gemeinsames Jobschema mit zehn Feldern für zwei unterschiedlich aufgebaute APIs, robust gegen fehlende und unerwartete Werte.
- Eine Offline-Testsuite (69 Tests) mit einem kleinen Workflow-Simulator, künstlichen Testdaten und gesperrtem Netzwerkzugriff, vorbereitet für GitHub Actions.
- Dokumentation auf Englisch, Deutsch und Italienisch.

## KI-gestützte Arbeitsweise

- **Projektinhaber:** [Levinci81](https://github.com/Levinci81) hat Ziel, Anforderungen und Sicherheitsregeln festgelegt, über Umfang und Sicherheit entschieden und jeden Schritt freigegeben.
- **KI-Assistent:** Claude Code (Anthropic) hat Analyse, Codeänderungen, Tests und Dokumentationsentwürfe innerhalb dieser Regeln erstellt.
- **Prüfung:** Ergebnisse wurden nur mit Belegen übernommen – automatisierte Tests, lesende Prüfungen lokaler Daten und Abgleich mit den privaten Originalen.
- **Abgrenzung:** KI war ein Entwicklungswerkzeug. Der Workflow selbst enthält kein KI-Modell; eine KI-gestützte Bewertung von Stellen ist geplant, nicht umgesetzt.

## Fähigkeiten und Nachweise

| Bereich | Nachweis in diesem Repository |
|---|---|
| Workflow-Automatisierung (n8n) | [`workflow/jobhunter-ai.json`](../workflow/jobhunter-ai.json): Zeitplan, Verzweigung, Merge, Filter, geprüfte Verdrahtung |
| API-Integration | Zwei REST/JSON-APIs in ein Schema überführt ([Architektur](architecture.de.md#datenschema)) |
| JavaScript | Code-Nodes für das 7-Tage-Fenster, die Normalisierung und die HTML-E-Mail |
| Datenqualität | Klassifizierung per Regex, URL-Prüfung und Dubletten-Erkennung, idempotenter Upsert |
| Google-Workspace-Integration | Google Sheets über OAuth2 mit *Append or Update* |
| Automatisierte Tests | [`tests/`](../tests/): Struktur-, Pipeline-, Randfall-, Sicherheits- und Dokumentationstests |
| Sicherheitsbewusstsein | Geheimnisse entfernt, Credential-Speicher, HTML-Maskierung, Secret-Scan im ganzen Repository ([SECURITY.md](../SECURITY.md)) |
| Fehleranalyse | Ursache ausgefallener zeitgesteuerter Läufe ermittelt und dokumentiert ([Einrichtung](setup.de.md#fehlerbehebung)) |
| KI-gestützte Entwicklung | Anforderungen, Freigabeschritte und Prüfung dokumentiert ([README](../README.de.md#ki-gestützte-entwicklung-ai-assisted-development)) |
| Technisches Schreiben | Dreisprachige README, Architektur-, Einrichtungs- und Testdokumentation |

## Gefundene Probleme und ihre Behandlung

- **Sitzungscookie im privaten Workflow gespeichert** → Quelle entfernt, öffentliche Version aus einer sauberen Kopie neu aufgebaut, Secret-Scan ergänzt.
- **Zeitgesteuerte Läufe fehlten tagelang** → Ursache gefunden (n8n lief um 09:00 Uhr nicht), Betriebshinweise ergänzt.
- **Verdrahtungsfehler** (doppelte Verarbeitung, umgangener Rollenfilter) → behoben; Tests schlagen fehl, wenn sie wieder eingebaut werden.
- **Fehlerhafte Jobdaten konnten den ganzen Lauf abbrechen** → Filter und Normalisierung gehärtet, durch Randfall-Tests abgedeckt.
- **Mehrdeutige Filterregeln** → nicht stillschweigend geändert; Optionen und Empfehlungen dokumentiert ([offene Designentscheidungen](architecture.de.md#offene-designentscheidungen)).

## Ehrlicher Umfang

- Die Filterung ist regelbasiert. Eine KI-gestützte Bewertung ist geplant, nicht umgesetzt.
- Die öffentliche Version ist mit statischen Prüfungen, einer Offline-Simulation und einem isolierten Lauf in n8n 2.37.10 mit künstlichen Daten verifiziert; echte API-Anfragen, Google Sheets und SMTP wurden nicht getestet.

## Links

- Projektübersicht: [README](../README.de.md)
- Autor: [Levinci81 auf GitHub](https://github.com/Levinci81)

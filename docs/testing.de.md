# Tests

[English](testing.en.md) · **Deutsch** · [Italiano](testing.it.md) · [Zurück zur README](../README.de.md)

## Ausführen

```bash
npm test            # alle Tests, keine Abhängigkeiten, kein Netzwerkzugriff
npm run examples    # examples/ aus den künstlichen Testdaten neu erzeugen
```

Erfordert Node.js 22 oder neuer. Derselbe Befehl ist für GitHub Actions bei jedem Push und Pull Request eingerichtet ([`.github/workflows/tests.yml`](../.github/workflows/tests.yml)); er läuft erstmals nach der Veröffentlichung des Repositorys.

## Prüfstufen

| Stufe | Status | Umfang |
|---|---|---|
| Offline-Tests | **69 von 69 bestanden** | Struktur der Workflow-Datei, originales JavaScript der Code-Nodes, Dokumentation, Secret-Scan |
| Simuliertes n8n-Verhalten | durch die Offline-Tests abgedeckt | Filter, Merge, Split Out, Set, Remove Duplicates, HTTP Request, Google Sheets und Send Email sind im Simulator nachgebildet oder ersetzt |
| Isolierter Lauf in n8n 2.37.10 | **alle Prüfungen bestanden** | Testvariante mit künstlichen Daten ausgeführt; identische Ergebnisse zur Simulation in allen 17 Nodes |
| Echte APIs, Google Sheets, SMTP in n8n | **nicht getestet** | Erfordert echte Zugangsdaten; nicht Teil des isolierten Tests |

## Was getestet wird

| Datei | Tests | Prüfumfang |
|---|---|---|
| [`tests/structure.test.mjs`](../tests/structure.test.mjs) | 14 | JSON-Gültigkeit, eindeutige Namen und IDs, Node-Typen und -Versionen, alle Verbindungsziele vorhanden, Merge-Eingänge, Erreichbarkeit vom Trigger, keine Zyklen, keine Zugangsdaten oder IDs, nur die beiden öffentlichen APIs, Zeitplan und Zeitzone |
| [`tests/pipeline.test.mjs`](../tests/pipeline.test.mjs) | 14 | Vollständiger Offline-Lauf mit künstlichen Daten: alle Filter, Merge, Normalisierung, URL-Prüfung, Dubletten-Erkennung, Sheet-Upsert, E-Mail, Maskierung, leere und fehlerhafte API-Antworten; Netzwerkzugriff ist gesperrt |
| [`tests/edge-cases.test.mjs`](../tests/edge-cases.test.mjs) | 11 | Einzelne Nodes mit Randfällen: ungewöhnliche Typen, fehlende Felder, Datumsgrenzen, ungültige Daten und URLs, Sonderzeichen, Regions- und Vertriebsabgleich |
| [`tests/security.test.mjs`](../tests/security.test.mjs) | 17 | Suche im gesamten Repository nach Cookies, Tokens, Schlüsseln, Sheet-URLs, Instanz-Metadaten, persönlichen E-Mail-Adressen, lokalen Pfaden und privaten Exporten |
| [`tests/docs.test.mjs`](../tests/docs.test.mjs) | 11 | Lokale Links funktionieren, externe Links nur zu erwarteten Hosts, EN/DE/IT-Dokumente haben dieselbe Struktur, Copyright-Hinweis, keine Lizenzdatei, KI nur als geplant beschrieben |
| [`tests/examples.test.mjs`](../tests/examples.test.mjs) | 2 | `examples/` entspricht der Workflow-Ausgabe, Spaltenvorlage entspricht der Spaltenzuordnung |

## Testdaten

Die Testdaten in [`tests/fixtures/`](../tests/fixtures/) sind künstlich. Sie folgen dem Antwortformat der öffentlichen APIs von Arbeitnow und Remotive, alle Unternehmen sind jedoch erfunden und alle Links zeigen auf `example.com`. Der Bezugszeitpunkt ist fest auf 2026-10-13 08:00 UTC gesetzt, damit der 7-Tage-Filter bei jedem Lauf dasselbe Ergebnis liefert.

## Testmatrix der Pipeline

| Fall | Quelle | Erwartetes Ergebnis | Grund |
|---|---|---|---|
| A1 | Arbeitnow | behalten | remote, 2 Tage alt, IT-Support-Titel |
| A2 | Arbeitnow | entfernt durch *Remote Only* | nicht remote |
| A3 | Arbeitnow | entfernt durch *Posted Within 7 Days* | 10 Tage alt |
| A4 | Arbeitnow | entfernt durch *Support Roles Without Sales* | Vertriebsbegriff im Titel |
| A5 | Arbeitnow | entfernt durch *Support Roles Without Sales* | kein Support-Schlüsselwort |
| A6 | Arbeitnow | entfernt durch *Deduplicate by URL* | gleiche URL wie R3 |
| A7 | Arbeitnow | entfernt durch *Posted Within 7 Days* | Datum in der Zukunft |
| A8 | Arbeitnow | behalten | erfüllt die Regionsbedingung nur über `eu` in *Deutschland* (bekannte Einschränkung) |
| A9 | Arbeitnow | behalten, in der E-Mail maskiert | Script-Tag, kaufmännisches Und und Anführungszeichen in Titel und Unternehmen |
| A10 | Arbeitnow | entfernt durch *Normalize Job Schema* | `javascript:`-URL ist kein gültiger Link |
| A11 | Arbeitnow | entfernt durch *Support Title Check* | Titel fehlt; darf den Lauf nicht abbrechen |
| A12 | Arbeitnow | entfernt durch *Remote Only* | `remote` ist der Text `"true"` |
| R1 | Remotive | behalten | Support-Titel, Europa |
| R2 | Remotive | entfernt durch *Support Title Check* | Region *Worldwide*, aber kein Support-Titel |
| R3 | Remotive | behalten | technischer Support, Italien |
| R4 | Remotive | entfernt durch *Support Title or Target Region* | weder Support-Titel noch Zielregion |
| R5 | Remotive | entfernt durch *Deduplicate by URL* | gleiche URL wie R1 |
| R6 | Remotive | entfernt durch *Support Title or Target Region* | Titel fehlt, Ort ist eine Zahl; darf den Lauf nicht abbrechen |

Erwartetes Endergebnis: 5 Zeilen im Sheet (R1, R3, A1, A8, A9) und eine E-Mail mit 5 Einträgen und 5 Links. Die erzeugte Ausgabe liegt in [`examples/`](../examples/).

## Randfälle

- **Leere Ergebnisse:** beide APIs leer → kein Sheet-Schreibvorgang, keine E-Mail; eine API leer → die andere Quelle wird trotzdem verarbeitet.
- **Dubletten:** innerhalb einer Quelle und quellenübergreifend; der erste Eintrag bleibt erhalten.
- **Ungültige URLs:** `javascript:`, `data:`, `ftp:`, relative Pfade, URLs mit Leerzeichen und leere Werte werden verworfen oder nicht als Link ausgegeben.
- **HTML-Sonderzeichen:** `<`, `>`, `&`, `"` und `'` werden in Titeln, Unternehmen und Links maskiert.
- **Fehlende Felder und ungewöhnliche Typen:** fehlende Titel, `null`, Zahlen, Arrays und Objekte brechen den Lauf nicht ab.
- **Datumsangaben:** 7-Tage-Grenze, Daten in der Zukunft, Text statt Zeitstempel, Zahlen außerhalb des gültigen Bereichs.
- **Unerwartete API-Formate:** Eine Antwort ohne das erwartete Array wird als leer behandelt, ein Wert, der kein Array ist, bricht den Lauf ab – beides sind Annahmen des Simulators, die in n8n noch bestätigt werden müssen.

## Ergebnisse

- Letzter lokaler Lauf: 2026-10-13, Node.js 24.20.0 unter Windows 11 – **69 von 69 Tests bestanden**.
- Gegenprobe: Werden die beiden behobenen Verdrahtungsfehler oder der frühere E-Mail-Code ohne Maskierung wieder eingebaut, schlagen die erwarteten Ergebnisse fehl.
- Vor der Bereinigung wurden gleichwertige Strukturprüfungen (JSON-Gültigkeit, Verbindungsreferenzen, Merge-Eingänge) am privaten Vorgänger durchgeführt.

## Isolierter n8n-Test

Durchgeführt am 2026-10-13 mit n8n 2.37.10 in einem separaten, leeren n8n-Datenordner (keine Zugangsdaten, Telemetrie deaktiviert, Produktivinstanz gestoppt und unberührt) über die n8n-CLI (`import:workflow`, `execute`).

- **Testvariante:** Der Zeitplan-Trigger wurde durch einen manuellen Trigger ersetzt, die beiden HTTP-Nodes durch Code-Nodes, die die künstlichen Testdaten liefern, und die Google-Sheets- und E-Mail-Nodes durch NoOp-Nodes. Alle übrigen Nodes liefen unverändert.
- **Ergebnis:** alle Prüfungen bestanden – die Anzahl der Einträge aller 17 Nodes, die neun normalisierten Datensätze, die fünf URLs nach der Dubletten-Erkennung und das vollständige E-Mail-HTML waren identisch mit der Offline-Simulation.
- **Erkenntnisse:** Der CLI-Import verlangt eine Workflow-`id`; `n8n execute` benötigt einen manuellen Trigger; `n8n execute` ignoriert angeheftete Daten (ein erster Versuch mit angehefteten Daten erreichte die HTTP-Nodes, die auf einen geschlossenen lokalen Port zeigten, sodass keine Anfrage den Rechner verließ).
- **Nicht abgedeckt:** echte API-Antworten, OAuth und Upsert von Google Sheets, SMTP, der Zeitplan-Trigger und der Import über den n8n-Editor.


- Das JavaScript der Code-Nodes läuft unverändert, aber Filter, Merge, Split Out, Set und Remove Duplicates sind in [`tests/lib/simulator.mjs`](../tests/lib/simulator.mjs) für die in diesem Workflow genutzten Optionen nachgebildet. Das ist eine Annäherung an n8n, nicht n8n selbst.
- HTTP Request, Google Sheets und Send Email werden durch Testdaten und Aufzeichnungen ersetzt; echte API-Antworten, OAuth und SMTP werden nicht geprüft.
- Der obige isolierte n8n-Test bestätigt die simulierten Nodes für diesen Datensatz; er ersetzt keinen Lauf mit echten Zugangsdaten.

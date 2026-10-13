# Test

[English](testing.en.md) · [Deutsch](testing.de.md) · **Italiano** · [Torna al README](../README.it.md)

## Come eseguirli

```bash
npm test            # tutti i test, nessuna dipendenza, nessun accesso alla rete
npm run examples    # rigenera examples/ dai dati di test sintetici
```

Richiede Node.js 22 o successivo. Lo stesso comando è configurato in GitHub Actions per ogni push e pull request ([`.github/workflows/tests.yml`](../.github/workflows/tests.yml)); verrà eseguito per la prima volta dopo la pubblicazione del repository.

## Livelli di verifica

| Livello | Stato | Cosa copre |
|---|---|---|
| Test offline | **69 su 69 superati** | Struttura del file del workflow, JavaScript originale dei nodi Code, documentazione, scansione dei segreti |
| Comportamento n8n simulato | coperto dai test offline | Filter, Merge, Split Out, Set, Remove Duplicates, HTTP Request, Google Sheets e Send Email sono reimplementati o sostituiti nel simulatore |
| Esecuzione isolata in n8n 2.37.10 | **tutti i controlli superati** | Variante di test eseguita con dati sintetici; risultati identici alla simulazione in tutti i 17 nodi |
| API reali, Google Sheets, SMTP in n8n | **non testati** | Richiedono credenziali reali; non fanno parte del test isolato |

## Cosa viene testato

| File | Test | Cosa verifica |
|---|---|---|
| [`tests/structure.test.mjs`](../tests/structure.test.mjs) | 14 | Validità JSON, nomi e ID univoci, tipi e versioni dei nodi, esistenza di ogni destinazione dei collegamenti, input del merge, raggiungibilità dal trigger, assenza di cicli, nessuna credenziale o ID, solo le due API pubbliche, pianificazione e fuso orario |
| [`tests/pipeline.test.mjs`](../tests/pipeline.test.mjs) | 14 | Esecuzione offline completa con dati sintetici: tutti i filtri, merge, normalizzazione, controllo degli URL, eliminazione dei duplicati, upsert nel foglio, e-mail, escape, risposte API vuote o errate; l'accesso alla rete è bloccato |
| [`tests/edge-cases.test.mjs`](../tests/edge-cases.test.mjs) | 11 | Singoli nodi con casi limite: tipi insoliti, campi mancanti, limiti di data, date e URL non validi, caratteri speciali, corrispondenza di regione e ruoli commerciali |
| [`tests/security.test.mjs`](../tests/security.test.mjs) | 17 | Ricerca in tutto il repository di cookie, token, chiavi, URL di fogli, metadati dell'istanza, indirizzi e-mail personali, percorsi locali ed esportazioni private |
| [`tests/docs.test.mjs`](../tests/docs.test.mjs) | 11 | I link locali funzionano, link esterni solo verso host previsti, i documenti EN/DE/IT hanno la stessa struttura, nota di copyright, nessun file di licenza, IA descritta solo come pianificata |
| [`tests/examples.test.mjs`](../tests/examples.test.mjs) | 2 | `examples/` corrisponde all'output del workflow, il modello di intestazione corrisponde alla mappatura delle colonne |

## Dati di test

I dati in [`tests/fixtures/`](../tests/fixtures/) sono sintetici. Seguono il formato di risposta delle API pubbliche di Arbeitnow e Remotive, ma tutte le aziende sono inventate e tutti i link puntano a `example.com`. Il momento di riferimento è fissato al 2026-10-13 08:00 UTC, così il filtro dei 7 giorni dà lo stesso risultato a ogni esecuzione.

## Matrice dei test della pipeline

| Caso | Fonte | Risultato atteso | Motivo |
|---|---|---|---|
| A1 | Arbeitnow | mantenuta | remota, di 2 giorni, titolo di supporto IT |
| A2 | Arbeitnow | rimossa da *Remote Only* | non remota |
| A3 | Arbeitnow | rimossa da *Posted Within 7 Days* | di 10 giorni |
| A4 | Arbeitnow | rimossa da *Support Roles Without Sales* | termine commerciale nel titolo |
| A5 | Arbeitnow | rimossa da *Support Roles Without Sales* | nessuna parola chiave di supporto |
| A6 | Arbeitnow | rimossa da *Deduplicate by URL* | stesso URL di R3 |
| A7 | Arbeitnow | rimossa da *Posted Within 7 Days* | data nel futuro |
| A8 | Arbeitnow | mantenuta | soddisfa la condizione sulla regione solo tramite `eu` in *Deutschland* (limitazione nota) |
| A9 | Arbeitnow | mantenuta, con escape nell'e-mail | tag script, e commerciale e virgolette in titolo e azienda |
| A10 | Arbeitnow | rimossa da *Normalize Job Schema* | l'URL `javascript:` non è un link valido |
| A11 | Arbeitnow | rimossa da *Support Title Check* | titolo mancante; non deve interrompere l'esecuzione |
| A12 | Arbeitnow | rimossa da *Remote Only* | `remote` è il testo `"true"` |
| R1 | Remotive | mantenuta | titolo di supporto, Europa |
| R2 | Remotive | rimossa da *Support Title Check* | regione *Worldwide* ma titolo non di supporto |
| R3 | Remotive | mantenuta | supporto tecnico, Italia |
| R4 | Remotive | rimossa da *Support Title or Target Region* | né titolo di supporto né regione di destinazione |
| R5 | Remotive | rimossa da *Deduplicate by URL* | stesso URL di R1 |
| R6 | Remotive | rimossa da *Support Title or Target Region* | titolo mancante, località numerica; non deve interrompere l'esecuzione |

Risultato finale atteso: 5 righe nel foglio (R1, R3, A1, A8, A9) e un'e-mail con 5 voci e 5 link. L'output generato è in [`examples/`](../examples/).

## Casi limite

- **Risultati vuoti:** entrambe le API vuote → nessuna scrittura nel foglio, nessuna e-mail; una API vuota → l'altra fonte viene comunque elaborata.
- **Duplicati:** all'interno di una fonte e tra fonti diverse; prevale la prima occorrenza.
- **URL non validi:** `javascript:`, `data:`, `ftp:`, percorsi relativi, URL con spazi e valori vuoti vengono scartati o non mostrati come link.
- **Caratteri speciali HTML:** `<`, `>`, `&`, `"` e `'` vengono sottoposti a escape in titoli, aziende e link.
- **Campi mancanti e tipi insoliti:** titoli mancanti, `null`, numeri, array e oggetti non interrompono l'esecuzione.
- **Date:** limite dei 7 giorni, date future, testo al posto dei timestamp, numeri fuori intervallo.
- **Formati API inattesi:** una risposta senza l'array previsto viene trattata come vuota, un valore che non è un array interrompe l'esecuzione – entrambe sono ipotesi del simulatore ancora da confermare in n8n.

## Risultati

- Ultima esecuzione locale: 2026-10-13, Node.js 24.20.0 su Windows 11 – **69 test superati su 69**.
- Controllo per mutazione: reintroducendo i due errori di collegamento corretti o il precedente codice e-mail senza escape, i risultati attesi non vengono più raggiunti.
- Prima della pulizia sono stati eseguiti controlli strutturali equivalenti (validità JSON, riferimenti dei collegamenti, input del merge) sul predecessore privato.

## Test isolato in n8n

Eseguito il 2026-10-13 con n8n 2.37.10 in una cartella dati n8n separata e vuota (nessuna credenziale, telemetria disattivata, istanza di produzione ferma e non toccata) tramite la CLI di n8n (`import:workflow`, `execute`).

- **Variante di test:** il trigger pianificato è stato sostituito da un trigger manuale, i due nodi HTTP da nodi Code che restituiscono i dati sintetici e i nodi Google Sheets ed e-mail da nodi NoOp. Tutti gli altri nodi sono stati eseguiti senza modifiche.
- **Risultato:** tutti i controlli superati – il numero di elementi di tutti i 17 nodi, i nove record normalizzati, i cinque URL dopo l'eliminazione dei duplicati e l'intero HTML dell'e-mail erano identici alla simulazione offline.
- **Osservazioni:** l'importazione via CLI richiede un `id` del workflow; `n8n execute` richiede un trigger manuale; `n8n execute` ignora i dati fissati (un primo tentativo con dati fissati ha raggiunto i nodi HTTP, che puntavano a una porta locale chiusa, quindi nessuna richiesta è uscita dal computer).
- **Non coperto:** risposte API reali, OAuth e upsert di Google Sheets, SMTP, il trigger pianificato e l'importazione tramite l'editor di n8n.


- Il JavaScript dei nodi Code viene eseguito senza modifiche, ma Filter, Merge, Split Out, Set e Remove Duplicates sono reimplementati in [`tests/lib/simulator.mjs`](../tests/lib/simulator.mjs) per le opzioni usate da questo workflow. È un'approssimazione di n8n, non n8n stesso.
- HTTP Request, Google Sheets e Send Email sono sostituiti da dati di test e registratori; risposte reali delle API, OAuth e SMTP non vengono verificati.
- Il test isolato in n8n descritto sopra conferma i nodi simulati per questo insieme di dati; non sostituisce un'esecuzione con credenziali reali.

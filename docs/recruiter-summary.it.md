# Sintesi per recruiter – Jobhunter AI Agent GitHub

[English](recruiter-summary.en.md) · [Deutsch](recruiter-summary.de.md) · **Italiano** · [Torna al README](../README.it.md)

## In una frase

Un progetto di sviluppo assistito dall'IA: un'automazione n8n self-hosted che ogni mattina trova offerte da remoto pertinenti nel supporto e nel servizio clienti, le salva senza duplicati in Google Sheets e invia un breve riepilogo via e-mail – documentata in tre lingue, testata offline e priva di segreti.

## Problema

Controllare ogni giorno più portali per lo stesso tipo di ruolo richiede tempo e produce duplicati e risultati non pertinenti (ad esempio posizioni commerciali che citano il "customer support").

## Soluzione

Un unico workflow pianificato e basato su regole che interroga due API pubbliche, applica regole chiare sulle parole chiave, uniforma i dati, elimina i duplicati e consegna il risultato a un foglio di calcolo e a una casella di posta.

## Contenuto del progetto

- Un workflow n8n con 17 nodi: pianificazione, due rami API, merge, quattro filtri, tre passaggi JavaScript, eliminazione dei duplicati, upsert in Google Sheets ed e-mail SMTP.
- Uno schema comune a dieci campi per due API con struttura diversa, robusto contro valori mancanti e inattesi.
- Una suite di test offline (69 test) con un piccolo simulatore del workflow, dati di test sintetici e rete bloccata, predisposta per GitHub Actions.
- Documentazione in inglese, tedesco e italiano.

## Metodo di lavoro assistito dall'IA

- **Titolare:** [Levinci81](https://github.com/Levinci81) ha definito obiettivo, requisiti e regole di sicurezza, ha preso le decisioni su ambito e sicurezza e ha approvato ogni passaggio.
- **Assistente IA:** Claude Code (Anthropic) ha svolto analisi, modifiche al codice, test e bozze della documentazione nel rispetto di queste regole.
- **Verifica:** i risultati sono stati accettati solo con evidenze – test automatizzati, controlli in sola lettura dei dati locali e confronto con gli originali privati.
- **Distinzione:** l'IA è stata uno strumento di sviluppo. Il workflow non contiene alcun modello di IA; una valutazione delle offerte basata sull'IA è pianificata, non implementata.

## Competenze ed evidenze

| Ambito | Evidenza in questo repository |
|---|---|
| Automazione dei workflow (n8n) | [`workflow/jobhunter-ai.json`](../workflow/jobhunter-ai.json): pianificazione, diramazioni, merge, filtri, collegamenti verificati |
| Integrazione di API | Due API REST/JSON convertite in un unico schema ([architettura](architecture.it.md#schema-dei-dati)) |
| JavaScript | Nodi Code per la finestra di 7 giorni, la normalizzazione e l'e-mail HTML |
| Qualità dei dati | Classificazione con regex, controllo e deduplicazione degli URL, upsert idempotente |
| Integrazione Google Workspace | Google Sheets tramite OAuth2 con *append or update* |
| Test automatizzati | [`tests/`](../tests/): test di struttura, pipeline, casi limite, sicurezza e documentazione |
| Consapevolezza della sicurezza | Segreti rimossi, archivio credenziali, escape HTML, scansione dei segreti nell'intero repository ([SECURITY.md](../SECURITY.md)) |
| Analisi dei problemi | Individuata e documentata la causa delle esecuzioni pianificate mancate ([installazione](setup.it.md#risoluzione-dei-problemi)) |
| Sviluppo assistito dall'IA | Requisiti, passaggi di approvazione e verifiche documentati ([README](../README.it.md#sviluppo-assistito-dallia-ai-assisted-development)) |
| Scrittura tecnica | README, architettura, installazione e test documentati in tre lingue |

## Problemi individuati e come sono stati gestiti

- **Cookie di sessione salvato nel workflow privato** → fonte rimossa, versione pubblica ricostruita da una copia pulita, scansione dei segreti aggiunta.
- **Esecuzioni pianificate mancanti per giorni** → causa individuata (alle 09:00 n8n non era in esecuzione), note operative aggiunte.
- **Errori di collegamento** (elaborazione doppia, filtro sul ruolo aggirato) → corretti; i test falliscono se vengono reintrodotti.
- **Dati delle offerte errati potevano interrompere l'intera esecuzione** → filtri e normalizzazione resi robusti, coperti da test sui casi limite.
- **Regole di filtro ambigue** → non modificate di nascosto; opzioni e raccomandazioni documentate ([decisioni progettuali aperte](architecture.it.md#decisioni-progettuali-aperte)).

## Ambito reale

- Il filtraggio è basato su regole. Una valutazione basata sull'IA è pianificata, non implementata.
- La versione pubblica è verificata con controlli statici, una simulazione offline e un'esecuzione isolata in n8n 2.37.10 con dati sintetici; richieste API reali, Google Sheets e SMTP non sono stati testati.

## Link

- Panoramica del progetto: [README](../README.it.md)
- Autore: [Levinci81 su GitHub](https://github.com/Levinci81)

---
type: decision
tags: [scraping, firecrawl, cost]
last_updated: 2026-04-19
---

*EN: Use Firecrawl markdown format + regex parser instead of LLM extraction to reduce credits from ~5 to ~1 per car.*

# Firecrawl Markdown statt LLM-Extraktion

**Datum:** 2026-04-19
**Status:** entschieden

## Kontext

ev-database.org ist Cloudflare-geschützt. Firecrawl wurde gewählt weil es Cloudflare transparent handled. Der initiale Ansatz (`formats: ['extract']` mit JSON-Schema) verbrauchte ~5 Credits pro Auto — bei 1262 Autos ~6300 Credits, was den Free-Plan (500) und fast den Hobby-Plan (3000) übersteigt.

## Entscheidung

`formats: ['markdown']` mit eigenem Regex-Parser verwenden. ev-database.org hat sehr konsistentes Tabellenformat, das direkt parsebar ist ohne KI.

## Alternativen

- LLM-Extraktion (`formats: ['extract']`) — verworfen wegen ~5× höherer Credit-Kosten
- Anderer Scraping-Dienst — verworfen, da Firecrawl Cloudflare bereits handled
- Puppeteer/Playwright self-hosted — verworfen wegen Cloudflare-Block-Risiko

## Konsequenzen

- ~1 Credit pro Auto statt ~5 → alle 1262 Autos mit ~1300 Credits
- Parser in `scripts/scrape-ev-database.js` (`parseMarkdown()` Funktion)
- Bei Änderungen am HTML-Format von ev-database.org muss der Parser angepasst werden

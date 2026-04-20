# EV Data Enrichment System — Design Spec

**Datum:** 2026-04-20  
**Status:** Approved

---

## Überblick

Ein automatisches Hintergrund-System das fehlende oder falsche (= `0` / `""`) Fahrzeugdaten in Firestore ergänzt. Primärquelle: ev-database.org (fetch + cheerio). Sekundärquelle: Herstellerwebseiten. Fallback: Claude API. Läuft täglich als GitHub Action.

---

## Architektur & Ablauf

```
Firestore (ev_cars)
    ↓  [liest Fahrzeuge mit leeren/0 Feldern]
Enrichment Pipeline (Node.js Script)
    ↓
  1. ev-database.org (fetch + cheerio)
       → Treffer: confidence "high"
       → kein Treffer / Feld leer:
  2. Herstellerwebseite
       → Treffer: confidence "medium"
       → kein Treffer:
  3. Claude API (claude-haiku-4-5)
       → confidence "low"
    ↓
Merge: nur leere/0-Felder werden befüllt
    ↓
Firestore updateDoc
    ↓
GitHub Action (cron täglich 03:00 UTC)
```

---

## Datenmodell: `_enriched`

Jedes Fahrzeug bekommt ein `_enriched`-Objekt in Firestore:

```json
{
  "_enriched": {
    "reichweite_wltp": {
      "source": "ev-database.org",
      "confidence": "high",
      "action": "filled",
      "at": "2026-04-20"
    },
    "leistung_kw": {
      "source": "claude",
      "confidence": "low",
      "action": "corrected",
      "at": "2026-04-20"
    }
  }
}
```

**`action`-Werte:**
- `filled` — Feld war leer (`""`) oder `0`, wurde mit echtem Wert befüllt
- `corrected` — Feld hatte `0`, wurde durch gefundenen Wert ersetzt

---

## Fehlerkennung: "Offensichtlich falsch"

Ein Feldwert gilt als falsch wenn er `0` (Number) oder `""` (String) ist. Keine Wertebereiche, keine statistischen Ausreißer — zu riskant bei Spezialfahrzeugen.

Bestehende Nicht-Null-Werte werden **nie** überschrieben.

---

## ev-database.org Suche (Primärquelle)

1. Suche: `https://ev-database.org/search#search={marke}+{modell}`
2. Cheerio parst Ergebnisliste, Fuzzy-Match auf Marke + Modell + Baujahr
3. Detail-Seite: Spec-Tabellen extrahieren (HTML, nicht Markdown)
4. Logik orientiert sich am bestehenden `scrape-ev-database.js`

---

## Herstellerwebseiten (Sekundärquelle)

Einfache URL-Patterns pro Marke (Tesla, VW, BMW, etc.).  
fetch + cheerio, spezifische Selektoren pro Hersteller.  
Nur aktiviert wenn ev-database.org für ein Feld nichts liefert.

---

## Claude API Fallback

- Modell: `claude-haiku-4-5` (kostengünstig)
- Input: Marke, Modell, Baujahr + Liste der fehlenden Felder
- Output: strukturiertes JSON mit Werten + Einschätzung
- Confidence: immer `"low"`
- Wird nur für Felder aufgerufen die nach Schritt 1+2 noch leer sind

---

## Admin-UI: Enrichment-Badge

Nur im eingeloggten Admin-Modus sichtbar. Normalen Nutzern sehen nur den Wert.

Pro betroffenes Feld erscheint ein kleines Icon neben dem Wert:

| Icon | Bedeutung | Tooltip |
|------|-----------|---------|
| `↺` | Ergänzt/Korrigiert | "Ergänzt · ev-database.org · 20.04.2026" |
| `⚠` | KI-Schätzung | "KI-Schätzung · niedrige Konfidenz · 20.04.2026" |

---

## GitHub Action

```yaml
on:
  schedule:
    - cron: '0 3 * * *'
  workflow_dispatch:

jobs:
  enrich:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci --prefix ev-database
      - run: node ev-database/scripts/enrich-cars.js
        env:
          FIREBASE_SERVICE_ACCOUNT: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

**Secrets:**
- `FIREBASE_SERVICE_ACCOUNT` — JSON des Service Accounts (bereits als `serviceAccountKey.json` vorhanden)
- `ANTHROPIC_API_KEY` — für Claude Fallback

**Laufzeit:** ~1–3 Min je nach Fahrzeuganzahl (500ms Pause zwischen Requests).

**Action-Log Summary:**
```
✓ 23 Felder ergänzt (ev-database.org)
⚠  4 KI-Schätzungen (Claude)
✗  2 Fahrzeuge nicht gefunden
```

---

## Neue Dateien

- `ev-database/scripts/enrich-cars.js` — Haupt-Script
- `ev-database/scripts/enrichment/ev-database-scraper.js` — Scraper Modul
- `ev-database/scripts/enrichment/manufacturer-scraper.js` — Hersteller-Modul
- `ev-database/scripts/enrichment/claude-enrichment.js` — Claude Fallback
- `ev-database/scripts/enrichment/plausibility.js` — `0`/`""`-Erkennung & Merge-Logik
- `.github/workflows/enrich-cars.yml` — GitHub Action

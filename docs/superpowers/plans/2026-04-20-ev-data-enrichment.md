# EV Data Enrichment System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an automated background system that enriches missing/zero EV fields in Firestore using ev-database.org (primary), manufacturer websites (secondary), and Claude API (fallback), with admin-only enrichment badges in the UI.

**Architecture:** A Node.js script (`enrich-cars.js`) reads Firestore via firebase-admin, identifies fields with value `0` or `""` per vehicle, runs a 3-tier pipeline (ev-database.org → manufacturer sites → Claude), and writes updates + `_enriched` metadata back to Firestore. A React `EnrichmentBadge` component displays source/confidence info to authenticated admins in `CarDetail`. The script runs nightly via GitHub Action.

**Tech Stack:** Node.js ESM, cheerio (HTML parsing), @anthropic-ai/sdk (Claude claude-haiku-4-5-20251001), firebase-admin (already in devDeps), vitest (tests), GitHub Actions

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `ev-database/package.json` | Modify | Add cheerio, @anthropic-ai/sdk, vitest |
| `ev-database/scripts/enrichment/plausibility.js` | Create | `isEmpty()` + `mergeEnrichment()` |
| `ev-database/scripts/enrichment/__tests__/plausibility.test.js` | Create | Unit tests |
| `ev-database/scripts/enrichment/ev-database-scraper.js` | Create | fetch + cheerio scraper for ev-database.org |
| `ev-database/scripts/enrichment/manufacturer-scraper.js` | Create | Manufacturer sites (Tesla stub, extensible) |
| `ev-database/scripts/enrichment/claude-enrichment.js` | Create | Claude API fallback |
| `ev-database/scripts/enrich-cars.js` | Create | Orchestrator: Firestore → pipeline → Firestore |
| `.github/workflows/enrich-cars.yml` | Create | Nightly GitHub Action |
| `ev-database/src/components/admin/EnrichmentBadge.jsx` | Create | Badge component (admin-only) |
| `ev-database/src/components/admin/EnrichmentBadge.css` | Create | Badge styles |
| `ev-database/src/components/cars/CarDetail.jsx` | Modify | Show badges for authenticated users |

---

### Task 1: Install Dependencies

**Files:**
- Modify: `ev-database/package.json`

- [ ] **Step 1: Install packages**

```bash
cd ev-database
npm install cheerio @anthropic-ai/sdk
npm install --save-dev vitest
```

- [ ] **Step 2: Add test script to package.json**

In `ev-database/package.json`, add to `"scripts"`:
```json
"test": "vitest run scripts/enrichment/__tests__"
```

- [ ] **Step 3: Verify installs**

```bash
cd ev-database && node --input-type=module << 'EOF'
import * as cheerio from 'cheerio'
import Anthropic from '@anthropic-ai/sdk'
console.log('cheerio ok:', typeof cheerio.load)
console.log('anthropic ok:', typeof Anthropic)
EOF
```

Expected: both lines print `ok`

- [ ] **Step 4: Commit**

```bash
git add ev-database/package.json ev-database/package-lock.json
git commit -m "chore: add cheerio, @anthropic-ai/sdk, vitest for enrichment system"
```

---

### Task 2: Core Logic — isEmpty + mergeEnrichment

**Files:**
- Create: `ev-database/scripts/enrichment/plausibility.js`
- Create: `ev-database/scripts/enrichment/__tests__/plausibility.test.js`

- [ ] **Step 1: Write failing tests**

Create `ev-database/scripts/enrichment/__tests__/plausibility.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { isEmpty, mergeEnrichment } from '../plausibility.js'

describe('isEmpty', () => {
  it('returns true for null', () => expect(isEmpty(null)).toBe(true))
  it('returns true for undefined', () => expect(isEmpty(undefined)).toBe(true))
  it('returns true for 0', () => expect(isEmpty(0)).toBe(true))
  it('returns true for empty string', () => expect(isEmpty('')).toBe(true))
  it('returns true for whitespace string', () => expect(isEmpty('  ')).toBe(true))
  it('returns false for 100', () => expect(isEmpty(100)).toBe(false))
  it('returns false for non-empty string', () => expect(isEmpty('Yes')).toBe(false))
  it('returns false for negative number', () => expect(isEmpty(-1)).toBe(false))
})

describe('mergeEnrichment', () => {
  it('fills 0-value field and marks action as corrected', () => {
    const car = { id: '1', reichweite_wltp: 0, modell: 'Model 3' }
    const updates = mergeEnrichment(car, { reichweite_wltp: 487 }, 'ev-database.org', 'high')
    expect(updates.reichweite_wltp).toBe(487)
    expect(updates._enriched.reichweite_wltp.source).toBe('ev-database.org')
    expect(updates._enriched.reichweite_wltp.confidence).toBe('high')
    expect(updates._enriched.reichweite_wltp.action).toBe('corrected')
    expect(updates._enriched.reichweite_wltp.at).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('uses action "filled" for null field', () => {
    const car = { id: '1', reichweite_wltp: null }
    const updates = mergeEnrichment(car, { reichweite_wltp: 300 }, 'claude', 'low')
    expect(updates._enriched.reichweite_wltp.action).toBe('filled')
  })

  it('does not overwrite existing non-empty values', () => {
    const car = { id: '1', reichweite_wltp: 400 }
    const updates = mergeEnrichment(car, { reichweite_wltp: 500 }, 'ev-database.org', 'high')
    expect(updates.reichweite_wltp).toBeUndefined()
  })

  it('returns empty object when nothing to update', () => {
    const car = { id: '1', reichweite_wltp: 400 }
    const updates = mergeEnrichment(car, { reichweite_wltp: 500 }, 'ev-database.org', 'high')
    expect(Object.keys(updates)).toHaveLength(0)
  })

  it('preserves existing _enriched meta when adding new field', () => {
    const car = {
      id: '1',
      reichweite_wltp: 400,
      leistung_kw: 0,
      _enriched: { reichweite_wltp: { source: 'ev-database.org', confidence: 'high', action: 'filled', at: '2026-01-01' } }
    }
    const updates = mergeEnrichment(car, { leistung_kw: 180 }, 'claude', 'low')
    expect(updates._enriched.reichweite_wltp).toBeDefined()
    expect(updates._enriched.leistung_kw.source).toBe('claude')
  })

  it('skips fields starting with underscore', () => {
    const car = { id: '1', _enriched: {} }
    const updates = mergeEnrichment(car, { _internal: 'x' }, 'ev-database.org', 'high')
    expect(updates._internal).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
cd ev-database && npm test
```

Expected: FAIL with "Cannot find module '../plausibility.js'"

- [ ] **Step 3: Implement plausibility.js**

Create `ev-database/scripts/enrichment/plausibility.js`:

```js
export function isEmpty(val) {
  if (val === null || val === undefined) return true
  if (typeof val === 'number') return val === 0
  if (typeof val === 'string') return val.trim() === ''
  return false
}

export function mergeEnrichment(car, newData, source, confidence) {
  const updates = {}
  const enrichedMeta = { ...(car._enriched || {}) }
  const today = new Date().toISOString().split('T')[0]

  for (const [key, value] of Object.entries(newData)) {
    if (key.startsWith('_')) continue
    if (!isEmpty(car[key])) continue
    if (isEmpty(value)) continue

    updates[key] = value
    enrichedMeta[key] = {
      source,
      confidence,
      action: car[key] === 0 || car[key] === '0' ? 'corrected' : 'filled',
      at: today,
    }
  }

  if (Object.keys(updates).length > 0) {
    updates._enriched = enrichedMeta
  }

  return updates
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
cd ev-database && npm test
```

Expected: 14 tests PASS

- [ ] **Step 5: Commit**

```bash
git add ev-database/scripts/enrichment/plausibility.js ev-database/scripts/enrichment/__tests__/plausibility.test.js
git commit -m "feat: add isEmpty + mergeEnrichment with tests"
```

---

### Task 3: ev-database.org Scraper

**Files:**
- Create: `ev-database/scripts/enrichment/ev-database-scraper.js`

- [ ] **Step 1: Create scraper**

Create `ev-database/scripts/enrichment/ev-database-scraper.js`:

```js
import * as cheerio from 'cheerio'

const BASE = 'https://ev-database.org'
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept': 'text/html,application/xhtml+xml',
}

async function fetchHtml(url) {
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`)
  return res.text()
}

// Find value in HTML spec tables by label text
function tableVal($, label) {
  let result = null
  $('table tr').each((_, row) => {
    const cells = $(row).find('td')
    const cellLabel = cells.first().text().replace(/[*†\\]/g, '').trim()
    if (cellLabel.toLowerCase() === label.toLowerCase()) {
      result = cells.eq(1).text().trim()
      return false // break .each()
    }
  })
  return result
}

function extractNum(str) {
  if (!str) return null
  const m = str.match(/([\d.]+)/)
  return m ? parseFloat(m[1]) : null
}

function parseDetail($) {
  const data = {}

  const cap = tableVal($, 'Useable Capacity')
  if (cap) { const m = cap.match(/([\d.]+)\s*kWh/i); if (m) data.akku_kapazitaet_kwh = parseFloat(m[1]) }

  const arch = tableVal($, 'Architecture')
  if (arch) { const m = arch.match(/(\d+)\s*V/); if (m) data.architektur_volt = parseInt(m[1]) }

  const acPower = tableVal($, 'Charge Power')
  if (acPower) { const m = acPower.match(/([\d.]+)\s*kW/i); if (m) data.laden_ac_kw = parseFloat(m[1]) }

  const dcPower = tableVal($, 'Charge Power (max)')
  if (dcPower) { const m = dcPower.match(/([\d.]+)\s*kW/i); if (m) data.laden_dc_kw = parseFloat(m[1]) }

  // Charge time appears as "Charge Time (Xkm -> Ykm)" or similar
  const ctMatch = $('table').text().match(/Charge Time[^|]*?(\d+)\s*min/)
  if (ctMatch) data.ladezeit_10_80_min = parseInt(ctMatch[1])

  const acc = tableVal($, '0 - 100 km/h')
  if (acc) { const m = acc.match(/([\d.]+)\s*sec/i); if (m) data.beschleunigung_sec = parseFloat(m[1]) }

  const topSpeed = tableVal($, 'Top Speed')
  if (topSpeed) { const m = topSpeed.match(/(\d+)\s*km/i); if (m) data.hoechstgeschwindigkeit_kmh = parseInt(m[1]) }

  const power = tableVal($, 'Power')
  if (power) { const m = power.match(/(\d+)\s*kW/i); if (m) data.leistung_kw = parseInt(m[1]) }

  const len = tableVal($, 'Length'); if (len) { const v = extractNum(len); if (v) data.laenge_mm = v }
  const wid = tableVal($, 'Width');  if (wid) { const v = extractNum(wid); if (v) data.breite_mm = v }
  const hei = tableVal($, 'Height'); if (hei) { const v = extractNum(hei); if (v) data.hoehe_mm = v }
  const wb  = tableVal($, 'Wheelbase'); if (wb) { const v = extractNum(wb); if (v) data.radstand_mm = v }

  const weight  = tableVal($, 'Curb Weight');         if (weight) { const v = extractNum(weight); if (v) data.gewicht_leer_kg = v }
  const gvw     = tableVal($, 'Gross Vehicle Weight'); if (gvw) { const v = extractNum(gvw); if (v) data.zul_gesamtgewicht_kg = v }
  const payload = tableVal($, 'Payload');              if (payload) { const v = extractNum(payload); if (v) data.zuladung_kg = v }
  const tow     = tableVal($, 'Towing (braked)');     if (tow) { const v = extractNum(tow); if (v) data.anhaengelast_gebremst_kg = v }
  const towU    = tableVal($, 'Towing (unbraked)');   if (towU) { const v = extractNum(towU); if (v) data.anhaengelast_ungebremst_kg = v }

  const cargo    = tableVal($, 'Cargo Volume');       if (cargo) { const v = extractNum(cargo); if (v) data.kofferraum_l = v }
  const cargoMax = tableVal($, 'Cargo Volume (max)'); if (cargoMax) { const v = extractNum(cargoMax); if (v) data.kofferraum_max_l = v }
  const frunk    = tableVal($, 'Frunk');              if (frunk) { const v = extractNum(frunk); if (v) data.frunk_l = v }
  const roof     = tableVal($, 'Roof Load');          if (roof) { const v = extractNum(roof); if (v) data.dachlast_kg = v }

  const seats = tableVal($, 'Seats')
  if (seats) { const m = seats.match(/(\d+)/); if (m) data.sitze = parseInt(m[1]) }

  const isofix = tableVal($, 'Isofix')
  if (isofix && isofix !== '-') data.isofix = isofix

  const turning = tableVal($, 'Turning Circle')
  if (turning) { const m = turning.match(/([\d.]+)\s*m/i); if (m) data.wendekreis_m = parseFloat(m[1]) }

  const platform = tableVal($, 'Platform')
  if (platform && platform !== '-') data.plattform = platform

  const body = tableVal($, 'Car Body')
  if (body && body !== '-') data.karosserie = body

  const segment = tableVal($, 'Segment')
  if (segment && segment !== '-') data.segment = segment

  const hp = tableVal($, 'Heat pump (HP)')
  if (hp) data.waermepumpe = hp.toLowerCase().startsWith('yes') ? 'Yes' : 'No'

  // WLTP range: look for km value in WLTP section heading area
  const fullText = $.html()
  const wltpSection = fullText.match(/WLTP[\s\S]{0,500}?(\d{3,4})\s*km/i)
  if (wltpSection) data.reichweite_wltp = parseInt(wltpSection[1])

  // Germany price: € followed by number in Germany row
  const priceMatch = $('*').filter((_, el) => $(el).text().includes('Germany')).text().match(/€\s*([\d,.]+)/)
  if (priceMatch) data.preis_de = parseInt(priceMatch[1].replace(/[,.\s]/g, '').slice(0, 6))

  return data
}

function fuzzyScore(linkText, marke, modell) {
  const name = linkText.toLowerCase()
  const brand = marke.toLowerCase()
  const model = modell.toLowerCase()
  let score = 0
  if (name.includes(brand)) score += 2
  model.split(' ').forEach(word => {
    if (word.length > 1 && name.includes(word)) score += 1
  })
  return score
}

export async function enrichFromEvDatabase(car) {
  try {
    const html = await fetchHtml(BASE)
    const $ = cheerio.load(html)

    const links = []
    $('a[href*="/car/"]').each((_, el) => {
      const href = $(el).attr('href')
      const text = $(el).text().trim()
      if (href && /\/car\/\d+/.test(href) && text) {
        links.push({
          href: href.startsWith('http') ? href : `${BASE}${href}`,
          text,
        })
      }
    })

    if (links.length === 0) return {}

    const best = links
      .map(l => ({ ...l, score: fuzzyScore(l.text, car.marke, car.modell) }))
      .filter(l => l.score > 0)
      .sort((a, b) => b.score - a.score)[0]

    if (!best) return {}

    await new Promise(r => setTimeout(r, 500))
    const detailHtml = await fetchHtml(best.href)
    const $detail = cheerio.load(detailHtml)

    return parseDetail($detail)
  } catch (err) {
    console.error(`  ev-database.org error (${car.marke} ${car.modell}): ${err.message}`)
    return {}
  }
}
```

- [ ] **Step 2: Smoke test (no API key needed)**

```bash
cd ev-database && node --input-type=module << 'EOF'
import { enrichFromEvDatabase } from './scripts/enrichment/ev-database-scraper.js'
const result = await enrichFromEvDatabase({ marke: 'Tesla', modell: 'Model 3', baujahr: '2023' })
console.log(JSON.stringify(result, null, 2))
EOF
```

Expected: JSON with populated fields. If result is `{}`, ev-database.org blocked the request via Cloudflare — the Claude fallback will cover this case. Note any HTML selector issues for adjustment.

- [ ] **Step 3: Commit**

```bash
git add ev-database/scripts/enrichment/ev-database-scraper.js
git commit -m "feat: add ev-database.org scraper (fetch + cheerio)"
```

---

### Task 4: Manufacturer Scraper

**Files:**
- Create: `ev-database/scripts/enrichment/manufacturer-scraper.js`

- [ ] **Step 1: Create manufacturer scraper**

Create `ev-database/scripts/enrichment/manufacturer-scraper.js`:

```js
// One scraper function per manufacturer. Add new brands by implementing a scrapeXxx()
// function and registering it in SCRAPERS below.

const HEADERS = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }

async function scrapeTesla(car) {
  const MODEL_SLUGS = {
    'model 3': 'model3',
    'model y': 'modely',
    'model s': 'models',
    'model x': 'modelx',
    'cybertruck': 'cybertruck',
  }
  const slug = MODEL_SLUGS[car.modell.toLowerCase()]
  if (!slug) return {}

  try {
    const res = await fetch(`https://www.tesla.com/de_DE/${slug}`, { headers: HEADERS })
    if (!res.ok) return {}
    const html = await res.text()
    const data = {}

    const rangeMatch = html.match(/"range"[^}]{0,200}?(\d{3,4})\s*km/i)
    if (rangeMatch) data.reichweite_wltp = parseInt(rangeMatch[1])

    const powerMatch = html.match(/"power"[^}]{0,100}?(\d{2,4})\s*kW/i)
    if (powerMatch) data.leistung_kw = parseInt(powerMatch[1])

    return data
  } catch {
    return {}
  }
}

const SCRAPERS = {
  tesla: scrapeTesla,
}

export async function enrichFromManufacturer(car) {
  const brand = car.marke.toLowerCase()
  const scraper = SCRAPERS[brand]
  if (!scraper) return {}
  try {
    return await scraper(car)
  } catch (err) {
    console.error(`  manufacturer scraper error (${car.marke}): ${err.message}`)
    return {}
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add ev-database/scripts/enrichment/manufacturer-scraper.js
git commit -m "feat: add manufacturer scraper (Tesla stub, extensible)"
```

---

### Task 5: Claude API Fallback

**Files:**
- Create: `ev-database/scripts/enrichment/claude-enrichment.js`

- [ ] **Step 1: Create Claude enrichment module**

Create `ev-database/scripts/enrichment/claude-enrichment.js`:

```js
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const FIELD_DESCRIPTIONS = {
  reichweite_wltp:             'WLTP range in km (integer)',
  akku_kapazitaet_kwh:         'usable battery capacity in kWh (number)',
  architektur_volt:            'battery voltage architecture, typically 400 or 800 (integer)',
  laden_ac_kw:                 'max AC onboard charging power in kW (number)',
  laden_dc_kw:                 'max DC fast charging power in kW (number)',
  ladezeit_10_80_min:          'DC charge time from 10% to 80% in minutes (integer)',
  beschleunigung_sec:          '0-100 km/h acceleration time in seconds (number)',
  hoechstgeschwindigkeit_kmh:  'top speed in km/h (integer)',
  leistung_kw:                 'total motor power in kW (integer)',
  laenge_mm:                   'vehicle length in mm (integer)',
  breite_mm:                   'vehicle width excluding mirrors in mm (integer)',
  hoehe_mm:                    'vehicle height in mm (integer)',
  radstand_mm:                 'wheelbase in mm (integer)',
  gewicht_leer_kg:             'curb weight in kg (integer)',
  zul_gesamtgewicht_kg:        'gross vehicle weight rating in kg (integer)',
  zuladung_kg:                 'payload capacity in kg (integer)',
  anhaengelast_gebremst_kg:    'braked trailer towing capacity in kg (integer)',
  anhaengelast_ungebremst_kg:  'unbraked trailer towing capacity in kg (integer)',
  kofferraum_l:                'boot / cargo volume in liters (integer)',
  kofferraum_max_l:            'max cargo volume with rear seats folded in liters (integer)',
  frunk_l:                     'front trunk volume in liters (integer)',
  dachlast_kg:                 'roof load capacity in kg (integer)',
  sitze:                       'number of seats (integer)',
  isofix:                      'ISOFIX child seat anchors, e.g. "Yes" or "No"',
  wendekreis_m:                'turning circle diameter in meters (number)',
  plattform:                   'platform name, e.g. "MEB", "e-GMP", "ORA"',
  karosserie:                  'body style, e.g. "SUV", "Sedan", "Hatchback", "Estate"',
  segment:                     'EU segment letter, e.g. "A", "B", "C", "D", "F", "J"',
  waermepumpe:                 'heat pump standard equipment: "Yes" or "No"',
  preis_de:                    'base price in Germany in EUR (integer, no decimals)',
}

export async function enrichFromClaude(car, missingFields) {
  const relevantFields = missingFields.filter(f => FIELD_DESCRIPTIONS[f])
  if (relevantFields.length === 0) return {}

  const fieldLines = relevantFields
    .map(f => `"${f}": ${FIELD_DESCRIPTIONS[f]}`)
    .join('\n')

  const prompt = `You are an automotive data expert with detailed knowledge of electric vehicles up to 2025.

For the ${car.baujahr} ${car.marke} ${car.modell}, provide the following technical specifications.
Return ONLY a valid JSON object with these exact field names.
Use null for any field you are not confident about — do not guess.

Fields needed:
${fieldLines}

Respond with ONLY the JSON object. No explanation, no markdown code blocks.`

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].text.trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return {}

    const parsed = JSON.parse(jsonMatch[0])
    return Object.fromEntries(Object.entries(parsed).filter(([, v]) => v !== null))
  } catch (err) {
    console.error(`  Claude error (${car.marke} ${car.modell}): ${err.message}`)
    return {}
  }
}
```

- [ ] **Step 2: Smoke test**

Replace `your_key_here` with actual key:

```bash
cd ev-database && ANTHROPIC_API_KEY=your_key_here node --input-type=module << 'EOF'
import { enrichFromClaude } from './scripts/enrichment/claude-enrichment.js'
const result = await enrichFromClaude(
  { marke: 'Volkswagen', modell: 'ID.4', baujahr: '2023' },
  ['reichweite_wltp', 'leistung_kw', 'karosserie', 'segment']
)
console.log(JSON.stringify(result, null, 2))
EOF
```

Expected: JSON with realistic values, e.g. `{ "reichweite_wltp": 520, "leistung_kw": 150, "karosserie": "SUV", "segment": "D" }`

- [ ] **Step 3: Commit**

```bash
git add ev-database/scripts/enrichment/claude-enrichment.js
git commit -m "feat: add Claude API fallback for EV data enrichment"
```

---

### Task 6: Main Orchestrator Script

**Files:**
- Create: `ev-database/scripts/enrich-cars.js`

- [ ] **Step 1: Create orchestrator**

Create `ev-database/scripts/enrich-cars.js`:

```js
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { isEmpty, mergeEnrichment } from './enrichment/plausibility.js'
import { enrichFromEvDatabase } from './enrichment/ev-database-scraper.js'
import { enrichFromManufacturer } from './enrichment/manufacturer-scraper.js'
import { enrichFromClaude } from './enrichment/claude-enrichment.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Support FIREBASE_SERVICE_ACCOUNT as JSON string (GitHub Actions) or local file
let serviceAccount
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
} else {
  serviceAccount = JSON.parse(readFileSync(resolve(__dirname, '../serviceAccountKey.json'), 'utf-8'))
}

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

const ENRICHABLE_FIELDS = [
  'preis_de', 'bild_url', 'reichweite_wltp', 'akku_kapazitaet_kwh', 'architektur_volt',
  'laden_ac_kw', 'laden_dc_kw', 'ladezeit_10_80_min', 'beschleunigung_sec',
  'hoechstgeschwindigkeit_kmh', 'leistung_kw', 'laenge_mm', 'breite_mm', 'hoehe_mm',
  'radstand_mm', 'gewicht_leer_kg', 'zul_gesamtgewicht_kg', 'zuladung_kg',
  'anhaengelast_gebremst_kg', 'anhaengelast_ungebremst_kg', 'kofferraum_l',
  'kofferraum_max_l', 'frunk_l', 'dachlast_kg', 'sitze', 'isofix', 'wendekreis_m',
  'plattform', 'karosserie', 'segment', 'waermepumpe',
]

function getMissingFields(car) {
  return ENRICHABLE_FIELDS.filter(f => isEmpty(car[f]))
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function enrichCar(car) {
  const missing = getMissingFields(car)
  if (missing.length === 0) return null

  console.log(`  Missing ${missing.length}: ${missing.join(', ')}`)

  let currentCar = { ...car }
  let allUpdates = {}

  function applyUpdates(updates) {
    if (Object.keys(updates).length === 0) return
    const { _enriched, ...fields } = updates
    Object.assign(allUpdates, fields)
    if (_enriched) allUpdates._enriched = { ...(allUpdates._enriched || {}), ..._enriched }
    Object.assign(currentCar, fields)
  }

  // 1. ev-database.org
  const evdbData = await enrichFromEvDatabase(car)
  applyUpdates(mergeEnrichment(currentCar, evdbData, 'ev-database.org', 'high'))
  const stillMissing1 = getMissingFields(currentCar)
  if (Object.keys(evdbData).length) console.log(`    ev-database.org: ${Object.keys(evdbData).length} fields found`)
  await sleep(500)

  // 2. Manufacturer site
  if (stillMissing1.length > 0) {
    const mfgData = await enrichFromManufacturer(car)
    applyUpdates(mergeEnrichment(currentCar, mfgData, 'manufacturer', 'medium'))
    if (Object.keys(mfgData).length) console.log(`    manufacturer: ${Object.keys(mfgData).length} fields found`)
    await sleep(500)
  }

  // 3. Claude fallback
  const stillMissing2 = getMissingFields(currentCar)
  if (stillMissing2.length > 0) {
    const claudeData = await enrichFromClaude(car, stillMissing2)
    applyUpdates(mergeEnrichment(currentCar, claudeData, 'claude', 'low'))
    if (Object.keys(claudeData).length) console.log(`    claude: ${Object.keys(claudeData).length} fields found`)
  }

  return Object.keys(allUpdates).length > 0 ? allUpdates : null
}

async function main() {
  const snap = await db.collection('ev_cars').get()
  const cars = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  console.log(`Processing ${cars.length} cars...\n`)

  let totalFilled = 0, totalClaude = 0, totalErrors = 0

  for (const car of cars) {
    console.log(`${car.marke} ${car.modell} (${car.baujahr})`)
    try {
      const updates = await enrichCar(car)
      if (updates) {
        await db.collection('ev_cars').doc(car.id).update(updates)
        const enriched = updates._enriched || {}
        const filled = Object.values(enriched).length
        const claude = Object.values(enriched).filter(m => m.source === 'claude').length
        totalFilled += filled
        totalClaude += claude
        console.log(`  ✓ Updated ${filled} fields\n`)
      } else {
        console.log(`  — Complete, nothing to update\n`)
      }
    } catch (err) {
      console.error(`  ✗ ${err.message}\n`)
      totalErrors++
    }
    await sleep(300)
  }

  console.log('--- Summary ---')
  console.log(`✓ ${totalFilled} fields enriched total`)
  console.log(`⚠  ${totalClaude} via Claude (low confidence)`)
  console.log(`✗  ${totalErrors} errors`)
  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
```

- [ ] **Step 2: Test run (reads Firestore, no writes if DB is empty)**

```bash
cd ev-database && ANTHROPIC_API_KEY=your_key node scripts/enrich-cars.js
```

Expected: Script connects to Firestore, iterates cars, prints per-car progress, exits with summary.

- [ ] **Step 3: Commit**

```bash
git add ev-database/scripts/enrich-cars.js
git commit -m "feat: add enrich-cars.js orchestrator (3-tier pipeline)"
```

---

### Task 7: GitHub Action

**Files:**
- Create: `.github/workflows/enrich-cars.yml`

- [ ] **Step 1: Create workflow file**

```bash
mkdir -p .github/workflows
```

Create `.github/workflows/enrich-cars.yml`:

```yaml
name: Enrich EV Car Data

on:
  schedule:
    - cron: '0 3 * * *'   # daily at 03:00 UTC
  workflow_dispatch:        # manual trigger via GitHub UI

jobs:
  enrich:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ev-database

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: ev-database/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Run enrichment
        run: node scripts/enrich-cars.js
        env:
          FIREBASE_SERVICE_ACCOUNT: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

- [ ] **Step 2: Add GitHub Secrets**

In GitHub repo → Settings → Secrets and variables → Actions → New repository secret:

1. Name: `FIREBASE_SERVICE_ACCOUNT`  
   Value: paste the full JSON content of `ev-database/serviceAccountKey.json`

2. Name: `ANTHROPIC_API_KEY`  
   Value: your Anthropic API key

- [ ] **Step 3: Commit and push**

```bash
git add .github/workflows/enrich-cars.yml
git commit -m "feat: add GitHub Action for nightly EV data enrichment"
git push
```

- [ ] **Step 4: Verify Action appears in GitHub**

Go to repo → Actions tab. Confirm "Enrich EV Car Data" workflow is listed. Trigger manually via "Run workflow" to verify end-to-end.

---

### Task 8: EnrichmentBadge Component

**Files:**
- Create: `ev-database/src/components/admin/EnrichmentBadge.jsx`
- Create: `ev-database/src/components/admin/EnrichmentBadge.css`

- [ ] **Step 1: Create badge component**

Create `ev-database/src/components/admin/EnrichmentBadge.jsx`:

```jsx
import './EnrichmentBadge.css'

const SOURCE_LABELS = {
  'ev-database.org': 'EV-DB',
  'manufacturer': 'Hersteller',
  'claude': 'KI',
}

export default function EnrichmentBadge({ meta }) {
  if (!meta) return null

  const isLow = meta.confidence === 'low'
  const label = SOURCE_LABELS[meta.source] ?? meta.source
  const actionLabel = meta.action === 'corrected' ? 'Korrigiert' : 'Ergänzt'
  const tooltip = `${actionLabel} · ${meta.source} · ${meta.at}`

  return (
    <span
      className={`enrichment-badge${isLow ? ' enrichment-badge--low' : ''}`}
      title={tooltip}
    >
      {isLow ? '⚠' : '↺'} {label}
    </span>
  )
}
```

- [ ] **Step 2: Create badge styles**

Create `ev-database/src/components/admin/EnrichmentBadge.css`:

```css
.enrichment-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 0.65rem;
  font-weight: 500;
  padding: 1px 5px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--color-primary, #3b82f6) 12%, transparent);
  color: var(--color-primary, #3b82f6);
  cursor: default;
  vertical-align: middle;
  margin-left: 4px;
  white-space: nowrap;
  user-select: none;
}

.enrichment-badge--low {
  background: color-mix(in srgb, #f59e0b 12%, transparent);
  color: #d97706;
}
```

- [ ] **Step 3: Commit**

```bash
git add ev-database/src/components/admin/EnrichmentBadge.jsx ev-database/src/components/admin/EnrichmentBadge.css
git commit -m "feat: add EnrichmentBadge component (admin-only)"
```

---

### Task 9: Wire EnrichmentBadge into CarDetail

**Files:**
- Modify: `ev-database/src/components/cars/CarDetail.jsx`

- [ ] **Step 1: Update CarDetail**

Replace the full content of `ev-database/src/components/cars/CarDetail.jsx`:

```jsx
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import EnrichmentBadge from '../admin/EnrichmentBadge'
import './CarDetail.css'

const SECTIONS = [
  {
    key: 'basis',
    fields: [
      { key: 'baujahr' },
      { key: 'preis_de', format: 'currency' },
    ],
  },
  {
    key: 'range_battery',
    fields: [
      { key: 'reichweite_wltp',     unit: 'km' },
      { key: 'akku_kapazitaet_kwh', unit: 'kwh' },
      { key: 'architektur_volt',    unit: 'volt' },
    ],
  },
  {
    key: 'charging',
    fields: [
      { key: 'laden_ac_kw',        unit: 'kw' },
      { key: 'laden_dc_kw',        unit: 'kw' },
      { key: 'ladezeit_10_80_min', unit: 'min' },
    ],
  },
  {
    key: 'performance',
    fields: [
      { key: 'beschleunigung_sec',         unit: 'sec' },
      { key: 'hoechstgeschwindigkeit_kmh', unit: 'kmh' },
      { key: 'leistung_kw',               unit: 'kw' },
    ],
  },
  {
    key: 'dimensions',
    fields: [
      { key: 'laenge_mm',   unit: 'mm' },
      { key: 'breite_mm',   unit: 'mm' },
      { key: 'hoehe_mm',    unit: 'mm' },
      { key: 'radstand_mm', unit: 'mm' },
    ],
  },
  {
    key: 'weight',
    fields: [
      { key: 'gewicht_leer_kg',            unit: 'kg' },
      { key: 'zul_gesamtgewicht_kg',       unit: 'kg' },
      { key: 'zuladung_kg',                unit: 'kg' },
      { key: 'anhaengelast_gebremst_kg',   unit: 'kg' },
      { key: 'anhaengelast_ungebremst_kg', unit: 'kg' },
    ],
  },
  {
    key: 'cargo',
    fields: [
      { key: 'kofferraum_l',     unit: 'liter' },
      { key: 'kofferraum_max_l', unit: 'liter' },
      { key: 'frunk_l',          unit: 'liter' },
      { key: 'dachlast_kg',      unit: 'kg' },
    ],
  },
  {
    key: 'misc',
    fields: [
      { key: 'sitze' },
      { key: 'isofix' },
      { key: 'wendekreis_m', unit: 'meter' },
      { key: 'karosserie' },
      { key: 'segment' },
      { key: 'waermepumpe' },
      { key: 'plattform' },
    ],
  },
]

const UNITS = { km: true, kwh: true, volt: true, kw: true, min: true, sec: true, kmh: true, mm: true, kg: true, liter: true, meter: true }

function formatValue(value, unit, format, t) {
  if (value === undefined || value === null || value === '') return null
  if (format === 'currency')
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
  if (unit && UNITS[unit]) return `${value} ${t(`detail.units.${unit}`)}`
  return String(value)
}

export default function CarDetail({ car, onClose }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const isAdmin = !!user

  if (!car) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-title">{car.marke} {car.modell}</div>

        {car.bild_url && (
          <div className="detail-image-wrap">
            <img src={car.bild_url} alt={`${car.marke} ${car.modell}`} className="detail-image" />
          </div>
        )}

        {SECTIONS.map(section => {
          const visibleFields = section.fields
            .map(f => ({
              ...f,
              label: t(`detail.fields.${f.key}`),
              value: formatValue(car[f.key], f.unit, f.format, t),
              enrichedMeta: car._enriched?.[f.key] ?? null,
            }))
            .filter(f => f.value !== null)

          if (visibleFields.length === 0) return null

          return (
            <div key={section.key} className="detail-section">
              <div className="detail-section-title">{t(`detail.sections.${section.key}`)}</div>
              {visibleFields.map(f => (
                <div key={f.key} className="detail-field">
                  <span className="detail-field-label">{f.label}</span>
                  <span className="detail-field-value">
                    {f.value}
                    {isAdmin && <EnrichmentBadge meta={f.enrichedMeta} />}
                  </span>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Start dev server and verify**

```bash
cd ev-database && npm run dev
```

- Open http://localhost:5173
- Click any car → detail modal opens, no visual change for logged-out users
- Log in as admin → enriched fields show `↺ EV-DB` or `⚠ KI` badges with tooltip on hover

- [ ] **Step 3: Commit**

```bash
git add ev-database/src/components/cars/CarDetail.jsx
git commit -m "feat: show enrichment badges in CarDetail for admin users"
```

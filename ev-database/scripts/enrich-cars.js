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

let serviceAccount
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
} else {
  serviceAccount = JSON.parse(readFileSync(resolve(__dirname, '../serviceAccountKey.json'), 'utf-8'))
}

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

const ENRICHABLE_FIELDS = [
  'preis_de', 'reichweite_wltp', 'akku_kapazitaet_kwh', 'architektur_volt',
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
  if (Object.keys(evdbData).length) console.log(`    ev-database.org: ${Object.keys(evdbData).length} fields found`)
  await sleep(500)

  // 2. Manufacturer site
  const stillMissing1 = getMissingFields(currentCar)
  if (stillMissing1.length > 0) {
    const mfgData = await enrichFromManufacturer(car)
    applyUpdates(mergeEnrichment(currentCar, mfgData, 'manufacturer', 'medium'))
    if (Object.keys(mfgData).length) console.log(`    manufacturer: ${Object.keys(mfgData).length} fields found`)
    await sleep(500)
  }

  // 3. Claude fallback
  const stillMissing2 = getMissingFields(currentCar)
  if (stillMissing2.length > 0) {
    const claudeData = await enrichFromClaude(currentCar, stillMissing2)
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

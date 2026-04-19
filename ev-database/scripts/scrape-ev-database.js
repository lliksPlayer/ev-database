import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { writeFileSync } from 'fs'
import FirecrawlApp from '@mendable/firecrawl-js'
import { importCars } from './firebase-import.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env') })

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY })

// Extract value from a markdown table row by exact label
function tableVal(md, label) {
  const esc = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`\\|\\s*${esc}\\s*\\\\?\\*?†?\\s*\\|\\s*([^|\\n]+?)\\s*\\|`, 'im')
  const m = md.match(re)
  return m ? m[1].trim() : null
}

// Parse number + optional unit from string
function extractNum(str) {
  if (!str) return null
  const m = str.match(/([\d.]+)/)
  return m ? parseFloat(m[1]) : null
}

function parseMarkdown(markdown, metadata) {
  const r = {}

  // marke + modell from metadata title
  // Format: "Tesla Model 3 RWD (CATL LFP60) (2021-2023) price and specifications - EV Database"
  const rawTitle = (metadata?.title ?? '').replace(/ price and specifications.*$/i, '').trim()
  if (rawTitle) {
    // Extract year from last (YYYY-YYYY) or (YYYY) parenthetical
    const yearFromTitle = rawTitle.match(/\((\d{4}(?:[-–]\d{4})?)\)\s*$/)
    if (yearFromTitle) r.baujahr = yearFromTitle[1]
    // Remove all parentheticals for clean brand+model
    const cleanTitle = rawTitle.replace(/\s*\([^)]*\)\s*/g, '').trim()
    const parts = cleanTitle.split(' ')
    r.marke = parts[0]
    r.modell = parts.slice(1).join(' ')
  }
  if (!r.marke) return null

  // bild_url — first non-thumbnail image from ev-database.org
  const imgMatch = markdown.match(/!\[.*?\]\((https:\/\/ev-database\.org\/img\/auto\/[^)]+?(?<!-thumb)\.(?:jpg|png|webp))\)/)
  if (imgMatch) r.bild_url = imgMatch[1]

  // preis_de — Germany price (row has markdown link: | [Germany](...) | €44,668 |)
  const priceMatch = markdown.match(/\|\s*\[Germany\][^\|]*\|\s*€([\d,.]+)/)
  if (priceMatch) r.preis_de = parseInt(priceMatch[1].replace(/[,.]/g, ''))

  // reichweite_wltp — from WLTP section specifically
  const wltpSection = markdown.match(/### WLTP Ratings[\s\S]*?(?=\n##|\n$)/i) ||
                      markdown.match(/## WLTP[\s\S]*?(?=\n##|\n$)/i)
  if (wltpSection) {
    const rm = wltpSection[0].match(/\|\s*Range\s*\\?\*?\s*\|\s*(\d+)\s*km/)
    if (rm) r.reichweite_wltp = parseInt(rm[1])
  }

  // akku_kapazitaet_kwh
  const batCap = tableVal(markdown, 'Useable Capacity')
  if (batCap) { const m = batCap.match(/([\d.]+)\s*kWh/); if (m) r.akku_kapazitaet_kwh = parseFloat(m[1]) }

  // architektur_volt
  const arch = tableVal(markdown, 'Architecture')
  if (arch) { const m = arch.match(/(\d+)\s*V/); if (m) r.architektur_volt = parseInt(m[1]) }

  // laden_ac_kw — "Charge Power" (first occurrence = AC section)
  const acPower = tableVal(markdown, 'Charge Power')
  if (acPower) { const m = acPower.match(/([\d.]+)\s*kW/); if (m) r.laden_ac_kw = parseFloat(m[1]) }

  // laden_dc_kw — "Charge Power (max)"
  const dcPower = tableVal(markdown, 'Charge Power \\(max\\)')
  if (dcPower) { const m = dcPower.match(/([\d.]+)\s*kW/); if (m) r.laden_dc_kw = parseFloat(m[1]) }

  // ladezeit_10_80_min — "Charge Time (X->Y km)" where X=10%, Y=80% of range
  const ctMatch = markdown.match(/\|\s*Charge Time \(\d+->\d+ km\)\s*\\?\*?\s*\|\s*(\d+)\s*min/)
  if (ctMatch) r.ladezeit_10_80_min = parseInt(ctMatch[1])

  // Performance
  const accel = tableVal(markdown, 'Acceleration 0 - 100 km/h')
  if (accel) { const m = accel.match(/([\d.]+)\s*sec/); if (m) r.beschleunigung_sec = parseFloat(m[1]) }

  const topSpeed = tableVal(markdown, 'Top Speed')
  if (topSpeed) { const m = topSpeed.match(/(\d+)\s*km\/h/); if (m) r.hoechstgeschwindigkeit_kmh = parseInt(m[1]) }

  const power = tableVal(markdown, 'Total Power')
  if (power) { const m = power.match(/([\d.]+)\s*kW/); if (m) r.leistung_kw = parseFloat(m[1]) }

  // Dimensions
  const len = tableVal(markdown, 'Length')
  if (len) { const m = len.match(/(\d+)\s*mm/); if (m) r.laenge_mm = parseInt(m[1]) }

  // Width — exact match only (not "Width with mirrors")
  const widthMatch = markdown.match(/\|\s*Width\s*\|\s*(\d+)\s*mm/)
  if (widthMatch) r.breite_mm = parseInt(widthMatch[1])

  const height = tableVal(markdown, 'Height')
  if (height) { const m = height.match(/(\d+)\s*mm/); if (m) r.hoehe_mm = parseInt(m[1]) }

  const wb = tableVal(markdown, 'Wheelbase')
  if (wb) { const m = wb.match(/(\d+)\s*mm/); if (m) r.radstand_mm = parseInt(m[1]) }

  // Weight
  const unladen = tableVal(markdown, 'Weight Unladen \\(EU\\)')
  if (unladen) { const m = unladen.match(/(\d[\d,]*)\s*kg/); if (m) r.gewicht_leer_kg = parseInt(m[1].replace(',', '')) }

  const gvwr = tableVal(markdown, 'Gross Vehicle Weight \\(GVWR\\)')
  if (gvwr) { const m = gvwr.match(/(\d+)\s*kg/); if (m) r.zul_gesamtgewicht_kg = parseInt(m[1]) }

  const payload = tableVal(markdown, 'Max\\. Payload')
  if (payload) { const m = payload.match(/(\d+)\s*kg/); if (m) r.zuladung_kg = parseInt(m[1]) }

  const towBraked = tableVal(markdown, 'Towing Weight Braked')
  if (towBraked) { const m = towBraked.match(/(\d+)\s*kg/); if (m) r.anhaengelast_gebremst_kg = parseInt(m[1]) }

  const towUnbraked = tableVal(markdown, 'Towing Weight Unbraked')
  if (towUnbraked) { const m = towUnbraked.match(/(\d+)\s*kg/); if (m) r.anhaengelast_ungebremst_kg = parseInt(m[1]) }

  // Cargo — exact "Cargo Volume" (not Max, not Frunk)
  const cargoMatch = markdown.match(/\|\s*Cargo Volume\s*\|\s*(\d+)\s*L/)
  if (cargoMatch) r.kofferraum_l = parseInt(cargoMatch[1])

  const cargoMax = tableVal(markdown, 'Cargo Volume Max')
  if (cargoMax) { const m = cargoMax.match(/(\d+)\s*L/); if (m) r.kofferraum_max_l = parseInt(m[1]) }

  const frunk = tableVal(markdown, 'Cargo Volume Frunk')
  if (frunk) { const m = frunk.match(/(\d+)\s*L/); if (m && parseInt(m[1]) > 0) r.frunk_l = parseInt(m[1]) }

  const roofLoad = tableVal(markdown, 'Roof Load')
  if (roofLoad) { const m = roofLoad.match(/(\d+)\s*kg/); if (m) r.dachlast_kg = parseInt(m[1]) }

  // Miscellaneous
  const seats = tableVal(markdown, 'Seats')
  if (seats) { const m = seats.match(/(\d+)/); if (m) r.sitze = parseInt(m[1]) }

  const isofix = tableVal(markdown, 'Isofix')
  if (isofix && isofix !== '-') r.isofix = isofix

  const turning = tableVal(markdown, 'Turning Circle')
  if (turning) { const m = turning.match(/([\d.]+)\s*m/); if (m) r.wendekreis_m = parseFloat(m[1]) }

  const platform = tableVal(markdown, 'Platform')
  if (platform && platform !== '-') r.plattform = platform

  const body = tableVal(markdown, 'Car Body')
  if (body && body !== '-') r.karosserie = body

  const segment = tableVal(markdown, 'Segment')
  if (segment && segment !== '-') r.segment = segment

  const hp = tableVal(markdown, 'Heat pump \\(HP\\)')
  if (hp) r.waermepumpe = hp.toLowerCase().startsWith('yes') ? 'Yes' : 'No'

  return r
}

async function getCarUrls() {
  console.log('Mapping ev-database.org for car URLs...')
  const result = await firecrawl.map('https://ev-database.org/', {
    includeSubdomains: false,
  })
  const urls = (result.links ?? [])
    .map(l => (typeof l === 'string' ? l : l?.url))
    .filter(url => url && /ev-database\.org\/car\/\d+/.test(url))
  return [...new Set(urls)]
}

// ev-database.org is Cloudflare-protected — Firecrawl handles this via proxy/stealth.
// markdown format uses ~1 credit vs ~5 for LLM extraction.
async function scrapeOne(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await firecrawl.scrape(url, {
        formats: ['markdown'],
        timeout: 30000,
      })
      if (result?.markdown) {
        const data = parseMarkdown(result.markdown, result.metadata)
        if (data?.marke) return data
      }
      if (attempt < retries) await sleep(2000 * attempt)
    } catch (err) {
      if (attempt === retries) throw err
      await sleep(2000 * attempt)
    }
  }
  return null
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function main() {
  const urls = await getCarUrls()
  console.log(`Found ${urls.length} car URLs\n`)

  // SCRAPER_START=N skips the first N URLs (already imported in a previous run)
  const startIndex = parseInt(process.env.SCRAPER_START ?? '0')
  if (startIndex > 0) console.log(`Skipping first ${startIndex} URLs (already imported)\n`)

  const cars = []
  for (let i = startIndex; i < urls.length; i++) {
    const url = urls[i]
    try {
      const data = await scrapeOne(url)
      if (data?.marke) {
        cars.push(data)
        console.log(`[${i + 1}/${urls.length}] ✓ ${data.marke} ${data.modell}`)
      } else {
        console.log(`[${i + 1}/${urls.length}] ⚠ No data: ${url}`)
      }
    } catch (err) {
      console.log(`[${i + 1}/${urls.length}] ✗ ${url}: ${err.message}`)
    }
    if (i < urls.length - 1) await sleep(800)
  }

  // Save to JSON first — so data is never lost if import fails
  const jsonPath = resolve(__dirname, '../ev_cars_scraped.json')
  writeFileSync(jsonPath, JSON.stringify(cars, null, 2))
  console.log(`\nSaved ${cars.length} cars to ev_cars_scraped.json`)

  console.log(`Importing ${cars.length} cars to Firestore...`)
  await importCars(cars)
  console.log('Done!')
  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { normalizeVehicle } from '../src/entities/vehicle/vehicleSchema.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

// --- reuse parseMarkdown from scraper ---
function tableVal(md, label) {
  const esc = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`\\|\\s*${esc}\\s*\\\\?\\*?†?\\s*\\|\\s*([^|\\n]+?)\\s*\\|`, 'im')
  const m = md.match(re)
  return m ? m[1].trim() : null
}

function parseMarkdown(markdown, metadata) {
  const r = {}
  const rawTitle = (metadata?.title ?? '').replace(/ price and specifications.*$/i, '').trim()
  if (rawTitle) {
    const yearFromTitle = rawTitle.match(/\((\d{4}(?:[-–]\d{4})?)\)\s*$/)
    if (yearFromTitle) r.baujahr = yearFromTitle[1]
    const cleanTitle = rawTitle.replace(/\s*\([^)]*\)\s*/g, '').trim()
    const parts = cleanTitle.split(' ')
    r.marke = parts[0]
    r.modell = parts.slice(1).join(' ')
  }
  if (!r.marke) return null

  const imgMatch = markdown.match(/!\[.*?\]\((https:\/\/ev-database\.org\/img\/auto\/[^)]+?(?<!-thumb)\.(?:jpg|png|webp))\)/)
  if (imgMatch) r.bild_url = imgMatch[1]

  const priceMatch = markdown.match(/\|\s*\[Germany\][^|]*\|\s*€([\d,.]+)/)
  if (priceMatch) r.preis_de = parseInt(priceMatch[1].replace(/[,.]/g, ''))

  const wltpSection = markdown.match(/### WLTP Ratings[\s\S]*?(?=\n##|\n$)/i) ||
                      markdown.match(/## WLTP[\s\S]*?(?=\n##|\n$)/i)
  if (wltpSection) {
    const rm = wltpSection[0].match(/\|\s*Range\s*\\?\*?\s*\|\s*(\d+)\s*km/)
    if (rm) r.reichweite_wltp = parseInt(rm[1])
  }

  const batCap = tableVal(markdown, 'Useable Capacity')
  if (batCap) { const m = batCap.match(/([\d.]+)\s*kWh/); if (m) r.akku_kapazitaet_kwh = parseFloat(m[1]) }

  const arch = tableVal(markdown, 'Architecture')
  if (arch) { const m = arch.match(/(\d+)\s*V/); if (m) r.architektur_volt = parseInt(m[1]) }

  const acPower = tableVal(markdown, 'Charge Power')
  if (acPower) { const m = acPower.match(/([\d.]+)\s*kW/); if (m) r.laden_ac_kw = parseFloat(m[1]) }

  const dcPower = tableVal(markdown, 'Charge Power \\(max\\)')
  if (dcPower) { const m = dcPower.match(/([\d.]+)\s*kW/); if (m) r.laden_dc_kw = parseFloat(m[1]) }

  const ctMatch = markdown.match(/\|\s*Charge Time \(\d+->\d+ km\)\s*\\?\*?\s*\|\s*(\d+)\s*min/)
  if (ctMatch) r.ladezeit_10_80_min = parseInt(ctMatch[1])

  const accel = tableVal(markdown, 'Acceleration 0 - 100 km/h')
  if (accel) { const m = accel.match(/([\d.]+)\s*sec/); if (m) r.beschleunigung_sec = parseFloat(m[1]) }

  const topSpeed = tableVal(markdown, 'Top Speed')
  if (topSpeed) { const m = topSpeed.match(/(\d+)\s*km\/h/); if (m) r.hoechstgeschwindigkeit_kmh = parseInt(m[1]) }

  const power = tableVal(markdown, 'Total Power')
  if (power) { const m = power.match(/([\d.]+)\s*kW/); if (m) r.leistung_kw = parseFloat(m[1]) }

  const len = tableVal(markdown, 'Length')
  if (len) { const m = len.match(/(\d+)\s*mm/); if (m) r.laenge_mm = parseInt(m[1]) }

  const widthMatch = markdown.match(/\|\s*Width\s*\|\s*(\d+)\s*mm/)
  if (widthMatch) r.breite_mm = parseInt(widthMatch[1])

  const height = tableVal(markdown, 'Height')
  if (height) { const m = height.match(/(\d+)\s*mm/); if (m) r.hoehe_mm = parseInt(m[1]) }

  const wb = tableVal(markdown, 'Wheelbase')
  if (wb) { const m = wb.match(/(\d+)\s*mm/); if (m) r.radstand_mm = parseInt(m[1]) }

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

  const cargoMatch = markdown.match(/\|\s*Cargo Volume\s*\|\s*(\d+)\s*L/)
  if (cargoMatch) r.kofferraum_l = parseInt(cargoMatch[1])

  const cargoMax = tableVal(markdown, 'Cargo Volume Max')
  if (cargoMax) { const m = cargoMax.match(/(\d+)\s*L/); if (m) r.kofferraum_max_l = parseInt(m[1]) }

  const frunk = tableVal(markdown, 'Cargo Volume Frunk')
  if (frunk) { const m = frunk.match(/(\d+)\s*L/); if (m && parseInt(m[1]) > 0) r.frunk_l = parseInt(m[1]) }

  const roofLoad = tableVal(markdown, 'Roof Load')
  if (roofLoad) { const m = roofLoad.match(/(\d+)\s*kg/); if (m) r.dachlast_kg = parseInt(m[1]) }

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

  return normalizeVehicle(r, 'ev')
}

// --- parse HAR ---
console.log('Reading HAR file...')
const har = JSON.parse(readFileSync('/Users/tomkrohn/Downloads/www.firecrawl.dev.har', 'utf-8'))
const entries = har.log.entries

console.log(`Total requests in HAR: ${entries.length}`)

const cars = []
const seen = new Set()

for (const entry of entries) {
  const status = entry.response?.status
  if (status !== 200) continue

  // look for Firecrawl scrape API responses
  const body = entry.response?.content?.text ?? ''
  if (!body || body.length < 100) continue

  let parsed
  try { parsed = JSON.parse(body) } catch { continue }

  // response has markdown field
  const markdown = parsed?.data?.markdown ?? parsed?.markdown
  const metadata = parsed?.data?.metadata ?? parsed?.metadata
  if (!markdown || markdown.length < 200) continue

  // only ev-database.org scrapes
  const sourceUrl = metadata?.sourceURL ?? metadata?.url ?? ''
  if (!sourceUrl.includes('ev-database.org/car/')) continue

  if (seen.has(sourceUrl)) continue
  seen.add(sourceUrl)

  const car = parseMarkdown(markdown, metadata)
  if (car?.marke) {
    cars.push(car)
    if (cars.length % 50 === 0) console.log(`  Parsed ${cars.length} cars...`)
  }
}

console.log(`\nExtracted ${cars.length} cars from HAR`)

const outPath = resolve(__dirname, '../ev_cars_scraped.json')
writeFileSync(outPath, JSON.stringify(cars, null, 2))
console.log(`Saved to ev_cars_scraped.json`)
process.exit(0)

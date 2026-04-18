import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import FirecrawlApp from '@mendable/firecrawl-js'
import { importCars } from './firebase-import.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env') })

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY })

const EXTRACT_SCHEMA = {
  type: 'object',
  properties: {
    marke:                      { type: 'string',  description: 'Car brand/manufacturer e.g. Tesla, BMW' },
    modell:                     { type: 'string',  description: 'Car model name e.g. Model 3 RWD' },
    baujahr:                    { type: 'string',  description: 'Production years e.g. 2021-2023' },
    preis_de:                   { type: 'number',  description: 'Recommended retail price in Germany in EUR, numeric only' },
    bild_url:                   { type: 'string',  description: 'URL of the main vehicle photo (largest non-thumbnail image)' },
    reichweite_wltp:            { type: 'number',  description: 'Official WLTP range in km' },
    akku_kapazitaet_kwh:        { type: 'number',  description: 'Useable battery capacity in kWh' },
    architektur_volt:           { type: 'number',  description: 'Battery architecture voltage, typically 400 or 800' },
    laden_ac_kw:                { type: 'number',  description: 'Maximum AC home/destination charging power in kW' },
    laden_dc_kw:                { type: 'number',  description: 'Maximum DC fast charging power in kW' },
    ladezeit_10_80_min:         { type: 'number',  description: 'DC fast charge time from 10 to 80 percent in minutes' },
    beschleunigung_sec:         { type: 'number',  description: '0-100 km/h acceleration time in seconds' },
    hoechstgeschwindigkeit_kmh: { type: 'number',  description: 'Top speed in km/h' },
    leistung_kw:                { type: 'number',  description: 'Total motor power in kW' },
    laenge_mm:                  { type: 'number',  description: 'Vehicle length in mm' },
    breite_mm:                  { type: 'number',  description: 'Vehicle width without mirrors in mm' },
    hoehe_mm:                   { type: 'number',  description: 'Vehicle height in mm' },
    radstand_mm:                { type: 'number',  description: 'Wheelbase in mm' },
    gewicht_leer_kg:            { type: 'number',  description: 'Unladen weight EU in kg' },
    zul_gesamtgewicht_kg:       { type: 'number',  description: 'Gross vehicle weight GVWR in kg' },
    zuladung_kg:                { type: 'number',  description: 'Maximum payload in kg' },
    anhaengelast_gebremst_kg:   { type: 'number',  description: 'Towing weight braked in kg' },
    anhaengelast_ungebremst_kg: { type: 'number',  description: 'Towing weight unbraked in kg' },
    kofferraum_l:               { type: 'number',  description: 'Cargo volume in liters' },
    kofferraum_max_l:           { type: 'number',  description: 'Maximum cargo volume with rear seats folded in liters' },
    frunk_l:                    { type: 'number',  description: 'Front trunk frunk volume in liters, 0 if none' },
    dachlast_kg:                { type: 'number',  description: 'Maximum roof load in kg' },
    sitze:                      { type: 'number',  description: 'Number of seats' },
    isofix:                     { type: 'string',  description: 'Isofix info e.g. "Yes, 2 seats" or "No"' },
    wendekreis_m:               { type: 'number',  description: 'Turning circle in meters' },
    karosserie:                 { type: 'string',  description: 'Car body type e.g. SUV, Sedan, Hatchback, Estate' },
    segment:                    { type: 'string',  description: 'Car segment e.g. B - Small, C - Medium, D - Large' },
    waermepumpe:                { type: 'string',  description: 'Heat pump: Yes or No' },
    plattform:                  { type: 'string',  description: 'Vehicle platform name e.g. MEB, Tesla 3/Y' },
  },
  required: ['marke', 'modell'],
}

async function getCarUrls() {
  console.log('Mapping ev-database.org for car URLs...')
  const result = await firecrawl.map('https://ev-database.org/', {
    includeSubdomains: false,
  })
  const links = result.links ?? []
  const urls = links
    .map(link => (typeof link === 'string' ? link : link?.url))
    .filter(url => url && /ev-database\.org\/car\/\d+\//.test(url))
  return [...new Set(urls)]
}

// ev-database.org is protected by Cloudflare.
// Firecrawl handles this via their proxy infrastructure + stealth headers.
// Additional: retry logic and increased delay protect against rate limits.
async function scrapeOne(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await firecrawl.scrape(url, {
        formats: [{ type: 'json', schema: EXTRACT_SCHEMA }],
        timeout: 30000,
      })
      if (result?.json?.marke) return result.json
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

  const cars = []
  for (let i = 0; i < Math.min(1, urls.length); i++) {
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
    // 800ms between requests — respect Cloudflare protection
    if (i < urls.length - 1) await sleep(800)
  }

  console.log(`\nImporting ${cars.length} cars to Firestore...`)
  await importCars(cars)
  console.log('Done!')
  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })

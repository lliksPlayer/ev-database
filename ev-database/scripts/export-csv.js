import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createWriteStream } from 'fs'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs } from 'firebase/firestore'
import { normalizeVehicle } from '../src/entities/vehicle/vehicleSchema.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env') })

const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
})

const db = getFirestore(app)

const FIELDS = [
  'marke', 'modell', 'markteinfuehrung', 'basis_preis', 'bild_url',
  'wltp_reichweite', 'batterie_netto', 'volt',
  'laden_ac_kw', 'laden_dc_kw', 'laden_10_80_min', 'max_ladeleistung',
  'null_hundert', 'top_speed', 'leistung_kw', 'ps',
  'laenge_mm', 'breite_mm', 'hoehe_mm', 'radstand_mm',
  'gewicht_leer_kg', 'zul_gesamtgewicht_kg', 'zuladung_kg',
  'anhaengelast', 'anhaengelast_gebremst_kg', 'anhaengelast_ungebremst_kg',
  'kofferraum_l', 'kofferraum_max_l', 'frunk_l', 'dachlast_kg',
  'sitze', 'isofix', 'wendekreis_m', 'plattform', 'karosserie',
  'segment', 'waermepumpe',
]

function escapeCSV(val) {
  if (val == null) return ''
  const s = String(val)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

async function main() {
  console.log('Fetching cars from Firestore...')
  const snap = await getDocs(collection(db, 'ev_cars'))
  const cars = snap.docs.map((d) => normalizeVehicle(d.data(), 'ev'))
  console.log(`Found ${cars.length} cars`)

  const outPath = resolve(__dirname, '../ev_cars_export.csv')
  const stream = createWriteStream(outPath)

  // Header
  stream.write(FIELDS.join(',') + '\n')

  // Rows
  for (const car of cars) {
    stream.write(FIELDS.map(f => escapeCSV(car[f])).join(',') + '\n')
  }

  stream.end()
  await new Promise(r => stream.on('finish', r))
  console.log(`CSV saved to: ${outPath}`)
  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })

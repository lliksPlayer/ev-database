import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env') })

const require = createRequire(import.meta.url)
const admin = require('firebase-admin')

// Requires serviceAccountKey.json in the ev-database/ directory.
// Download from: Firebase Console → Project Settings → Service Accounts → Generate new private key
const serviceAccountPath = resolve(__dirname, '../serviceAccountKey.json')

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
  })
}

const db = admin.firestore()

export async function importCars(cars) {
  const ref = db.collection('ev_cars')
  const CHUNK = 499
  for (let i = 0; i < cars.length; i += CHUNK) {
    const batch = db.batch()
    cars.slice(i, i + CHUNK).forEach(car => batch.set(ref.doc(), car))
    await batch.commit()
    console.log(`  Chunk ${Math.floor(i / CHUNK) + 1} committed (${Math.min(i + CHUNK, cars.length)}/${cars.length})`)
  }
}

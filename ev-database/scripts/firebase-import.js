import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, doc, writeBatch } from 'firebase/firestore'

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

export const db = getFirestore(app)

export async function importCars(cars) {
  const ref = collection(db, 'ev_cars')
  // Firestore batch ist auf 500 Operationen limitiert — bei mehr als 500 Autos in Chunks splitten
  const CHUNK = 499
  for (let i = 0; i < cars.length; i += CHUNK) {
    const batch = writeBatch(db)
    cars.slice(i, i + CHUNK).forEach(car => batch.set(doc(ref), car))
    await batch.commit()
    console.log(`  Chunk ${Math.floor(i / CHUNK) + 1} committed (${Math.min(i + CHUNK, cars.length)}/${cars.length})`)
  }
}

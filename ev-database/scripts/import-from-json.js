import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { readFileSync } from 'fs'
import { importCars } from './firebase-import.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const jsonPath = resolve(__dirname, '../ev_cars_scraped.json')
const cars = JSON.parse(readFileSync(jsonPath, 'utf-8'))
console.log(`Loaded ${cars.length} cars from ev_cars_scraped.json`)
console.log('Importing to Firestore...')
await importCars(cars)
console.log('Done!')
process.exit(0)

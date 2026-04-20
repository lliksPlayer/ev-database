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

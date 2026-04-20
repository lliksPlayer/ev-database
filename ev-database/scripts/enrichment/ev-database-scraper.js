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

  // WLTP range
  const fullText = $.html()
  const wltpSection = fullText.match(/WLTP[\s\S]{0,500}?(\d{3,4})\s*km/i)
  if (wltpSection) data.reichweite_wltp = parseInt(wltpSection[1])

  // Germany price
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

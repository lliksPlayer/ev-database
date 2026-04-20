import Anthropic from '@anthropic-ai/sdk'

const FIELD_DESCRIPTIONS = {
  reichweite_wltp:             'WLTP range in km (integer)',
  akku_kapazitaet_kwh:         'usable battery capacity in kWh (number)',
  architektur_volt:            'battery voltage architecture, typically 400 or 800 (integer)',
  laden_ac_kw:                 'max AC onboard charging power in kW (number)',
  laden_dc_kw:                 'max DC fast charging power in kW (number)',
  ladezeit_10_80_min:          'DC charge time from 10% to 80% in minutes (integer)',
  beschleunigung_sec:          '0-100 km/h acceleration time in seconds (number)',
  hoechstgeschwindigkeit_kmh:  'top speed in km/h (integer)',
  leistung_kw:                 'total motor power in kW (integer)',
  laenge_mm:                   'vehicle length in mm (integer)',
  breite_mm:                   'vehicle width excluding mirrors in mm (integer)',
  hoehe_mm:                    'vehicle height in mm (integer)',
  radstand_mm:                 'wheelbase in mm (integer)',
  gewicht_leer_kg:             'curb weight in kg (integer)',
  zul_gesamtgewicht_kg:        'gross vehicle weight rating in kg (integer)',
  zuladung_kg:                 'payload capacity in kg (integer)',
  anhaengelast_gebremst_kg:    'braked trailer towing capacity in kg (integer)',
  anhaengelast_ungebremst_kg:  'unbraked trailer towing capacity in kg (integer)',
  kofferraum_l:                'boot / cargo volume in liters (integer)',
  kofferraum_max_l:            'max cargo volume with rear seats folded in liters (integer)',
  frunk_l:                     'front trunk volume in liters (integer)',
  dachlast_kg:                 'roof load capacity in kg (integer)',
  sitze:                       'number of seats (integer)',
  isofix:                      'ISOFIX child seat anchors, e.g. "Yes" or "No"',
  wendekreis_m:                'turning circle diameter in meters (number)',
  plattform:                   'platform name, e.g. "MEB", "e-GMP", "ORA"',
  karosserie:                  'body style, e.g. "SUV", "Sedan", "Hatchback", "Estate"',
  segment:                     'EU segment letter, e.g. "A", "B", "C", "D", "F", "J"',
  waermepumpe:                 'heat pump standard equipment: "Yes" or "No"',
  preis_de:                    'base price in Germany in EUR (integer, no decimals)',
}

export async function enrichFromClaude(car, missingFields) {
  const relevantFields = missingFields.filter(f => FIELD_DESCRIPTIONS[f])
  if (relevantFields.length === 0) return {}

  if (!process.env.ANTHROPIC_API_KEY) return {}
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const fieldLines = relevantFields
    .map(f => `"${f}": ${FIELD_DESCRIPTIONS[f]}`)
    .join('\n')

  const prompt = `You are an automotive data expert with detailed knowledge of electric vehicles up to 2025.

For the ${car.baujahr} ${car.marke} ${car.modell}, provide the following technical specifications.
Return ONLY a valid JSON object with these exact field names.
Use null for any field you are not confident about — do not guess.

Fields needed:
${fieldLines}

Respond with ONLY the JSON object. No explanation, no markdown code blocks.`

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].text.trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return {}

    const parsed = JSON.parse(jsonMatch[0])
    return Object.fromEntries(Object.entries(parsed).filter(([, v]) => v !== null))
  } catch (err) {
    console.error(`  Claude error (${car.marke} ${car.modell}): ${err.message}`)
    return {}
  }
}

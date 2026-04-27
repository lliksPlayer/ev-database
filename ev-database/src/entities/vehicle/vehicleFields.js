const BOTH_TYPES = Object.freeze(['ev', 'ice'])

export const CANONICAL_VEHICLE_SCHEMA_VERSION = '2026-04-24'

export const VEHICLE_FIELD_SCHEMA = [
  {
    key: 'marke',
    labels: { de: 'Marke', en: 'Brand' },
    type: 'text',
    unit: null,
    category: 'identity',
    appliesTo: BOTH_TYPES,
    required: true,
    card: { ev: { visible: true, order: 0 }, ice: { visible: true, order: 0 } },
    aliases: [],
  },
  {
    key: 'modell',
    labels: { de: 'Modell', en: 'Model' },
    type: 'text',
    unit: null,
    category: 'identity',
    appliesTo: BOTH_TYPES,
    required: true,
    card: { ev: { visible: true, order: 1 }, ice: { visible: true, order: 1 } },
    aliases: [],
  },
  {
    key: 'markteinfuehrung',
    labels: { de: 'Markteinführung', en: 'Market Launch' },
    type: 'text',
    unit: null,
    category: 'identity',
    appliesTo: BOTH_TYPES,
    required: false,
    card: { ev: { visible: false, order: 16 }, ice: { visible: false, order: 10 } },
    aliases: ['baujahr'],
  },
  {
    key: 'basis_preis',
    labels: { de: 'Basispreis', en: 'Base Price' },
    type: 'number',
    unit: '€',
    category: 'pricing',
    appliesTo: BOTH_TYPES,
    required: true,
    card: { ev: { visible: true, order: 10 }, ice: { visible: true, order: 4 } },
    aliases: ['preis_de', 'kaufpreis'],
  },
  {
    key: 'hoechster_preis',
    labels: { de: 'Höchster Preis', en: 'Max Price' },
    type: 'number',
    unit: '€',
    category: 'pricing',
    appliesTo: BOTH_TYPES,
    required: false,
    card: { ev: { visible: false, order: 11 }, ice: { visible: false, order: 11 } },
    aliases: [],
  },
  {
    key: 'bild_url',
    labels: { de: 'Bild URL', en: 'Image URL' },
    type: 'text',
    unit: null,
    category: 'media',
    appliesTo: BOTH_TYPES,
    required: false,
    aliases: [],
  },
  {
    key: 'null_hundert',
    labels: { de: '0–100', en: '0–100' },
    type: 'number',
    unit: 's',
    category: 'performance',
    appliesTo: BOTH_TYPES,
    required: false,
    card: { ev: { visible: true, order: 12 }, ice: { visible: true, order: 5 } },
    aliases: ['beschleunigung_sec'],
  },
  {
    key: 'ps',
    labels: { de: 'PS', en: 'HP' },
    type: 'number',
    unit: null,
    category: 'performance',
    appliesTo: BOTH_TYPES,
    required: false,
    card: { ev: { visible: false, order: 13 }, ice: { visible: false, order: 6 } },
    aliases: [],
  },
  {
    key: 'leistung_kw',
    labels: { de: 'Leistung', en: 'Power' },
    type: 'number',
    unit: 'kW',
    category: 'performance',
    appliesTo: ['ev'],
    required: false,
    aliases: [],
  },
  {
    key: 'top_speed',
    labels: { de: 'Top Speed', en: 'Top Speed' },
    type: 'number',
    unit: 'km/h',
    category: 'performance',
    appliesTo: BOTH_TYPES,
    required: false,
    card: { ev: { visible: false, order: 14 }, ice: { visible: false, order: 7 } },
    aliases: ['hoechstgeschwindigkeit_kmh'],
  },
  {
    key: 'anhaengelast',
    labels: { de: 'Anhängelast', en: 'Towing Capacity' },
    type: 'number',
    unit: 'kg',
    category: 'utility',
    appliesTo: BOTH_TYPES,
    required: false,
    card: { ev: { visible: false, order: 7 }, ice: { visible: false, order: 9 } },
    aliases: ['anhaengelast_gebremst_kg'],
  },
  {
    key: 'anhaengelast_ungebremst_kg',
    labels: { de: 'Anhängelast ungebremst', en: 'Towing Unbraked' },
    type: 'number',
    unit: 'kg',
    category: 'utility',
    appliesTo: ['ev'],
    required: false,
    aliases: [],
  },
  {
    key: 'sitze',
    labels: { de: 'Sitze', en: 'Seats' },
    type: 'number',
    unit: null,
    category: 'practicality',
    appliesTo: ['ev'],
    required: false,
    aliases: [],
  },
  {
    key: 'isofix',
    labels: { de: 'Isofix', en: 'Isofix' },
    type: 'text',
    unit: null,
    category: 'practicality',
    appliesTo: ['ev'],
    required: false,
    aliases: [],
  },
  {
    key: 'kofferraum_l',
    labels: { de: 'Kofferraum', en: 'Cargo Volume' },
    type: 'number',
    unit: 'L',
    category: 'practicality',
    appliesTo: ['ev'],
    required: false,
    aliases: [],
  },
  {
    key: 'kofferraum_max_l',
    labels: { de: 'Kofferraum max.', en: 'Cargo Volume Max' },
    type: 'number',
    unit: 'L',
    category: 'practicality',
    appliesTo: ['ev'],
    required: false,
    aliases: [],
  },
  {
    key: 'frunk_l',
    labels: { de: 'Frunk', en: 'Frunk' },
    type: 'number',
    unit: 'L',
    category: 'practicality',
    appliesTo: ['ev'],
    required: false,
    aliases: [],
  },
  {
    key: 'dachlast_kg',
    labels: { de: 'Dachlast', en: 'Roof Load' },
    type: 'number',
    unit: 'kg',
    category: 'practicality',
    appliesTo: ['ev'],
    required: false,
    aliases: [],
  },
  {
    key: 'wendekreis_m',
    labels: { de: 'Wendekreis', en: 'Turning Circle' },
    type: 'number',
    unit: 'm',
    category: 'dimensions',
    appliesTo: ['ev'],
    required: false,
    aliases: [],
  },
  {
    key: 'laenge_mm',
    labels: { de: 'Länge', en: 'Length' },
    type: 'number',
    unit: 'mm',
    category: 'dimensions',
    appliesTo: ['ev'],
    required: false,
    aliases: [],
  },
  {
    key: 'breite_mm',
    labels: { de: 'Breite', en: 'Width' },
    type: 'number',
    unit: 'mm',
    category: 'dimensions',
    appliesTo: ['ev'],
    required: false,
    aliases: [],
  },
  {
    key: 'hoehe_mm',
    labels: { de: 'Höhe', en: 'Height' },
    type: 'number',
    unit: 'mm',
    category: 'dimensions',
    appliesTo: ['ev'],
    required: false,
    aliases: [],
  },
  {
    key: 'radstand_mm',
    labels: { de: 'Radstand', en: 'Wheelbase' },
    type: 'number',
    unit: 'mm',
    category: 'dimensions',
    appliesTo: ['ev'],
    required: false,
    aliases: [],
  },
  {
    key: 'gewicht_leer_kg',
    labels: { de: 'Leergewicht', en: 'Unladen Weight' },
    type: 'number',
    unit: 'kg',
    category: 'dimensions',
    appliesTo: ['ev'],
    required: false,
    aliases: [],
  },
  {
    key: 'zul_gesamtgewicht_kg',
    labels: { de: 'Zul. Gesamtgewicht', en: 'Gross Weight' },
    type: 'number',
    unit: 'kg',
    category: 'dimensions',
    appliesTo: ['ev'],
    required: false,
    aliases: [],
  },
  {
    key: 'zuladung_kg',
    labels: { de: 'Zuladung', en: 'Max Payload' },
    type: 'number',
    unit: 'kg',
    category: 'dimensions',
    appliesTo: ['ev'],
    required: false,
    aliases: [],
  },
  {
    key: 'karosserie',
    labels: { de: 'Karosserie', en: 'Body Type' },
    type: 'text',
    unit: null,
    category: 'classification',
    appliesTo: ['ev'],
    required: false,
    aliases: [],
  },
  {
    key: 'segment',
    labels: { de: 'Segment', en: 'Segment' },
    type: 'text',
    unit: null,
    category: 'classification',
    appliesTo: ['ev'],
    required: false,
    aliases: [],
  },
  {
    key: 'plattform',
    labels: { de: 'Plattform', en: 'Platform' },
    type: 'text',
    unit: null,
    category: 'classification',
    appliesTo: ['ev'],
    required: false,
    aliases: [],
  },
  {
    key: 'waermepumpe',
    labels: { de: 'Wärmepumpe', en: 'Heat Pump' },
    type: 'text',
    unit: null,
    category: 'efficiency',
    appliesTo: ['ev'],
    required: false,
    aliases: [],
  },
  {
    key: 'batterie_netto',
    labels: { de: 'Batterie Netto', en: 'Battery Net' },
    type: 'number',
    unit: 'kWh',
    category: 'ev_powertrain',
    appliesTo: ['ev'],
    required: true,
    card: { ev: { visible: true, order: 2 } },
    aliases: ['akku_kapazitaet_kwh'],
  },
  {
    key: 'wltp_reichweite',
    labels: { de: 'WLTP Reichweite', en: 'WLTP Range' },
    type: 'number',
    unit: 'km',
    category: 'ev_efficiency',
    appliesTo: ['ev'],
    required: false,
    card: { ev: { visible: true, order: 8 } },
    aliases: ['reichweite_wltp'],
  },
  {
    key: 'wltp_verbrauch',
    labels: { de: 'WLTP Verbrauch', en: 'WLTP Consumption' },
    type: 'number',
    unit: 'kWh/100km',
    category: 'ev_efficiency',
    appliesTo: ['ev'],
    required: false,
    card: { ev: { visible: false, order: 9 } },
    aliases: ['verbrauch_kwh_100km'],
  },
  {
    key: 'volt',
    labels: { de: 'Volt', en: 'Volt' },
    type: 'number',
    unit: 'V',
    category: 'ev_powertrain',
    appliesTo: ['ev'],
    required: false,
    card: { ev: { visible: false, order: 15 } },
    aliases: ['architektur_volt'],
  },
  {
    key: 'laden_ac_kw',
    labels: { de: 'Laden AC', en: 'AC Charging' },
    type: 'number',
    unit: 'kW',
    category: 'charging',
    appliesTo: ['ev'],
    required: false,
    aliases: [],
  },
  {
    key: 'laden_dc_kw',
    labels: { de: 'Laden DC', en: 'DC Charging' },
    type: 'number',
    unit: 'kW',
    category: 'charging',
    appliesTo: ['ev'],
    required: false,
    aliases: [],
  },
  {
    key: 'max_ladeleistung',
    labels: { de: 'Max. Ladeleistung', en: 'Max. Charge Power' },
    type: 'number',
    unit: 'kW',
    category: 'charging',
    appliesTo: ['ev'],
    required: false,
    card: { ev: { visible: true, order: 6 } },
    aliases: ['laden_dc_kw'],
  },
  {
    key: 'laden_10_80_min',
    labels: { de: '10%–80%', en: '10%–80%' },
    type: 'number',
    unit: 'min',
    category: 'charging',
    appliesTo: ['ev'],
    required: false,
    card: { ev: { visible: true, order: 3 } },
    aliases: ['ladezeit_10_80_min'],
  },
  {
    key: 'kwh_nach_70',
    labels: { de: 'kWh nach 70%', en: 'kWh after 70%' },
    type: 'number',
    unit: 'kWh',
    category: 'charging',
    appliesTo: ['ev'],
    required: false,
    computed: true,
    card: { ev: { visible: true, order: 4 } },
    aliases: [],
  },
  {
    key: 'kwh_pro_min',
    labels: { de: 'kWh/min', en: 'kWh/min' },
    type: 'number',
    unit: null,
    category: 'charging',
    appliesTo: ['ev'],
    required: false,
    computed: true,
    card: { ev: { visible: true, order: 5 } },
    aliases: [],
  },
  {
    key: 'kraftstoff',
    labels: { de: 'Kraftstoff', en: 'Fuel' },
    type: 'text',
    unit: null,
    category: 'ice_powertrain',
    appliesTo: ['ice'],
    required: true,
    card: { ice: { visible: true, order: 2 } },
    aliases: [],
  },
  {
    key: 'verbrauch_l_100km',
    labels: { de: 'Verbrauch', en: 'Consumption' },
    type: 'number',
    unit: 'l/100km',
    category: 'ice_efficiency',
    appliesTo: ['ice'],
    required: true,
    card: { ice: { visible: true, order: 3 } },
    aliases: ['verbrauch_l100km'],
  },
  {
    key: 'co2_g_km',
    labels: { de: 'CO₂', en: 'CO₂' },
    type: 'number',
    unit: 'g/km',
    category: 'ice_efficiency',
    appliesTo: ['ice'],
    required: false,
    card: { ice: { visible: false, order: 8 } },
    aliases: [],
  },
  {
    key: 'hubraum_ccm',
    labels: { de: 'Hubraum', en: 'Displacement' },
    type: 'number',
    unit: 'ccm',
    category: 'ice_powertrain',
    appliesTo: ['ice'],
    required: false,
    aliases: [],
  },
  {
    key: 'zylinder',
    labels: { de: 'Zylinder', en: 'Cylinders' },
    type: 'number',
    unit: null,
    category: 'ice_powertrain',
    appliesTo: ['ice'],
    required: false,
    aliases: [],
  },
  {
    key: 'getriebe',
    labels: { de: 'Getriebe', en: 'Transmission' },
    type: 'text',
    unit: null,
    category: 'ice_powertrain',
    appliesTo: ['ice'],
    required: false,
    aliases: [],
  },
]

export const VEHICLE_FIELD_MAP = Object.fromEntries(
  VEHICLE_FIELD_SCHEMA.map((field) => [field.key, field])
)

export const VEHICLE_FIELD_ALIASES = Object.fromEntries(
  VEHICLE_FIELD_SCHEMA
    .filter((field) => field.aliases && field.aliases.length > 0)
    .map((field) => [field.key, [field.key, ...field.aliases]])
)

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function appliesToVehicleType(field, vehicleType) {
  return !vehicleType || field.appliesTo.includes(vehicleType)
}

function formatAdminLabel(field) {
  const unitLabel = field.unit ? ` (${field.unit})` : ''
  const computedLabel = field.computed ? ' (berechnet)' : ''
  return `${field.labels.de}${unitLabel}${computedLabel}`
}

export function getFieldDefinition(key) {
  return VEHICLE_FIELD_MAP[key] ?? null
}

export function getCanonicalFieldDefinitions(vehicleType) {
  return VEHICLE_FIELD_SCHEMA.filter((field) => appliesToVehicleType(field, vehicleType))
}

export function getFormFields(vehicleType) {
  return getCanonicalFieldDefinitions(vehicleType).map((field) => ({
    key: field.key,
    label: formatAdminLabel(field),
    type: field.type,
    calc: Boolean(field.computed),
    required: Boolean(field.required),
    unit: field.unit,
    category: field.category,
  }))
}

export function getCardFields(vehicleType) {
  return getCanonicalFieldDefinitions(vehicleType)
    .filter((field) => field.card?.[vehicleType])
    .sort((a, b) => fieldCardOrder(a, vehicleType) - fieldCardOrder(b, vehicleType))
    .map((field) => ({
      key: field.key,
      label_de: field.labels.de,
      label_en: field.labels.en,
      visible: Boolean(field.card?.[vehicleType]?.visible),
      order: fieldCardOrder(field, vehicleType),
      category: field.category,
      unit: field.unit,
    }))
}

function fieldCardOrder(field, vehicleType) {
  return field.card?.[vehicleType]?.order ?? Number.MAX_SAFE_INTEGER
}

export function getRequiredFieldKeys(vehicleType) {
  return getCanonicalFieldDefinitions(vehicleType)
    .filter((field) => field.required)
    .map((field) => field.key)
}

export function matchFieldKey(rawValue, vehicleType) {
  const target = slugify(rawValue)
  if (!target) return ''

  const matchingField = getCanonicalFieldDefinitions(vehicleType).find((field) => {
    const candidates = [
      field.key,
      field.labels.de,
      field.labels.en,
      ...(field.aliases ?? []),
    ]

    return candidates.some((candidate) => slugify(candidate) === target)
  })

  return matchingField?.key ?? ''
}

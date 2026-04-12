/**
 * Alle Pflichtfelder die auf Vollständigkeit geprüft werden.
 * Wird in firebase-db.js (Auto-Purge) und ui.js (Incomplete-Widget) verwendet.
 */
export const TRACKED_FIELDS = [
  'marke', 'modell', 'batterieNetto', 'ladezeit', 'maxLadeleistung',
  'anhaengelast', 'wltpReichweite', 'basisPreis', 'nullHundert',
  'psLeistung', 'hoechstgeschwindigkeit', 'voltArchitektur', 'markteinfuehrung',
];

/** Alle Datenfelder mit Metadaten für Filter, Sortierung und Anzeige */
export const FIELDS = [
  { key: 'batterieNetto',          label: 'Batterie Netto',    unit: 'kWh',       step: 0.5,  calc: false },
  { key: 'ladezeit',               label: '10%-80% in min',    unit: 'min',       step: 1,    calc: false },
  { key: 'geladeneEnergie',        label: 'kWh nach 70%',      unit: 'kWh',       step: 0.5,  calc: true  },
  { key: 'ladespeed',              label: 'kWh/min',           unit: 'kWh/min',   step: 0.01, calc: true  },
  { key: 'maxLadeleistung',        label: 'max. Ladeleistung', unit: 'kW',        step: 1,    calc: false },
  { key: 'anhaengelast',           label: 'Anhängelast',       unit: 'kg',        step: 50,   calc: false },
  { key: 'wltpReichweite',         label: 'WLTP',              unit: 'km',        step: 10,   calc: false },
  { key: 'verbrauch',              label: 'WLTP Verbrauch',    unit: 'kWh/100km', step: 0.1,  calc: true  },
  { key: 'basisPreis',             label: 'Basis Preis',       unit: '€',         step: 500,  calc: false },
  { key: 'nullHundert',            label: '0-100',             unit: 's',         step: 0.1,  calc: false },
  { key: 'psLeistung',             label: 'PS',                unit: 'PS',        step: 10,   calc: false },
  { key: 'hoechstgeschwindigkeit', label: 'Top Speed',         unit: 'km/h',      step: 5,    calc: false },
  { key: 'voltArchitektur',        label: 'Volt',              unit: 'V',         step: 100,  calc: false },
];

/**
 * CSV-Spalten → interne Schlüssel (exakter Abgleich nach Lowercase+Trim).
 * Wird in csv.js als erste Lookup-Stufe verwendet, bevor die normalisierte
 * Tabelle (CSV_MAP_NORMALIZED) greift.
 */
export const CSV_MAP = {
  // ── Marke ──────────────────────────────────────────────────────────────────
  'marke': 'marke', 'hersteller': 'marke', 'brand': 'marke', 'make': 'marke',
  'hersteller/marke': 'marke',

  // ── Modell ─────────────────────────────────────────────────────────────────
  'modell': 'modell', 'model': 'modell', 'fahrzeug': 'modell',
  'fahrzeugmodell': 'modell', 'modellbezeichnung': 'modell',

  // ── Batterie Netto ─────────────────────────────────────────────────────────
  'batterie netto': 'batterieNetto', 'batterie_netto': 'batterieNetto',
  'netto-kapazität': 'batterieNetto', 'nettokapazität': 'batterieNetto',
  'kapazität (netto)': 'batterieNetto', 'batterie netto (kwh)': 'batterieNetto',
  'akkukapazität': 'batterieNetto', 'batteriekapazität': 'batterieNetto',
  'nutzbare kapazität': 'batterieNetto', 'nutzbare batteriekapazität': 'batterieNetto',
  'batterie': 'batterieNetto', 'akku': 'batterieNetto', 'akku (kwh)': 'batterieNetto',

  // ── Ladezeit ───────────────────────────────────────────────────────────────
  'ladezeit': 'ladezeit',
  'ladezeit 10-80': 'ladezeit',    'ladezeit 10–80': 'ladezeit',
  'ladezeit 10-80%': 'ladezeit',   'ladezeit 10–80%': 'ladezeit',
  'ladezeit 10-80% (min)': 'ladezeit', 'ladezeit (min)': 'ladezeit',
  'ladezeit 10%-80%': 'ladezeit',  'ladezeit 10%–80%': 'ladezeit',
  'zeit 10-80': 'ladezeit',        'zeit 10–80': 'ladezeit',
  'zeit 10-80% (min)': 'ladezeit', '10%-80% in min': 'ladezeit',
  '10%–80% in min': 'ladezeit',    '10-80% in min': 'ladezeit',
  '10–80% in min': 'ladezeit',     '10-80 min': 'ladezeit',
  '10–80 min': 'ladezeit',         '10-80% (min)': 'ladezeit',
  '10–80% (min)': 'ladezeit',      '10%-80%': 'ladezeit',
  'dc ladezeit': 'ladezeit',       'dc ladezeit (min)': 'ladezeit',
  'laden 10-80': 'ladezeit',       'laden 10–80': 'ladezeit',

  // ── Max. Ladeleistung ──────────────────────────────────────────────────────
  'max. ladeleistung': 'maxLadeleistung', 'max ladeleistung': 'maxLadeleistung',
  'max. ladeleistung (kw)': 'maxLadeleistung', 'ladeleistung': 'maxLadeleistung',
  'maximale ladeleistung': 'maxLadeleistung', 'maximale ladeleistung (kw)': 'maxLadeleistung',
  'spitzenladeleistung': 'maxLadeleistung', 'spitzenladeleistung (kw)': 'maxLadeleistung',
  'peak-ladeleistung': 'maxLadeleistung',   'dc-ladeleistung': 'maxLadeleistung',

  // ── Anhängelast ────────────────────────────────────────────────────────────
  'anhängelast': 'anhaengelast', 'anhängelast (kg)': 'anhaengelast',
  'anhaengelast': 'anhaengelast', 'max. anhängelast': 'anhaengelast',
  'zulässige anhängelast': 'anhaengelast', 'anhängelast gebremst': 'anhaengelast',
  'zuglast': 'anhaengelast', 'anhängelast gebremst (kg)': 'anhaengelast',

  // ── WLTP Reichweite ────────────────────────────────────────────────────────
  'wltp reichweite': 'wltpReichweite', 'wltp-reichweite': 'wltpReichweite',
  'reichweite': 'wltpReichweite',      'wltp reichweite (km)': 'wltpReichweite',
  'wltp': 'wltpReichweite',            'wltp (km)': 'wltpReichweite',
  'elektrische reichweite': 'wltpReichweite', 'reichweite (wltp)': 'wltpReichweite',
  'reichweite wltp': 'wltpReichweite', 'max. reichweite': 'wltpReichweite',

  // ── Basispreis ─────────────────────────────────────────────────────────────
  'basispreis': 'basisPreis', 'basis preis': 'basisPreis',
  'preis': 'basisPreis',      'basispreis (€)': 'basisPreis',
  'uvp': 'basisPreis',        'uvp (€)': 'basisPreis',
  'listenpreis': 'basisPreis', 'grundpreis': 'basisPreis',
  'einstiegspreis': 'basisPreis', 'startpreis': 'basisPreis',
  'kaufpreis': 'basisPreis',

  // ── 0-100 ──────────────────────────────────────────────────────────────────
  '0-100': 'nullHundert', '0–100': 'nullHundert',
  '0-100 km/h': 'nullHundert', '0–100 km/h': 'nullHundert',
  '0-100 km/h (s)': 'nullHundert', '0–100 km/h (s)': 'nullHundert',
  '0-100 (s)': 'nullHundert', '0–100 (s)': 'nullHundert',
  'beschleunigung': 'nullHundert', 'sprint 0-100': 'nullHundert',
  'beschleunigung 0-100': 'nullHundert', 'beschleunigung 0-100 km/h': 'nullHundert',
  'sprint': 'nullHundert',

  // ── PS / Leistung ──────────────────────────────────────────────────────────
  'ps': 'psLeistung', 'ps leistung': 'psLeistung',
  'leistung (ps)': 'psLeistung', 'leistung': 'psLeistung',
  'motorleistung': 'psLeistung', 'motorleistung (ps)': 'psLeistung',
  'systemleistung': 'psLeistung', 'systemleistung (ps)': 'psLeistung',
  'leistung ps': 'psLeistung',

  // ── Höchstgeschwindigkeit ──────────────────────────────────────────────────
  'höchstgeschwindigkeit': 'hoechstgeschwindigkeit',
  'hoechstgeschwindigkeit': 'hoechstgeschwindigkeit',
  'vmax': 'hoechstgeschwindigkeit', 'v max': 'hoechstgeschwindigkeit',
  'top speed': 'hoechstgeschwindigkeit', 'topspeed': 'hoechstgeschwindigkeit',
  'maximalgeschwindigkeit': 'hoechstgeschwindigkeit',
  'höchstgeschwindigkeit (km/h)': 'hoechstgeschwindigkeit',
  'max. geschwindigkeit': 'hoechstgeschwindigkeit',

  // ── Volt-Architektur ───────────────────────────────────────────────────────
  'volt': 'voltArchitektur', 'volt-architektur': 'voltArchitektur',
  'volt architektur': 'voltArchitektur', 'architektur': 'voltArchitektur',
  'spannung': 'voltArchitektur', 'bordnetzspannung': 'voltArchitektur',
  'ladesystem': 'voltArchitektur',

  // ── Markteinführung ────────────────────────────────────────────────────────
  'markteinführung': 'markteinfuehrung', 'markteinfuehrung': 'markteinfuehrung',
  'einführung': 'markteinfuehrung',      'marktstart': 'markteinfuehrung',
  'baujahr': 'markteinfuehrung',         'modelljahr': 'markteinfuehrung',
  'modelljahrgang': 'markteinfuehrung',  'jahr': 'markteinfuehrung',
  'auf dem markt seit': 'markteinfuehrung',
};

/** Admin-Passwort – hier ändern */
export const ADMIN_PASSWORD = 'admin2024';

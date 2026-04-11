'use strict';

/** Alle Datenfelder mit Metadaten für Filter, Sortierung und Anzeige */
const FIELDS = [
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
const CSV_MAP = {
  'marke': 'marke', 'hersteller': 'marke', 'brand': 'marke',
  'modell': 'modell', 'model': 'modell',

  'batterie netto': 'batterieNetto', 'batterie_netto': 'batterieNetto',
  'netto-kapazität': 'batterieNetto', 'nettokapazität': 'batterieNetto',
  'kapazität (netto)': 'batterieNetto', 'batterie netto (kwh)': 'batterieNetto',

  'ladezeit': 'ladezeit', 'ladezeit 10-80': 'ladezeit', 'ladezeit 10–80': 'ladezeit',
  'ladezeit 10-80%': 'ladezeit', 'ladezeit 10–80%': 'ladezeit',
  'ladezeit 10-80% (min)': 'ladezeit', 'zeit 10-80': 'ladezeit',
  'zeit 10–80': 'ladezeit', 'zeit 10-80% (min)': 'ladezeit',
  '10%-80% in min': 'ladezeit',

  'max. ladeleistung': 'maxLadeleistung', 'max ladeleistung': 'maxLadeleistung',
  'ladeleistung': 'maxLadeleistung', 'max. ladeleistung (kw)': 'maxLadeleistung',

  'anhängelast': 'anhaengelast', 'anhängelast (kg)': 'anhaengelast', 'anhaengelast': 'anhaengelast',

  'wltp reichweite': 'wltpReichweite', 'wltp-reichweite': 'wltpReichweite',
  'reichweite': 'wltpReichweite', 'wltp reichweite (km)': 'wltpReichweite',
  'wltp': 'wltpReichweite',

  'basispreis': 'basisPreis', 'basis preis': 'basisPreis',
  'preis': 'basisPreis', 'basispreis (€)': 'basisPreis',

  '0-100': 'nullHundert', '0–100': 'nullHundert', '0-100 km/h': 'nullHundert',
  '0–100 km/h': 'nullHundert', '0-100 km/h (s)': 'nullHundert', 'beschleunigung': 'nullHundert',

  'ps': 'psLeistung', 'ps leistung': 'psLeistung',
  'leistung (ps)': 'psLeistung', 'leistung': 'psLeistung',

  'höchstgeschwindigkeit': 'hoechstgeschwindigkeit',
  'hoechstgeschwindigkeit': 'hoechstgeschwindigkeit', 'vmax': 'hoechstgeschwindigkeit',
  'top speed': 'hoechstgeschwindigkeit',

  'volt': 'voltArchitektur', 'volt-architektur': 'voltArchitektur',
  'volt architektur': 'voltArchitektur', 'architektur': 'voltArchitektur', 'spannung': 'voltArchitektur',

  'markteinführung': 'markteinfuehrung', 'markteinfuehrung': 'markteinfuehrung',
  'einführung': 'markteinfuehrung', 'marktstart': 'markteinfuehrung',
};

/** Admin-Passwort – hier ändern */
const ADMIN_PASSWORD = 'admin2024';

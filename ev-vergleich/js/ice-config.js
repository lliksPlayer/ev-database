'use strict';

/**
 * Datenfelder der ICE-Ansicht (nur numerische Felder).
 * Wird als globales `FIELDS` exportiert – überschreibt das EV-FIELDS aus config.js.
 * NICHT zusammen mit config.js laden!
 */
const FIELDS = [
  { key: 'tankinhalt',            label: 'Tankinhalt',       unit: 'L',       step: 1,   calc: false },
  { key: 'verbrauch',             label: 'Verbrauch',        unit: 'L/100km', step: 0.1, calc: false },
  { key: 'anhaengelast',          label: 'Anhängelast',      unit: 'kg',      step: 50,  calc: false },
  { key: 'gesamtreichweite',      label: 'Gesamtreichweite', unit: 'km',      step: 10,  calc: true  },
  { key: 'basisPreis',            label: 'Basis Preis',      unit: '€',       step: 500, calc: false },
  { key: 'nullHundert',           label: '0-100',            unit: 's',       step: 0.1, calc: false },
  { key: 'psLeistung',            label: 'PS',               unit: 'PS',      step: 10,  calc: false },
  { key: 'hoechstgeschwindigkeit',label: 'Top Speed',        unit: 'km/h',    step: 5,   calc: false },
  { key: 'bordnetzspannung',      label: 'Bordnetzspannung', unit: 'V',       step: 12,  calc: false },
];

/** Alle Felder inkl. Text-Felder – für Vollständigkeitsprüfung */
const TRACKED_ICE_FIELDS = [
  'marke', 'modell', 'tankinhalt', 'kraftstoffart', 'verbrauch',
  'anhaengelast', 'gesamtreichweite', 'basisPreis', 'nullHundert',
  'psLeistung', 'hoechstgeschwindigkeit', 'bordnetzspannung', 'markteinfuehrung',
];

/** Admin-Passwort (gleich wie EV-Seite) */
const ADMIN_PASSWORD = 'admin2024';

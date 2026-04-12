import { detectSeparator, splitCSVLine, normalizeHeader, parseEuroNumber } from './csv.js';
import { uid } from './state.js';

/* ══════════════════════════════════════════════════════════════════════════
   ICE-CSV PARSER
   Wird geladen auf:  index.html (für TCO-Import)  +  ice.html (Hauptparser)
   Benötigt: parseEuroNumber, normalizeHeader, splitCSVLine, detectSeparator
             (aus csv.js)  und uid()  (aus state.js / ice-state.js)
   ══════════════════════════════════════════════════════════════════════════ */

/** Felder die als Text (kein parseEuroNumber) gespeichert werden */
const ICE_TEXT_KEYS = new Set(['marke', 'modell', 'kraftstoffart', 'markteinfuehrung']);

/**
 * Exakter Abgleich (lowercase+trim) → interner Schlüssel.
 */
const ICE_CSV_MAP = {
  // ── Marke ──────────────────────────────────────────────────────────────────
  'marke': 'marke', 'hersteller': 'marke', 'brand': 'marke', 'make': 'marke',
  'hersteller/marke': 'marke',

  // ── Modell ─────────────────────────────────────────────────────────────────
  'modell': 'modell', 'model': 'modell', 'fahrzeug': 'modell',
  'fahrzeugmodell': 'modell', 'modellbezeichnung': 'modell',

  // ── Tankinhalt ─────────────────────────────────────────────────────────────
  'tankinhalt': 'tankinhalt', 'tankinhalt (l)': 'tankinhalt',
  'tank': 'tankinhalt', 'tank (l)': 'tankinhalt',
  'tankvolumen': 'tankinhalt', 'tankgröße': 'tankinhalt',
  'tankinhalt in litern': 'tankinhalt', 'tankkapazität': 'tankinhalt',
  'fassungsvermögen': 'tankinhalt',

  // ── Kraftstoffart ──────────────────────────────────────────────────────────
  'kraftstoffart': 'kraftstoffart', 'kraftstoff': 'kraftstoffart',
  'treibstoff': 'kraftstoffart', 'kraftstofftyp': 'kraftstoffart',
  'fuel type': 'kraftstoffart', 'benzin/diesel/hybrid': 'kraftstoffart',
  'antriebsart': 'kraftstoffart',

  // ── Verbrauch (L/100km) ────────────────────────────────────────────────────
  'wltp verbrauch': 'verbrauch', 'verbrauch': 'verbrauch',
  'wltp-verbrauch': 'verbrauch', 'verbrauch (l/100km)': 'verbrauch',
  'kraftstoffverbrauch': 'verbrauch', 'l/100km': 'verbrauch',
  'wltp verbrauch (l/100km)': 'verbrauch', 'verbrauch wltp': 'verbrauch',
  'normverbrauch': 'verbrauch', 'combined fuel consumption': 'verbrauch',

  // ── Anhängelast ────────────────────────────────────────────────────────────
  'anhängelast': 'anhaengelast', 'anhängelast (kg)': 'anhaengelast',
  'anhaengelast': 'anhaengelast', 'max. anhängelast': 'anhaengelast',
  'zuglast': 'anhaengelast', 'zugkraft': 'anhaengelast',

  // ── Gesamtreichweite ───────────────────────────────────────────────────────
  'gesamtreichweite': 'gesamtreichweite', 'gesamtreichweite (km)': 'gesamtreichweite',
  'reichweite': 'gesamtreichweite', 'reichweite (km)': 'gesamtreichweite',
  'tankreichweite': 'gesamtreichweite', 'maximale reichweite': 'gesamtreichweite',

  // ── Basispreis ─────────────────────────────────────────────────────────────
  'basispreis': 'basisPreis', 'basis preis': 'basisPreis',
  'preis': 'basisPreis', 'basispreis (€)': 'basisPreis',
  'uvp': 'basisPreis', 'listenpreis': 'basisPreis',
  'kaufpreis': 'basisPreis', 'grundpreis': 'basisPreis',

  // ── 0–100 ──────────────────────────────────────────────────────────────────
  '0-100': 'nullHundert', '0–100': 'nullHundert',
  '0-100 km/h': 'nullHundert', '0–100 km/h': 'nullHundert',
  '0-100 (s)': 'nullHundert', '0–100 (s)': 'nullHundert',
  'beschleunigung': 'nullHundert', 'sprint 0-100': 'nullHundert',

  // ── PS / Leistung ──────────────────────────────────────────────────────────
  'ps': 'psLeistung', 'ps leistung': 'psLeistung',
  'leistung (ps)': 'psLeistung', 'leistung': 'psLeistung',
  'motorleistung': 'psLeistung', 'motorleistung (ps)': 'psLeistung',

  // ── Höchstgeschwindigkeit ──────────────────────────────────────────────────
  'höchstgeschwindigkeit': 'hoechstgeschwindigkeit',
  'hoechstgeschwindigkeit': 'hoechstgeschwindigkeit',
  'vmax': 'hoechstgeschwindigkeit', 'top speed': 'hoechstgeschwindigkeit',
  'topspeed': 'hoechstgeschwindigkeit',
  'höchstgeschwindigkeit (km/h)': 'hoechstgeschwindigkeit',
  'max. geschwindigkeit': 'hoechstgeschwindigkeit',

  // ── Bordnetzspannung ───────────────────────────────────────────────────────
  'bordnetzspannung': 'bordnetzspannung', 'spannung': 'bordnetzspannung',
  'bordspannung': 'bordnetzspannung', 'volt': 'bordnetzspannung',
  'netzspannung': 'bordnetzspannung', 'elektrisches bordnetz': 'bordnetzspannung',

  // ── Markteinführung ────────────────────────────────────────────────────────
  'markteinführung': 'markteinfuehrung', 'markteinfuehrung': 'markteinfuehrung',
  'markteinfŸhrung': 'markteinfuehrung',
  'marktstart': 'markteinfuehrung', 'baujahr': 'markteinfuehrung',
  'modelljahr': 'markteinfuehrung', 'einführung': 'markteinfuehrung',
  'auf dem markt seit': 'markteinfuehrung', 'jahr': 'markteinfuehrung',
};

/**
 * Normalisierter Fallback (nach normalizeHeader verarbeitet).
 */
const ICE_CSV_MAP_NORMALIZED = {
  'marke': 'marke', 'hersteller': 'marke', 'brand': 'marke',
  'modell': 'modell', 'model': 'modell',
  'tankinhalt': 'tankinhalt', 'tank': 'tankinhalt', 'tankvolumen': 'tankinhalt',
  'tankgrose': 'tankinhalt', 'tankinhalt in litern': 'tankinhalt',
  'kraftstoffart': 'kraftstoffart', 'kraftstoff': 'kraftstoffart',
  'treibstoff': 'kraftstoffart', 'kraftstofftyp': 'kraftstoffart',
  'wltp verbrauch': 'verbrauch', 'verbrauch': 'verbrauch',
  'kraftstoffverbrauch': 'verbrauch', 'normverbrauch': 'verbrauch',
  'anhangelast': 'anhaengelast', 'zuglast': 'anhaengelast',
  'gesamtreichweite': 'gesamtreichweite', 'reichweite': 'gesamtreichweite',
  'tankreichweite': 'gesamtreichweite',
  'basispreis': 'basisPreis', 'preis': 'basisPreis', 'uvp': 'basisPreis',
  'listenpreis': 'basisPreis', 'kaufpreis': 'basisPreis',
  '0 100': 'nullHundert', 'beschleunigung': 'nullHundert',
  'ps': 'psLeistung', 'leistung': 'psLeistung', 'motorleistung': 'psLeistung',
  'hochstgeschwindigkeit': 'hoechstgeschwindigkeit', 'vmax': 'hoechstgeschwindigkeit',
  'topspeed': 'hoechstgeschwindigkeit', 'top speed': 'hoechstgeschwindigkeit',
  'bordnetzspannung': 'bordnetzspannung', 'spannung': 'bordnetzspannung',
  'bordspannung': 'bordnetzspannung',
  'markteinfuhrung': 'markteinfuehrung', 'marktstart': 'markteinfuehrung',
  'baujahr': 'markteinfuehrung', 'modelljahr': 'markteinfuehrung',
};

/** Berechnet Gesamtreichweite aus Tankinhalt und Verbrauch (L/100km). */
function calcIceDerived(car) {
  const tank = car.tankinhalt != null ? Number(car.tankinhalt) : NaN;
  const verb = car.verbrauch  != null ? Number(car.verbrauch)  : NaN;
  car.gesamtreichweite = (isFinite(tank) && tank > 0 && isFinite(verb) && verb > 0 && !car.gesamtreichweite)
    ? Math.round(tank / verb * 100)
    : (car.gesamtreichweite ?? null);
  return car;
}

/**
 * Parst eine ICE-CSV-Datei.
 * Speichert Ergebnis NICHT – Aufrufer trägt dafür Sorge.
 */
function parseIceCSV(text) {
  text = text.replace(/^\uFEFF/, '').trimEnd();
  const lines = text.split(/\r?\n/);
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  if (lines.length < 2) throw new Error('CSV enthält zu wenig Zeilen (mindestens Headerzeile + Datenzeile).');

  const sep         = detectSeparator(lines[0]);
  const rawHeaders  = splitCSVLine(lines[0], sep);
  const normHeaders = rawHeaders.map(h => normalizeHeader(h));

  const keyMap = rawHeaders.map((raw, i) => {
    const exact = raw.trim().toLowerCase();
    return ICE_CSV_MAP[exact] ?? ICE_CSV_MAP_NORMALIZED[normHeaders[i]] ?? null;
  });

  normHeaders.forEach((h, i) => {
    if (h && !keyMap[i]) {
      console.warn(`[ICE-CSV] Spalte "${rawHeaders[i]}" (normalisiert: "${h}") nicht erkannt – wird ignoriert.`);
    }
  });

  const cars = [];
  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    try {
      const cols = splitCSVLine(rawLine, sep);
      const obj  = { id: uid() };

      keyMap.forEach((internalKey, colIdx) => {
        if (!internalKey) return;
        const raw = (cols[colIdx] ?? '').replace(/^"|"$/g, '').trim();
        if (ICE_TEXT_KEYS.has(internalKey)) {
          if (raw) obj[internalKey] = raw;
        } else {
          const INVALID_VALUES = new Set(['k.a.', 'k.a', '-', 'n/a', 'na', '']);
          const parsed = INVALID_VALUES.has(raw.toLowerCase()) ? null : parseEuroNumber(raw);
          if (obj[internalKey] == null) obj[internalKey] = parsed;
        }
      });

      if (!obj.marke)  obj.marke  = 'Unbekannt';
      if (!obj.modell) obj.modell = `Fahrzeug ${i}`;
      calcIceDerived(obj);
      cars.push(obj);
    } catch (err) {
      console.warn(`[ICE-CSV] Zeile ${i} übersprungen (Fehler: ${err.message}):`, rawLine);
      continue;
    }
  }

  return cars;
}

// Für Classic-Script-Aufrufer (ui.js auf index.html)
window.parseIceCSV = parseIceCSV;

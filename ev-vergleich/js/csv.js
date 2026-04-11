'use strict';

/* ══════════════════════════════════════════════════════════════════════════
   WASCHSTRASSE FÜR CSV-DATEN
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Wandelt einen Rohwert aus einer CSV-Zelle in eine Zahl um.
 * Toleriert europäisches Zahlenformat, Einheiten, Leerzeichen und Sonderzeichen.
 *
 * Beispiele:
 *   "105.000 km"  → 105000
 *   "97,5 kWh"    → 97.5
 *   "42.990 €"    → 42990
 *   "-"           → null
 *   ""            → null
 *   "k.A."        → null
 */
function parseEuroNumber(raw) {
  if (raw == null) return null;
  let s = String(raw)
    // Währungssymbole
    .replace(/[€$£¥]/g, '')
    // Einheiten (Reihenfolge: längste zuerst, damit "kWh/100km" vor "kWh" trifft)
    .replace(/kWh\/100\s*km/gi, '')
    .replace(/kWh\/min/gi, '')
    .replace(/km\/h/gi, '')
    .replace(/\bkWh\b/gi, '')
    .replace(/\bkW\b/gi,  '')
    .replace(/\bkm\b/gi,  '')
    .replace(/\bPS\b/gi,  '')
    .replace(/\bkg\b/gi,  '')
    .replace(/\bmin\b/gi, '')
    .replace(/\bV\b/gi,   '')
    .replace(/\bs\b/gi,   '')
    // Anführungszeichen und sonstige Sonderzeichen außer Ziffern, Komma, Punkt, Minus
    .replace(/[^0-9,.\-]/g, ' ')
    .trim();

  // Leere / Platzhalter-Werte
  if (!s || s === '-' || s === '.' || s === ',') return null;

  // Mehrdeutigkeit auflösen: 1.234,56 (EU) oder 1,234.56 (EN)?
  const hasComma = s.includes(',');
  const hasDot   = s.includes('.');

  if (hasComma && hasDot) {
    // Letzte Trenner-Art = Dezimalstelle
    const lastComma = s.lastIndexOf(',');
    const lastDot   = s.lastIndexOf('.');
    if (lastComma > lastDot) {
      // EU-Format: 1.234,56 → Punkte raus, Komma → Punkt
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      // EN-Format: 1,234.56 → Kommas raus
      s = s.replace(/,/g, '');
    }
  } else if (hasComma) {
    // Nur Komma: könnte Dezimalkomma (9,5) oder Tausender (1,000) sein
    const parts = s.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      // Dezimalkomma: 97,5 oder 97,50
      s = s.replace(',', '.');
    } else {
      // Tausenderkomma: 1,000 oder 10,000
      s = s.replace(/,/g, '');
    }
  } else if (hasDot) {
    // Nur Punkt: Tausenderpunkt (1.000) oder Dezimalpunkt (9.5)?
    const parts = s.split('.');
    if (parts.length === 2 && parts[1].length === 3 && parts[0].length <= 3) {
      // Sieht aus wie Tausenderpunkt: 1.000, 42.990
      s = s.replace(/\./g, '');
    }
    // Sonst: normaler Dezimalpunkt → nichts tun
  }

  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

// Alias für Abwärtskompatibilität (intern genutzt)
const parseEUNumber = parseEuroNumber;


/* ══════════════════════════════════════════════════════════════════════════
   HEADER-NORMALISIERUNG
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Normalisiert einen CSV-Spaltennamen für zuverlässiges Mapping.
 * "Basis Preis (€)" → "basis preis"
 * "WLTP-Reichweite" → "wltp reichweite"
 * " 0–100 km/h (s)" → "0 100 km h"
 */
function normalizeHeader(raw) {
  return String(raw)
    .replace(/^\uFEFF/, '')       // BOM
    .replace(/\([^)]*\)/g, ' ')   // Klammern + Inhalt entfernen: (€), (km), (s) …
    .replace(/[€$£%°]/g, ' ')     // Währungs-/Sonderzeichen
    .replace(/[_\-–—\/]/g, ' ')   // Trennzeichen → Leerzeichen
    .toLowerCase()
    // Umlaute transliterieren BEVOR der Rest-Strip läuft,
    // damit "Anhängelast" → "anhangelast" statt "anh?ngelast"
    .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9 ]/g, ' ') // alles außer Buchstaben/Ziffern/Leerzeichen weg
    .replace(/\s+/g, ' ')         // mehrfache Leerzeichen zusammenfassen
    .trim();
}

/**
 * Erweiterte Zuordnungstabelle: normalisierter Header → interner Schlüssel.
 * Schlüssel hier sind BEREITS normalisiert (d.h. durch normalizeHeader gelaufen).
 */
const CSV_MAP_NORMALIZED = {
  // Marke
  'marke': 'marke', 'hersteller': 'marke', 'brand': 'marke', 'make': 'marke',
  'hersteller marke': 'marke',

  // Modell
  'modell': 'modell', 'model': 'modell', 'fahrzeug': 'modell', 'name': 'modell',
  'modellbezeichnung': 'modell', 'fahrzeugbezeichnung': 'modell',

  // Batterie
  'batterie netto': 'batterieNetto', 'batterie': 'batterieNetto',
  'netto kapazitat': 'batterieNetto', 'nettokapazitat': 'batterieNetto',
  'kapazitat netto': 'batterieNetto', 'batterie netto kwh': 'batterieNetto',
  'akkukapazitat': 'batterieNetto', 'akku': 'batterieNetto',
  'batteriekapazitat': 'batterieNetto', 'nutzbare kapazitat': 'batterieNetto',

  // Ladezeit
  'ladezeit': 'ladezeit', 'ladezeit 10 80': 'ladezeit',
  'ladezeit 10 80 min': 'ladezeit', 'zeit 10 80': 'ladezeit',
  'ladezeit 10 80 percent': 'ladezeit', 'dc ladezeit': 'ladezeit',

  // Max. Ladeleistung
  'max ladeleistung': 'maxLadeleistung', 'max  ladeleistung': 'maxLadeleistung',
  'ladeleistung': 'maxLadeleistung', 'max ladeleistung kw': 'maxLadeleistung',
  'peak ladeleistung': 'maxLadeleistung', 'dc ladeleistung': 'maxLadeleistung',
  'maximale ladeleistung': 'maxLadeleistung',

  // Anhängelast
  'anhangelast': 'anhaengelast', 'anhangelast kg': 'anhaengelast',
  'zuglast': 'anhaengelast', 'zugkraft': 'anhaengelast',
  'zulassige anhangelast': 'anhaengelast', 'max anhangelast': 'anhaengelast',

  // WLTP Reichweite
  'wltp reichweite': 'wltpReichweite', 'reichweite': 'wltpReichweite',
  'wltp reichweite km': 'wltpReichweite', 'wltp': 'wltpReichweite',
  'max reichweite': 'wltpReichweite', 'reichweite wltp': 'wltpReichweite',

  // Basispreis
  'basispreis': 'basisPreis', 'basis preis': 'basisPreis',
  'preis': 'basisPreis', 'kaufpreis': 'basisPreis', 'startpreis': 'basisPreis',
  'grundpreis': 'basisPreis', 'einstiegspreis': 'basisPreis',
  'basispreis eur': 'basisPreis',

  // 0–100
  '0 100': 'nullHundert', '0 100 km h': 'nullHundert',
  '0 100 km h s': 'nullHundert', 'beschleunigung': 'nullHundert',
  'sprint': 'nullHundert', '0 100 s': 'nullHundert',
  'beschleunigung 0 100': 'nullHundert',

  // PS / Leistung
  'ps': 'psLeistung', 'ps leistung': 'psLeistung',
  'leistung ps': 'psLeistung', 'leistung': 'psLeistung',
  'motorleistung': 'psLeistung', 'systemleistung': 'psLeistung',
  'leistung kw': 'psLeistung', // wird ggf. umgerechnet – hier als PS gespeichert

  // Höchstgeschwindigkeit
  'hochstgeschwindigkeit': 'hoechstgeschwindigkeit',
  'hochstgeschwindigkeit km h': 'hoechstgeschwindigkeit',
  'vmax': 'hoechstgeschwindigkeit', 'topspeed': 'hoechstgeschwindigkeit',
  'max geschwindigkeit': 'hoechstgeschwindigkeit',
  'hochstgeschw': 'hoechstgeschwindigkeit',

  // Volt-Architektur
  'volt architektur': 'voltArchitektur', 'volt': 'voltArchitektur',
  'architektur': 'voltArchitektur', 'spannung': 'voltArchitektur',
  'bordnetzspannung': 'voltArchitektur',

  // Markteinführung
  'markteinfuhrung': 'markteinfuehrung', 'marktstart': 'markteinfuehrung',
  'einfuhrung': 'markteinfuehrung', 'baujahr': 'markteinfuehrung',
  'jahr': 'markteinfuehrung', 'modell jahr': 'markteinfuehrung',
};


/* ══════════════════════════════════════════════════════════════════════════
   HAUPT-PARSER
   ══════════════════════════════════════════════════════════════════════════ */

/** Erkennt den Spaltentrenner automatisch (;  ,  Tab). */
function detectSeparator(firstLine) {
  const counts = {
    ';': (firstLine.match(/;/g) || []).length,
    ',': (firstLine.match(/,/g) || []).length,
    '\t': (firstLine.match(/\t/g) || []).length,
  };
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

/** Parst eine CSV-Datei. Ist extrem fehlertolerant – kein Auto wird wegen fehlender Daten verworfen. */
function parseCSV(text) {
  // BOM und überflüssige Whitespace am Ende entfernen
  text = text.replace(/^\uFEFF/, '').trimEnd();

  const lines = text.split(/\r?\n/);
  // Leere Zeilen am Ende überspringen
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  if (lines.length < 2) throw new Error('CSV enthält zu wenig Zeilen (mindestens 1 Headerzeile + 1 Datenzeile erwartet).');

  const sep = detectSeparator(lines[0]);

  // Header-Zeile parsen und normalisieren
  const rawHeaders  = splitCSVLine(lines[0], sep);
  const normHeaders = rawHeaders.map(h => normalizeHeader(h));

  // Jeden Header auf internen Schlüssel mappen:
  // 1. Stufe: exakter Abgleich (lowercase+trim) gegen CSV_MAP aus config.js
  // 2. Stufe: normalisierter Abgleich gegen CSV_MAP_NORMALIZED
  const keyMap = rawHeaders.map((raw, i) => {
    const exact = raw.trim().toLowerCase();
    return CSV_MAP[exact] ?? CSV_MAP_NORMALIZED[normHeaders[i]] ?? null;
  });

  // Nicht erkannte Header in der Konsole loggen (hilfreich beim Debuggen)
  normHeaders.forEach((h, i) => {
    if (h && !keyMap[i]) {
      console.warn(`[CSV] Spalte "${rawHeaders[i]}" (normalisiert: "${h}") nicht erkannt – wird ignoriert.`);
    }
  });

  const cars = [];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    const cols = splitCSVLine(rawLine, sep);
    const obj  = { id: uid() };

    keyMap.forEach((internalKey, colIdx) => {
      if (!internalKey) return; // Spalte nicht erkannt → überspringen

      // Wert bereinigen (Anführungszeichen, Whitespace)
      const raw = (cols[colIdx] ?? '').replace(/^"|"$/g, '').trim();

      if (internalKey === 'marke' || internalKey === 'modell' || internalKey === 'markteinfuehrung') {
        // Textwert: nur setzen wenn nicht leer
        if (raw) obj[internalKey] = raw;
      } else {
        // Zahlenwert: immer versuchen zu parsen, null wenn nicht möglich
        const parsed = parseEuroNumber(raw);
        // Ersten Wert nehmen; spätere Spalten mit gleichem Key überschreiben nur wenn aktuell null
        if (obj[internalKey] == null) {
          obj[internalKey] = parsed;
        }
      }
    });

    // Fallback-Werte sicherstellen – kein Auto darf komplett fehlen
    if (!obj.marke)  obj.marke  = 'Unbekannt';
    if (!obj.modell) obj.modell = `Fahrzeug ${i}`;

    calcDerived(obj);
    cars.push(obj);
  }

  return cars;
}

/** Teilt eine CSV-Zeile korrekt auf (unterstützt Anführungszeichen und doppelte Escaped-Quotes ""). */
function splitCSVLine(line, sep) {
  const result = [];
  let inQuotes = false;
  let cur = '';

  for (let i = 0; i < line.length; i++) {
    const c = line[i];

    if (c === '"') {
      // Doppeltes Anführungszeichen innerhalb von Quotes = escaped Quote
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === sep && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }

  result.push(cur);
  return result;
}

/** Berechnet Wertebereiche aller Felder aus dem aktuellen Datensatz. */
function computeBounds(cars) {
  const bounds = {};
  FIELDS.forEach(({ key }) => {
    const vals = cars.map(c => c[key]).filter(v => v != null && !isNaN(v));
    bounds[key] = vals.length === 0
      ? { min: 0, max: 0 }
      : { min: Math.floor(Math.min(...vals)), max: Math.ceil(Math.max(...vals)) };
  });
  state.bounds = bounds;
}

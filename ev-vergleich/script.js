/**
 * script.js – EV Vergleich Dashboard
 * Vollständige Logik: Datenverwaltung, Rendering, Sortieren, Filtern, CSV-Import
 */

'use strict';

/* ==========================================================================
   KONFIGURATION
   ========================================================================== */

/** Alle Datenfelder mit Metadaten für Filter, Sortierung und Anzeige */
const FIELDS = [
  { key: 'batterieNetto',        label: 'Batterie Netto',        unit: 'kWh',      step: 0.5,  calc: false },
  { key: 'ladezeit',             label: 'Ladezeit 10–80 %',      unit: 'min',      step: 1,    calc: false },
  { key: 'geladeneEnergie',      label: 'kWh nach 70 %',         unit: 'kWh',      step: 0.5,  calc: true  },
  { key: 'ladespeed',            label: 'Ladespeed',             unit: 'kWh/min',  step: 0.01, calc: true  },
  { key: 'maxLadeleistung',      label: 'Max. Ladeleistung',     unit: 'kW',       step: 1,    calc: false },
  { key: 'anhaengelast',         label: 'Anhängelast',           unit: 'kg',       step: 50,   calc: false },
  { key: 'wltpReichweite',       label: 'WLTP Reichweite',       unit: 'km',       step: 10,   calc: false },
  { key: 'verbrauch',            label: 'WLTP Verbrauch',        unit: 'kWh/100km',step: 0.1,  calc: true  },
  { key: 'basisPreis',           label: 'Basispreis',            unit: '€',        step: 500,  calc: false },
  { key: 'nullHundert',          label: '0–100 km/h',            unit: 's',        step: 0.1,  calc: false },
  { key: 'psLeistung',           label: 'PS Leistung',           unit: 'PS',       step: 10,   calc: false },
  { key: 'hoechstgeschwindigkeit',label: 'Höchstgeschw.',        unit: 'km/h',     step: 5,    calc: false },
  { key: 'voltArchitektur',      label: 'Volt-Architektur',      unit: 'V',        step: 100,  calc: false },
];

/** Zuordnung von CSV-Spaltennamen → internen Feldschlüsseln (flexibles Mapping) */
const CSV_MAP = {
  'marke':                    'marke',
  'hersteller':               'marke',
  'brand':                    'marke',
  'modell':                   'modell',
  'model':                    'modell',
  'batterie netto':           'batterieNetto',
  'batterie_netto':           'batterieNetto',
  'netto-kapazität':          'batterieNetto',
  'nettokapazität':           'batterieNetto',
  'kapazität (netto)':        'batterieNetto',
  'batterie netto (kwh)':     'batterieNetto',
  'ladezeit':                 'ladezeit',
  'ladezeit 10-80':           'ladezeit',
  'ladezeit 10–80':           'ladezeit',
  'ladezeit 10-80%':          'ladezeit',
  'ladezeit 10–80%':          'ladezeit',
  'ladezeit 10-80% (min)':    'ladezeit',
  'zeit 10-80':               'ladezeit',
  'zeit 10–80':               'ladezeit',
  'zeit 10-80% (min)':        'ladezeit',
  'max. ladeleistung':        'maxLadeleistung',
  'max ladeleistung':         'maxLadeleistung',
  'ladeleistung':             'maxLadeleistung',
  'max. ladeleistung (kw)':   'maxLadeleistung',
  'anhängelast':              'anhaengelast',
  'anhängelast (kg)':         'anhaengelast',
  'anhaengelast':             'anhaengelast',
  'wltp reichweite':          'wltpReichweite',
  'wltp-reichweite':          'wltpReichweite',
  'reichweite':               'wltpReichweite',
  'wltp reichweite (km)':     'wltpReichweite',
  'basispreis':               'basisPreis',
  'basis preis':              'basisPreis',
  'preis':                    'basisPreis',
  'basispreis (€)':           'basisPreis',
  '0-100':                    'nullHundert',
  '0–100':                    'nullHundert',
  '0-100 km/h':               'nullHundert',
  '0–100 km/h':               'nullHundert',
  '0-100 km/h (s)':           'nullHundert',
  'beschleunigung':           'nullHundert',
  'ps':                       'psLeistung',
  'ps leistung':              'psLeistung',
  'leistung (ps)':            'psLeistung',
  'leistung':                 'psLeistung',
  'höchstgeschwindigkeit':    'hoechstgeschwindigkeit',
  'hoechstgeschwindigkeit':   'hoechstgeschwindigkeit',
  'vmax':                     'hoechstgeschwindigkeit',
  'volt':                     'voltArchitektur',
  'volt-architektur':         'voltArchitektur',
  'volt architektur':         'voltArchitektur',
  'architektur':              'voltArchitektur',
  'spannung':                 'voltArchitektur',
  'markteinführung':          'markteinfuehrung',
  'markteinfuehrung':         'markteinfuehrung',
  'einführung':               'markteinfuehrung',
  'marktstart':               'markteinfuehrung',
};


/* ==========================================================================
   ZUSTAND (App State)
   ========================================================================== */

const state = {
  /** Alle geladenen Autos */
  cars: [],

  /** Aktuell angezeigte (gefilterte + sortierte) Autos */
  visible: [],

  /** Ansichtsgröße: 'large' | 'medium' | 'small' */
  viewSize: 'medium',

  /** Sortierfeld */
  sortKey: 'wltpReichweite',

  /** Sortierrichtung: 'desc' | 'asc' */
  sortDir: 'desc',

  /** Filter: { feldKey: { min, max } } */
  filters: {},

  /** Wertebereich aller Felder aus den Daten */
  bounds: {},
};

let _nextId = 1;
const uid = () => String(_nextId++);


/* ==========================================================================
   BERECHNUNGEN
   ========================================================================== */

/**
 * Berechnet abgeleitete Felder für ein Auto-Objekt.
 * Fehlende Werte (NaN, null) werden als null belassen.
 */
function calcDerived(car) {
  const bn  = car.batterieNetto;
  const lz  = car.ladezeit;
  const rei = car.wltpReichweite;

  car.geladeneEnergie = (bn > 0) ? round2(bn * 0.7) : null;
  car.ladespeed       = (car.geladeneEnergie > 0 && lz > 0) ? round2(car.geladeneEnergie / lz) : null;
  car.verbrauch       = (bn > 0 && rei > 0) ? round2((bn / rei) * 100) : null;
  return car;
}

function round2(n) { return Math.round(n * 100) / 100; }


/* ==========================================================================
   CSV-PARSER
   ========================================================================== */

/**
 * Parst eine CSV-Datei (UTF-8, Semikolon- oder Komma-getrennt).
 * Unterstützt deutsche Dezimalzahlen (Komma als Dezimaltrenner).
 * Gibt ein Array von Auto-Objekten zurück.
 */
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error('CSV enthält zu wenig Zeilen.');

  // Trennzeichen automatisch erkennen
  const sep = lines[0].includes(';') ? ';' : ',';

  // Header parsen und normalisieren
  const headers = lines[0].split(sep).map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());

  const cars = [];

  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw) continue;

    const cols = splitCSVLine(raw, sep);
    const obj  = { id: uid() };

    headers.forEach((h, idx) => {
      const key = CSV_MAP[h];
      if (!key) return;

      let val = (cols[idx] || '').trim().replace(/^"|"$/g, '');

      if (key === 'marke' || key === 'modell' || key === 'markteinfuehrung') {
        obj[key] = val;
      } else {
        // Deutsches Zahlenformat: "10,5" → 10.5 | "1.234,5" → 1234.5
        val = val.replace(/\.(?=\d{3})/g, '').replace(',', '.');
        obj[key] = val !== '' ? parseFloat(val) : null;
      }
    });

    // Defaults für fehlende Felder
    if (!obj.marke)  obj.marke  = 'Unbekannt';
    if (!obj.modell) obj.modell = `Auto ${i}`;

    calcDerived(obj);
    cars.push(obj);
  }

  return cars;
}

/** Teilt eine CSV-Zeile korrekt auf (berücksichtigt Anführungszeichen) */
function splitCSVLine(line, sep) {
  const result = [];
  let inQuotes = false;
  let cur = '';

  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
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


/* ==========================================================================
   WERTEBEREICHE (für Filter-Schieberegler)
   ========================================================================== */

function computeBounds(cars) {
  const bounds = {};
  FIELDS.forEach(({ key }) => {
    const vals = cars.map(c => c[key]).filter(v => v != null && !isNaN(v));
    if (vals.length === 0) {
      bounds[key] = { min: 0, max: 0 };
    } else {
      bounds[key] = { min: Math.floor(Math.min(...vals)), max: Math.ceil(Math.max(...vals)) };
    }
  });
  state.bounds = bounds;
}


/* ==========================================================================
   FILTER & SORTIERUNG
   ========================================================================== */

function applyFiltersAndSort() {
  let cars = [...state.cars];

  // Filter anwenden
  Object.entries(state.filters).forEach(([key, { min, max }]) => {
    cars = cars.filter(car => {
      const v = car[key];
      if (v == null) return true;   // Null-Werte nicht herausfiltern
      return v >= min && v <= max;
    });
  });

  // Sortieren
  const { sortKey, sortDir } = state;
  cars.sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];

    // String-Vergleich für Marke/Modell/Datum
    if (typeof av === 'string' || typeof bv === 'string') {
      return sortDir === 'asc'
        ? String(av ?? '').localeCompare(String(bv ?? ''), 'de')
        : String(bv ?? '').localeCompare(String(av ?? ''), 'de');
    }

    // Null-Werte immer ans Ende
    if (av == null) return 1;
    if (bv == null) return -1;

    return sortDir === 'asc' ? av - bv : bv - av;
  });

  state.visible = cars;
}


/* ==========================================================================
   FORMATIERUNG
   ========================================================================== */

const FMT_DE = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 });
const FMT_EUR = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

function fmt(val, key) {
  if (val == null || isNaN(val)) return '–';
  if (key === 'basisPreis') return FMT_EUR.format(val);
  return FMT_DE.format(val);
}


/* ==========================================================================
   RENDERING: HIGHLIGHTS
   ========================================================================== */

function renderHighlights() {
  const cars = state.visible;

  // Beste Reichweite
  const bestR = cars.reduce((best, c) =>
    (c.wltpReichweite > (best?.wltpReichweite ?? -Infinity)) ? c : best, null);

  document.getElementById('hlReichweiteVal').textContent =
    bestR ? fmt(bestR.wltpReichweite, 'wltpReichweite') + ' km' : '–';
  document.getElementById('hlReichweiteNam').textContent =
    bestR ? `${bestR.marke} ${bestR.modell}` : '–';

  // Meiste PS
  const bestPS = cars.reduce((best, c) =>
    (c.psLeistung > (best?.psLeistung ?? -Infinity)) ? c : best, null);

  document.getElementById('hlPSVal').textContent =
    bestPS ? fmt(bestPS.psLeistung, 'psLeistung') + ' PS' : '–';
  document.getElementById('hlPSNam').textContent =
    bestPS ? `${bestPS.marke} ${bestPS.modell}` : '–';
}


/* ==========================================================================
   RENDERING: CAR CARDS
   ========================================================================== */

function renderCards() {
  const grid    = document.getElementById('carsGrid');
  const emptyEl = document.getElementById('emptyState');
  const countEl = document.getElementById('carCount');

  countEl.textContent = `${state.cars.length} Auto${state.cars.length !== 1 ? 's' : ''}`;

  if (state.visible.length === 0) {
    grid.innerHTML = '';
    grid.classList.add('hidden');
    emptyEl.classList.remove('hidden');
    emptyEl.classList.add('flex');
    return;
  }

  grid.classList.remove('hidden');
  emptyEl.classList.add('hidden');
  emptyEl.classList.remove('flex');

  grid.innerHTML = state.visible.map(car => buildCardHTML(car)).join('');

  // Lucide-Icons in neuen Karten rendern
  lucide.createIcons();

  // Lösch-Buttons verdrahten
  grid.querySelectorAll('[data-delete-id]').forEach(btn => {
    btn.addEventListener('click', () => deleteCar(btn.dataset.deleteId));
  });
}

/** Erzeugt das HTML einer einzelnen Auto-Karte */
function buildCardHTML(car) {
  const unit = (key) => FIELDS.find(f => f.key === key)?.unit ?? '';

  // Detail-Zeile mit Lucide-Icon
  const iconRow = (icon, color, val, key, label) => {
    if (val == null || isNaN(val)) return '';
    return `
      <div class="flex items-center gap-2">
        <i data-lucide="${icon}" class="w-3.5 h-3.5 ${color} flex-shrink-0"></i>
        <div class="min-w-0">
          <p class="text-white text-sm font-bold leading-none">${fmt(val, key)} <span class="text-slate-500 font-normal text-xs">${unit(key)}</span></p>
          <p class="text-slate-500 text-xs mt-0.5">${label}</p>
        </div>
      </div>`;
  };

  return `
  <article class="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-600/70 hover:shadow-xl hover:shadow-black/30" data-id="${car.id}">

    <!-- Header -->
    <div class="px-5 pt-5 pb-4 flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-teal-400 text-xs font-bold uppercase tracking-widest mb-1">${escapeHtml(car.marke)}</p>
        <h3 class="text-white text-xl font-black leading-tight truncate">${escapeHtml(car.modell)}</h3>
      </div>
      ${car.markteinfuehrung ? `<span class="flex-shrink-0 px-2.5 py-1 bg-slate-700 text-slate-400 text-xs font-semibold rounded-full">${escapeHtml(String(car.markteinfuehrung))}</span>` : ''}
    </div>

    <!-- Hauptwerte -->
    <div class="px-5 pb-4 grid grid-cols-2 gap-3">
      <div class="bg-slate-900/60 rounded-lg p-3">
        <p class="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">WLTP Reichweite</p>
        <p class="text-blue-400 text-2xl font-black leading-none">${car.wltpReichweite != null ? fmt(car.wltpReichweite, 'wltpReichweite') : '–'}<span class="text-sm font-semibold text-blue-500/60">${car.wltpReichweite != null ? ' km' : ''}</span></p>
      </div>
      <div class="bg-slate-900/60 rounded-lg p-3">
        <p class="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Basispreis</p>
        <p class="text-emerald-400 text-xl font-black leading-none">${car.basisPreis != null ? fmt(car.basisPreis, 'basisPreis') : '–'}</p>
      </div>
    </div>

    <!-- Trennlinie -->
    <div class="mx-5 border-t border-slate-700/60"></div>

    <!-- Detail-Grid -->
    <div class="px-5 py-4 grid grid-cols-2 gap-x-4 gap-y-3 flex-1">
      ${iconRow('battery-charging', 'text-emerald-400', car.batterieNetto,          'batterieNetto',          'Batterie Netto')}
      ${iconRow('timer',            'text-orange-400',  car.ladezeit,               'ladezeit',               'Ladezeit 10–80 %')}
      ${iconRow('activity',         'text-violet-400',  car.verbrauch,              'verbrauch',              'WLTP Verbrauch')}
      ${iconRow('zap',              'text-yellow-400',  car.ladespeed,              'ladespeed',              'Ladespeed')}
      ${iconRow('zap',              'text-yellow-600',  car.maxLadeleistung,        'maxLadeleistung',        'Max. Ladeleistung')}
      ${iconRow('rocket',           'text-red-400',     car.nullHundert,            'nullHundert',            '0–100 km/h')}
      ${iconRow('gauge',            'text-rose-400',    car.psLeistung,             'psLeistung',             'PS Leistung')}
      ${iconRow('wind',             'text-slate-300',   car.hoechstgeschwindigkeit, 'hoechstgeschwindigkeit', 'Höchstgeschw.')}
      ${iconRow('truck',            'text-amber-600',   car.anhaengelast,           'anhaengelast',           'Anhängelast')}
      ${car.voltArchitektur != null ? `
      <div class="col-span-2 flex items-center gap-2 pt-2 mt-1 border-t border-slate-700/40">
        <i data-lucide="cpu" class="w-3.5 h-3.5 text-blue-400 flex-shrink-0"></i>
        <span class="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">${fmt(car.voltArchitektur, 'voltArchitektur')}V Architektur</span>
      </div>` : ''}
    </div>

    <!-- Löschen -->
    <button class="w-full flex items-center justify-center gap-2 py-3 border-t border-slate-700/50 text-xs text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-colors"
            data-delete-id="${car.id}" aria-label="${escapeHtml(car.marke)} ${escapeHtml(car.modell)} entfernen">
      <i data-lucide="trash-2" class="w-3.5 h-3.5" aria-hidden="true"></i>
      Entfernen
    </button>

  </article>`;
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}


/* ==========================================================================
   RENDERING: FILTER-SCHIEBEREGLER
   ========================================================================== */

function buildFilterPanel() {
  const container = document.getElementById('filterSliders');
  container.innerHTML = '';

  FIELDS.forEach(({ key, label, unit, step }) => {
    const { min, max } = state.bounds[key] ?? { min: 0, max: 0 };
    const cur = state.filters[key] ?? { min, max };
    const id  = `filter-${key}`;

    const el = document.createElement('div');
    el.className = 'flex flex-col gap-2';
    el.innerHTML = `
      <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">
        ${label} <span class="text-slate-600 font-normal normal-case">(${unit})</span>
      </label>
      <div class="flex items-center gap-2">
        <input class="w-14 h-7 px-1.5 text-xs text-center text-slate-200 bg-slate-900 border border-slate-700 rounded-lg"
               type="number" id="${id}-min" value="${cur.min}" min="${min}" max="${max}" step="${step}" aria-label="${label} Minimum" />
        <input type="range" id="${id}-slider-min" value="${cur.min}" min="${min}" max="${max}" step="${step}" class="flex-1" />
        <span class="text-xs text-slate-600 flex-shrink-0">–</span>
        <input type="range" id="${id}-slider-max" value="${cur.max}" min="${min}" max="${max}" step="${step}" class="flex-1" />
        <input class="w-14 h-7 px-1.5 text-xs text-center text-slate-200 bg-slate-900 border border-slate-700 rounded-lg"
               type="number" id="${id}-max" value="${cur.max}" min="${min}" max="${max}" step="${step}" aria-label="${label} Maximum" />
      </div>`;

    container.appendChild(el);

    // Events
    const numMin    = el.querySelector(`#${id}-min`);
    const numMax    = el.querySelector(`#${id}-max`);
    const sliderMin = el.querySelector(`#${id}-slider-min`);
    const sliderMax = el.querySelector(`#${id}-slider-max`);

    function applyFilter() {
      let fMin = parseFloat(numMin.value);
      let fMax = parseFloat(numMax.value);
      if (isNaN(fMin)) fMin = min;
      if (isNaN(fMax)) fMax = max;
      // Sicherstellen, dass min ≤ max
      if (fMin > fMax) [fMin, fMax] = [fMax, fMin];
      numMin.value    = fMin;
      numMax.value    = fMax;
      sliderMin.value = fMin;
      sliderMax.value = fMax;

      if (fMin === min && fMax === max) {
        delete state.filters[key];
      } else {
        state.filters[key] = { min: fMin, max: fMax };
      }
      refresh();
    }

    sliderMin.addEventListener('input', () => { numMin.value = sliderMin.value; applyFilter(); });
    sliderMax.addEventListener('input', () => { numMax.value = sliderMax.value; applyFilter(); });
    numMin.addEventListener('change', applyFilter);
    numMax.addEventListener('change', applyFilter);
    numMin.addEventListener('keydown', e => { if (e.key === 'Enter') applyFilter(); });
    numMax.addEventListener('keydown', e => { if (e.key === 'Enter') applyFilter(); });
  });
}


/* ==========================================================================
   HAUPT-RENDER-FUNKTION
   ========================================================================== */

function refresh() {
  applyFiltersAndSort();
  renderHighlights();
  renderCards();
}


/* ==========================================================================
   AUTO HINZUFÜGEN / LÖSCHEN
   ========================================================================== */

function addCar(formData) {
  const num = (k) => {
    const v = parseFloat(formData[k]);
    return isNaN(v) ? null : v;
  };

  const car = {
    id:                   uid(),
    marke:                (formData.marke  || '').trim(),
    modell:               (formData.modell || '').trim(),
    markteinfuehrung:     (formData.markteinfuehrung || '').trim() || null,
    batterieNetto:        num('batterieNetto'),
    ladezeit:             num('ladezeit'),
    maxLadeleistung:      num('maxLadeleistung'),
    anhaengelast:         num('anhaengelast'),
    wltpReichweite:       num('wltpReichweite'),
    basisPreis:           num('basisPreis'),
    nullHundert:          num('nullHundert'),
    psLeistung:           num('psLeistung'),
    hoechstgeschwindigkeit: num('hoechstgeschwindigkeit'),
    voltArchitektur:      num('voltArchitektur'),
  };

  calcDerived(car);
  state.cars.push(car);

  // Bounds und Filter aktualisieren
  computeBounds(state.cars);
  buildFilterPanel();
  refresh();

  toast(`${car.marke} ${car.modell} hinzugefügt`, 'success');
}

function deleteCar(id) {
  const idx = state.cars.findIndex(c => c.id === id);
  if (idx === -1) return;
  const removed = state.cars.splice(idx, 1)[0];

  computeBounds(state.cars);
  buildFilterPanel();
  refresh();

  toast(`${removed.marke} ${removed.modell} entfernt`);
}


/* ==========================================================================
   TOAST-BENACHRICHTIGUNGEN
   ========================================================================== */

function toast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  const el = document.createElement('div');
  const border = type === 'success' ? 'border-teal-500/50' : type === 'error' ? 'border-red-500/50' : 'border-slate-600';
  const dot    = type === 'success' ? 'bg-teal-400'        : type === 'error' ? 'bg-red-400'        : 'bg-slate-400';
  el.className = `toast-anim pointer-events-auto flex items-center gap-3 px-4 py-2.5 bg-slate-800 border ${border} rounded-xl text-sm text-slate-100 shadow-lg`;
  el.innerHTML = `<span class="w-2 h-2 rounded-full flex-shrink-0 ${dot}"></span>${escapeHtml(msg)}`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}


/* ==========================================================================
   LIVE-BERECHNUNGEN IM FORMULAR
   ========================================================================== */

function updateFormCalc() {
  const bn  = parseFloat(document.getElementById('f-batterieNetto').value);
  const lz  = parseFloat(document.getElementById('f-ladezeit').value);
  const rei = parseFloat(document.getElementById('f-wltpReichweite').value);

  const ge  = bn  > 0 ? round2(bn * 0.7)      : null;
  const ls  = (ge > 0 && lz > 0) ? round2(ge / lz) : null;
  const ver = (bn > 0 && rei > 0) ? round2((bn / rei) * 100) : null;

  document.getElementById('c-geladeneEnergie').textContent = ge  != null ? FMT_DE.format(ge)  + ' kWh'      : '–';
  document.getElementById('c-ladespeed').textContent       = ls  != null ? FMT_DE.format(ls)  + ' kWh/min'  : '–';
  document.getElementById('c-verbrauch').textContent       = ver != null ? FMT_DE.format(ver) + ' kWh/100km': '–';
}


/* ==========================================================================
   MODAL-STEUERUNG
   ========================================================================== */

function openModal() {
  const overlay = document.getElementById('addCarModal');
  overlay.classList.add('is-open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('f-marke')?.focus(), 100);
}

function closeModal() {
  const overlay = document.getElementById('addCarModal');
  overlay.classList.remove('is-open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  document.getElementById('addCarForm').reset();
  updateFormCalc();
}


/* ==========================================================================
   FILTER-PANEL TOGGLE
   ========================================================================== */

function toggleFilter() {
  const panel  = document.getElementById('filterPanel');
  const btn    = document.getElementById('filterToggle');
  const isOpen = panel.classList.toggle('is-open');
  btn.setAttribute('aria-expanded', isOpen);
  panel.setAttribute('aria-hidden', !isOpen);
}


/* ==========================================================================
   ANSICHTSGRÖSSE
   ========================================================================== */

const VIEW_GRID = {
  large:  'grid grid-cols-1 md:grid-cols-2 gap-5',
  medium: 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5',
  small:  'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4',
};
const BTN_ON  = 'view-btn h-8 w-8 flex items-center justify-center text-teal-400 bg-teal-500/10 border border-teal-500/50 rounded-lg transition-colors';
const BTN_OFF = 'view-btn h-8 w-8 flex items-center justify-center text-slate-400 bg-slate-800 border border-slate-700/50 rounded-lg hover:text-slate-200 hover:border-slate-600 transition-colors';

function setView(size) {
  state.viewSize = size;
  document.getElementById('carsGrid').className = VIEW_GRID[size] ?? VIEW_GRID.medium;
  document.querySelectorAll('.view-btn').forEach(btn => {
    const on = btn.dataset.view === size;
    btn.className = on ? BTN_ON : BTN_OFF;
    btn.setAttribute('aria-pressed', on);
  });
}


/* ==========================================================================
   SORTIERUNG
   ========================================================================== */

function updateSortUI() {
  const btn = document.getElementById('sortDirBtn');
  btn.classList.toggle('desc', state.sortDir === 'desc');
  btn.title = state.sortDir === 'desc' ? 'Absteigend (klicken für aufsteigend)' : 'Aufsteigend (klicken für absteigend)';
}


/* ==========================================================================
   CSV-DATEI LADEN
   ========================================================================== */

function loadCSVFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const cars = parseCSV(e.target.result);
      if (cars.length === 0) throw new Error('Keine Datensätze in der CSV gefunden.');

      state.cars = cars;
      state.filters = {};

      computeBounds(state.cars);
      buildFilterPanel();
      refresh();

      toast(`${cars.length} Autos aus CSV geladen`, 'success');
    } catch (err) {
      toast('Fehler beim Laden: ' + err.message, 'error');
      console.error(err);
    }
  };
  reader.onerror = () => toast('Datei konnte nicht gelesen werden.', 'error');
  reader.readAsText(file, 'UTF-8');
}


/* ==========================================================================
   EVENT-HANDLER VERDRAHTEN
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* --- Sortierung --- */
  document.getElementById('sortSelect').addEventListener('change', e => {
    state.sortKey = e.target.value;
    refresh();
  });

  document.getElementById('sortDirBtn').addEventListener('click', () => {
    state.sortDir = state.sortDir === 'desc' ? 'asc' : 'desc';
    updateSortUI();
    refresh();
  });
  updateSortUI();

  /* --- Filter --- */
  document.getElementById('filterToggle').addEventListener('click', toggleFilter);
  document.getElementById('filterResetBtn').addEventListener('click', () => {
    state.filters = {};
    buildFilterPanel();
    refresh();
    toast('Filter zurückgesetzt');
  });

  /* --- Ansichtsgröße --- */
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => setView(btn.dataset.view));
  });

  /* --- CSV laden --- */
  document.getElementById('loadDataBtn').addEventListener('click', () => {
    document.getElementById('fileInput').click();
  });
  document.getElementById('emptyLoadBtn').addEventListener('click', () => {
    document.getElementById('fileInput').click();
  });

  document.getElementById('fileInput').addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) loadCSVFile(file);
    e.target.value = ''; // Reset, damit dieselbe Datei erneut geladen werden kann
  });

  /* --- Modal öffnen/schließen --- */
  document.getElementById('addCarBtn').addEventListener('click',   openModal);
  document.getElementById('emptyAddBtn').addEventListener('click', openModal);
  document.getElementById('modalClose').addEventListener('click',  closeModal);
  document.getElementById('modalCancel').addEventListener('click', closeModal);

  // Overlay-Klick schließt Modal
  document.getElementById('addCarModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });

  // Escape-Taste schließt Modal
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  /* --- Live-Berechnung im Formular --- */
  ['f-batterieNetto', 'f-ladezeit', 'f-wltpReichweite'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updateFormCalc);
  });

  /* --- Formular absenden --- */
  document.getElementById('addCarForm').addEventListener('submit', e => {
    e.preventDefault();
    const form = e.target;

    // Pflichtfeld-Check
    if (!form.marke.value.trim())  { toast('Bitte Marke eingeben.',      'error'); return; }
    if (!form.modell.value.trim()) { toast('Bitte Modell eingeben.',     'error'); return; }
    if (!form.batterieNetto.value) { toast('Bitte Batterie Netto eingeben.', 'error'); return; }
    if (!form.ladezeit.value)      { toast('Bitte Ladezeit eingeben.',   'error'); return; }
    if (!form.wltpReichweite.value){ toast('Bitte WLTP Reichweite eingeben.', 'error'); return; }
    if (!form.basisPreis.value)    { toast('Bitte Basispreis eingeben.', 'error'); return; }

    const data = Object.fromEntries(new FormData(form));
    addCar(data);
    closeModal();
  });

  /* --- Lucide-Icons für statische Elemente --- */
  lucide.createIcons();

  /* --- Erstes Rendering --- */
  buildFilterPanel();
  refresh();
});


/* ==========================================================================
   BEISPIELDATEN (optional – wird beim ersten Laden angezeigt)
   Auskommentieren oder löschen, wenn du nur eigene CSV-Daten verwenden willst.
   ========================================================================== */

(function loadDemoData() {
  const demo = [
    { marke: 'Tesla',    modell: 'Model 3 LR RWD',    batterieNetto: 75,   ladezeit: 25, maxLadeleistung: 170, anhaengelast: null, wltpReichweite: 629, basisPreis: 42990, nullHundert: 5.8, psLeistung: 358, hoechstgeschwindigkeit: 201, voltArchitektur: 400, markteinfuehrung: '2024-Q1' },
    { marke: 'BYD',      modell: 'Seal AWD',           batterieNetto: 82.56,ladezeit: 30, maxLadeleistung: 150, anhaengelast: 750,  wltpReichweite: 520, basisPreis: 44990, nullHundert: 3.8, psLeistung: 530, hoechstgeschwindigkeit: 180, voltArchitektur: 800, markteinfuehrung: '2023-Q3' },
    { marke: 'Hyundai',  modell: 'IONIQ 6 AWD 77',     batterieNetto: 77.4, ladezeit: 18, maxLadeleistung: 230, anhaengelast: 1600, wltpReichweite: 519, basisPreis: 51900, nullHundert: 5.1, psLeistung: 325, hoechstgeschwindigkeit: 185, voltArchitektur: 800, markteinfuehrung: '2023-Q1' },
    { marke: 'Kia',      modell: 'EV6 GT',             batterieNetto: 77.4, ladezeit: 18, maxLadeleistung: 240, anhaengelast: 1600, wltpReichweite: 424, basisPreis: 64990, nullHundert: 3.4, psLeistung: 585, hoechstgeschwindigkeit: 260, voltArchitektur: 800, markteinfuehrung: '2022-Q4' },
    { marke: 'Mercedes', modell: 'EQS 450+',           batterieNetto: 107.8,ladezeit: 31, maxLadeleistung: 200, anhaengelast: 750,  wltpReichweite: 782, basisPreis: 109551,nullHundert: 6.2, psLeistung: 333, hoechstgeschwindigkeit: 210, voltArchitektur: 400, markteinfuehrung: '2022-Q2' },
    { marke: 'Porsche',  modell: 'Taycan Turbo S',     batterieNetto: 97,   ladezeit: 22, maxLadeleistung: 320, anhaengelast: 1000, wltpReichweite: 630, basisPreis: 190983,nullHundert: 2.4, psLeistung: 761, hoechstgeschwindigkeit: 260, voltArchitektur: 800, markteinfuehrung: '2024-Q1' },
    { marke: 'Volkswagen',modell: 'ID.7 Pro S',        batterieNetto: 86,   ladezeit: 28, maxLadeleistung: 200, anhaengelast: 1200, wltpReichweite: 709, basisPreis: 59995, nullHundert: 6.5, psLeistung: 286, hoechstgeschwindigkeit: 180, voltArchitektur: 400, markteinfuehrung: '2023-Q4' },
    { marke: 'BMW',      modell: 'i4 eDrive40',        batterieNetto: 83.9, ladezeit: 31, maxLadeleistung: 205, anhaengelast: 1600, wltpReichweite: 590, basisPreis: 59100, nullHundert: 5.7, psLeistung: 340, hoechstgeschwindigkeit: 190, voltArchitektur: 400, markteinfuehrung: '2022-Q1' },
  ];

  state.cars = demo.map(d => { d.id = uid(); return calcDerived(d); });
  computeBounds(state.cars);
})();

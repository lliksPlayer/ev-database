import { state, adminMode } from './state.js';
import { escapeHtml } from './render.js';
import { fmt } from './filter.js';
import { deleteCar, openEditModal, toast } from './ui.js';

// ── Felder für den Duplikat-Vergleich ────────────────────────────────────────
const DUP_FIELDS = [
  'batterieNetto', 'ladezeit', 'maxLadeleistung', 'wltpReichweite',
  'basisPreis', 'nullHundert', 'psLeistung', 'hoechstgeschwindigkeit',
  'voltArchitektur', 'anhaengelast',
];

const DUP_LABELS = {
  batterieNetto:          'Batterie Netto (kWh)',
  ladezeit:               'Ladezeit 10–80% (min)',
  maxLadeleistung:        'Max. Ladeleistung (kW)',
  anhaengelast:           'Anhängelast (kg)',
  wltpReichweite:         'WLTP Reichweite (km)',
  basisPreis:             'Basispreis (€)',
  nullHundert:            '0–100 km/h (s)',
  psLeistung:             'PS',
  hoechstgeschwindigkeit: 'Top Speed (km/h)',
  voltArchitektur:        'Volt-Architektur (V)',
};

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────

/** Relative Abweichung zweier Zahlen (0–1), null wenn Wert fehlt. */
function _relDiff(a, b) {
  if (a == null || b == null) return null;
  const na = Number(a), nb = Number(b);
  if (isNaN(na) || isNaN(nb)) return null;
  const mx = Math.max(Math.abs(na), Math.abs(nb));
  if (mx === 0) return 0;
  return Math.abs(na - nb) / mx;
}

/** Maximale relative Abweichung über alle gemeinsamen numerischen Felder. */
function _maxRelDiff(carA, carB) {
  let max = 0, hasAny = false;
  for (const key of DUP_FIELDS) {
    const d = _relDiff(carA[key], carB[key]);
    if (d !== null) { hasAny = true; max = Math.max(max, d); }
  }
  return hasAny ? max : null;
}

function _sameMarke(a, b)  { return (a.marke  || '').trim().toLowerCase() === (b.marke  || '').trim().toLowerCase(); }
function _sameModell(a, b) { return (a.modell || '').trim().toLowerCase() === (b.modell || '').trim().toLowerCase(); }

// ── Auto-Fix ─────────────────────────────────────────────────────────────────

/**
 * Entfernt exakte Duplikate (gleiche Marke+Modell) bei denen alle
 * numerischen Werte ≤10% voneinander abweichen.
 * Gibt die Anzahl entfernter Autos zurück.
 */
export function autoFixDuplicates() {
  const cars = state.cars;
  const toDelete = new Set();
  const checked  = new Set();

  for (let i = 0; i < cars.length; i++) {
    for (let j = i + 1; j < cars.length; j++) {
      const a = cars[i], b = cars[j];
      if (toDelete.has(a.id) || toDelete.has(b.id)) continue;
      const pairKey = [a.id, b.id].sort().join('|');
      if (checked.has(pairKey)) continue;
      checked.add(pairKey);

      if (!_sameMarke(a, b) || !_sameModell(a, b)) continue;

      const diff = _maxRelDiff(a, b);
      if (diff !== null && diff <= 0.10) {
        toDelete.add(b.id); // jüngeres (höherer Index) entfernen
      }
    }
  }

  if (toDelete.size > 0) {
    state.cars = state.cars.filter(c => !toDelete.has(c.id));
  }
  return toDelete.size;
}

// ── Scan (nur lesen, kein Löschen) ───────────────────────────────────────────

/**
 * Scannt state.cars nach:
 *  - conflicts: gleiche Marke+Modell, Abweichung >10%  → Admin entscheidet
 *  - similar:   gleiche Marke, anderer Modellname, ≤5% → Warnung
 */
export function scanDuplicates() {
  const cars = state.cars;
  const conflicts = [], similar = [], seen = new Set();

  for (let i = 0; i < cars.length; i++) {
    for (let j = i + 1; j < cars.length; j++) {
      const a = cars[i], b = cars[j];
      const pairKey = [a.id, b.id].sort().join('|');
      if (seen.has(pairKey)) continue;
      seen.add(pairKey);

      const sm = _sameMarke(a, b);
      const sd = _sameModell(a, b);
      const diff = _maxRelDiff(a, b);
      if (diff === null) continue;

      if (sm && sd && diff > 0.10) {
        conflicts.push({ carA: a, carB: b, maxDiff: diff });
      } else if (sm && !sd && diff <= 0.05) {
        similar.push({ carA: a, carB: b, maxDiff: diff });
      }
    }
  }
  return { conflicts, similar };
}

// ── Panel-Rendering ───────────────────────────────────────────────────────────

export function renderDuplicatePanel() {
  const panel = document.getElementById('duplicatePanel');
  if (!panel) return;

  if (!adminMode) { panel.classList.add('hidden'); return; }

  const { conflicts, similar } = scanDuplicates();

  if (conflicts.length === 0 && similar.length === 0) {
    panel.classList.add('hidden');
    return;
  }
  panel.classList.remove('hidden');

  let html = `
  <section class="max-w-[1400px] mx-auto px-4 sm:px-6 pb-6">
    <div class="rounded-2xl border border-violet-200 bg-white shadow-sm overflow-hidden">

      <!-- Header -->
      <div class="px-5 py-4 bg-violet-50 border-b border-violet-200 flex items-center gap-3">
        <div class="w-8 h-8 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-center flex-shrink-0">
          <i data-lucide="shield-alert" class="w-4 h-4 text-violet-600"></i>
        </div>
        <div>
          <h2 class="text-sm font-black text-violet-900 tracking-tight">Duplikat-Prüfung</h2>
          <p class="text-xs text-violet-500">Admin-Bereich – verdächtige Fahrzeugeinträge</p>
        </div>
      </div>

      <div class="p-5 space-y-6">`;

  // ── Konflikte (>10 %, gleicher Name) ────────────────────────────────────
  if (conflicts.length > 0) {
    html += `
      <div>
        <p class="text-xs font-bold text-red-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <i data-lucide="x-circle" class="w-3.5 h-3.5"></i>
          Gleicher Name – Daten weichen &gt;10 % ab – bitte eines löschen
        </p>
        <div class="space-y-4">`;

    for (const { carA, carB, maxDiff } of conflicts) {
      html += `
          <div class="rounded-xl border border-red-200 bg-red-50/20 overflow-hidden">
            <div class="px-4 py-2.5 bg-red-50 border-b border-red-200 flex items-center gap-2">
              <i data-lucide="git-compare" class="w-4 h-4 text-red-500 flex-shrink-0"></i>
              <p class="text-sm font-bold text-red-700">
                ${escapeHtml(carA.marke)} ${escapeHtml(carA.modell)}
                <span class="ml-2 text-xs font-normal text-red-400">Max. Abweichung: ${(maxDiff * 100).toFixed(1)} %</span>
              </p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-red-100">
              ${_dupCardHtml(carA, 'red')}
              ${_dupCardHtml(carB, 'red')}
            </div>
          </div>`;
    }
    html += `</div></div>`;
  }

  // ── Ähnlichkeitswarnungen (gleiche Marke, anderes Modell, ≤5 %) ─────────
  if (similar.length > 0) {
    html += `
      <div>
        <p class="text-xs font-bold text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <i data-lucide="alert-triangle" class="w-3.5 h-3.5"></i>
          Gleiche Marke – sehr ähnliche Daten (≤5 %) – möglicherweise falscher Modellname
        </p>
        <div class="space-y-4">`;

    for (const { carA, carB, maxDiff } of similar) {
      html += `
          <div class="rounded-xl border border-amber-200 bg-amber-50/20 overflow-hidden">
            <div class="px-4 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
              <i data-lucide="info" class="w-4 h-4 text-amber-500 flex-shrink-0"></i>
              <p class="text-sm font-bold text-amber-700">
                Marke: ${escapeHtml(carA.marke)}
                <span class="ml-2 text-xs font-normal text-amber-500">Daten-Abweichung ≤ ${(maxDiff * 100).toFixed(1)} % – unterschiedliche Modellnamen</span>
              </p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-amber-100">
              ${_dupCardHtml(carA, 'amber')}
              ${_dupCardHtml(carB, 'amber')}
            </div>
          </div>`;
    }
    html += `</div></div>`;
  }

  html += `</div></div></section>`;
  panel.innerHTML = html;
  lucide.createIcons();

  // Delete-Buttons
  panel.querySelectorAll('[data-dup-delete]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.dupDelete;
      const car = state.cars.find(c => c.id === id);
      if (!car) return;
      const name = `${car.marke} ${car.modell}`;
      deleteCar(id);       // saveCars + refresh inside
      toast(`${name} entfernt`, 'success');
    });
  });

  // Edit-Buttons
  panel.querySelectorAll('[data-dup-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      const car = state.cars.find(c => c.id === btn.dataset.dupEdit);
      if (car) openEditModal(car);
    });
  });
}

/** HTML einer einzelnen Fahrzeugkarte im Vergleich. */
function _dupCardHtml(car, color) {
  const delCls = color === 'red'
    ? 'border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300'
    : 'border-amber-200 text-amber-600 hover:bg-amber-100 hover:border-amber-300';

  const rows = DUP_FIELDS
    .filter(k => car[k] != null && !isNaN(Number(car[k])))
    .map(k => `
      <tr class="border-b border-gray-100 last:border-0">
        <td class="py-1.5 pr-4 text-xs text-gray-500 whitespace-nowrap">${DUP_LABELS[k] || k}</td>
        <td class="py-1.5 text-xs font-bold text-gray-800 text-right tabular-nums">${fmt(Number(car[k]), k)}</td>
      </tr>`).join('');

  return `
    <div class="p-4 flex flex-col gap-3">
      <div>
        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Fahrzeug</p>
        <p class="text-base font-black text-gray-900">${escapeHtml(car.marke)} ${escapeHtml(car.modell)}</p>
        <p class="text-xs text-gray-400 mt-0.5">
          ID: ${escapeHtml(String(car.id))}${car.markteinfuehrung ? ' · ' + escapeHtml(String(car.markteinfuehrung)) : ''}
        </p>
      </div>
      ${rows
        ? `<table class="w-full"><tbody>${rows}</tbody></table>`
        : '<p class="text-xs text-gray-400 italic">Keine numerischen Daten vorhanden</p>'}
      <div class="flex gap-2 pt-1">
        <button class="flex-1 h-8 text-xs font-medium rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-colors flex items-center justify-center gap-1.5"
                data-dup-edit="${escapeHtml(String(car.id))}">
          <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
          Bearbeiten
        </button>
        <button class="flex-1 h-8 text-xs font-medium rounded-lg border transition-colors flex items-center justify-center gap-1.5 ${delCls}"
                data-dup-delete="${escapeHtml(String(car.id))}">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          Löschen
        </button>
      </div>
    </div>`;
}

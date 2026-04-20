import { state, editCarId, setEditCarId, round2 } from './state.js';
import { TRACKED_FIELDS } from './config.js';
import { applyFiltersAndSort, FMT_DE } from './filter.js';
import { renderHighlights, renderCards } from './render.js';
import { refreshTCOCarSelects } from './tco.js';
import { renderDuplicatePanel } from './duplicates.js';
import { deleteCarFromCloud } from './firebase-db.js';
import { toast } from './toast.js';

export { toast } from './toast.js';

// ── Haupt-Render-Funktion ────────────────────────────────────────────────────
export function refresh() {
  applyFiltersAndSort();
  renderHighlights();
  renderCards();
  if (typeof refreshTCOCarSelects === 'function') refreshTCOCarSelects();
  renderDuplicatePanel();
  refreshIncompleteWidget();
}

// ── Formular-Livekalkulation ──────────────────────────────────────────────────
export function updateFormCalc() {
  const bn  = parseFloat(document.getElementById('f-batterieNetto').value);
  const lz  = parseFloat(document.getElementById('f-ladezeit').value);
  const rei = parseFloat(document.getElementById('f-wltpReichweite').value);
  const ge  = bn  > 0             ? round2(bn * 0.7)           : null;
  const ls  = ge  > 0 && lz > 0   ? round2(ge / lz)            : null;
  const ver = bn  > 0 && rei > 0   ? round2((bn / rei) * 100)   : null;
  document.getElementById('c-geladeneEnergie').textContent = ge  != null ? FMT_DE.format(ge)  + ' kWh'       : '–';
  document.getElementById('c-ladespeed').textContent       = ls  != null ? FMT_DE.format(ls)  + ' kWh/min'   : '–';
  document.getElementById('c-verbrauch').textContent       = ver != null ? FMT_DE.format(ver) + ' kWh/100km' : '–';
}

// ── Modal ────────────────────────────────────────────────────────────────────
export function openModal() {
  const overlay = document.getElementById('addCarModal');
  overlay.classList.add('is-open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('f-marke')?.focus(), 100);
}

export function closeModal() {
  setEditCarId(null);
  document.getElementById('modalTitle').textContent     = 'Neues Auto hinzufügen';
  document.getElementById('modalSubmitBtn').textContent = 'Auto speichern';
  const overlay = document.getElementById('addCarModal');
  overlay.classList.remove('is-open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  document.getElementById('addCarForm').reset();
  updateFormCalc();
}

export function openEditModal(car) {
  setEditCarId(car.id);
  const f = document.getElementById('addCarForm');
  f.marke.value                     = car.marke                    || '';
  f.modell.value                    = car.modell                   || '';
  f.markteinfuehrung.value          = car.markteinfuehrung         || '';
  f.batterieNetto.value             = car.batterieNetto            ?? '';
  f.ladezeit.value                  = car.ladezeit                 ?? '';
  f.maxLadeleistung.value           = car.maxLadeleistung          ?? '';
  f.voltArchitektur.value           = car.voltArchitektur          ?? '';
  f.wltpReichweite.value            = car.wltpReichweite           ?? '';
  f.nullHundert.value               = car.nullHundert              ?? '';
  f.psLeistung.value                = car.psLeistung               ?? '';
  f.hoechstgeschwindigkeit.value    = car.hoechstgeschwindigkeit   ?? '';
  f.anhaengelast.value              = car.anhaengelast             ?? '';
  f.basisPreis.value                = car.basisPreis               ?? '';
  document.getElementById('modalTitle').textContent     = 'Auto bearbeiten';
  document.getElementById('modalSubmitBtn').textContent = 'Änderungen speichern';
  updateFormCalc();
  openModal();
}

// ── Filter-Panel ─────────────────────────────────────────────────────────────
export function toggleFilter() {
  const panel  = document.getElementById('filterPanel');
  const btn    = document.getElementById('filterToggle');
  const isOpen = panel.classList.toggle('is-open');
  btn.setAttribute('aria-expanded', isOpen);
  panel.setAttribute('aria-hidden', !isOpen);
}

// ── Ansichtsgröße ────────────────────────────────────────────────────────────
export const VIEW_GRID = {
  large:  'grid grid-cols-1 md:grid-cols-2 gap-5',
  medium: 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5',
  small:  'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4',
};
export const BTN_ON  = 'view-btn h-8 w-8 flex items-center justify-center text-teal-600 bg-teal-50 border border-teal-300 rounded-lg transition-colors';
export const BTN_OFF = 'view-btn h-8 w-8 flex items-center justify-center text-gray-500 bg-gray-50 border border-gray-200 rounded-lg hover:text-gray-800 hover:border-gray-300 transition-colors';

export function setView(size) {
  state.viewSize = size;
  document.getElementById('carsGrid').className = VIEW_GRID[size] ?? VIEW_GRID.medium;
  document.querySelectorAll('.view-btn').forEach(btn => {
    const on = btn.dataset.view === size;
    btn.className = on ? BTN_ON : BTN_OFF;
    btn.setAttribute('aria-pressed', on);
  });
}

// ── Sortier-UI ───────────────────────────────────────────────────────────────
export function updateSortUI() {
  const btn = document.getElementById('sortDirBtn');
  btn.classList.toggle('desc', state.sortDir === 'desc');
  btn.title = state.sortDir === 'desc'
    ? 'Absteigend (klicken für aufsteigend)'
    : 'Aufsteigend (klicken für absteigend)';
}

// ── Incomplete-Widget ─────────────────────────────────────────────────────────
export function countMissingFields(car) {
  return TRACKED_FIELDS.filter(f => car[f] == null || car[f] === '').length;
}

export function getIncompleteCars(limit) {
  return (state.cars || []).filter(car => countMissingFields(car) > limit);
}

export function refreshIncompleteWidget() {
  const input  = document.getElementById('incompleteLimitInput');
  const badge  = document.getElementById('incompleteCount');
  const btn    = document.getElementById('incompleteDeleteBtn');
  if (!input || !badge || !btn) return;

  const limit = parseInt(input.value, 10);
  const count = getIncompleteCars(limit).length;

  badge.textContent = count;
  badge.className   = count > 0
    ? 'min-w-[1.5rem] h-6 px-1.5 flex items-center justify-center text-xs font-black rounded-full bg-red-100 text-red-700'
    : 'min-w-[1.5rem] h-6 px-1.5 flex items-center justify-center text-xs font-black rounded-full bg-gray-100 text-gray-400';

  btn.disabled = count === 0;
  btn.title    = count > 0
    ? `${count} Fahrzeug${count !== 1 ? 'e' : ''} mit mehr als ${limit} fehlenden Daten löschen`
    : 'Keine Fahrzeuge gefunden';
}

export async function deleteIncompleteCars(limit) {
  const targets = getIncompleteCars(limit);
  if (targets.length === 0) return;

  const confirmed = confirm(
    `${targets.length} Fahrzeug${targets.length !== 1 ? 'e' : ''} mit mehr als ${limit} fehlenden Daten werden unwiderruflich gelöscht:\n\n` +
    targets.map(c => `• ${c.marke} ${c.modell} (${countMissingFields(c)} fehlend)`).join('\n') +
    '\n\nFortfahren?'
  );
  if (!confirmed) return;

  for (const car of targets) {
    await deleteCarFromCloud(car.id);
  }
  toast(`${targets.length} unvollständige${targets.length !== 1 ? ' Fahrzeuge' : 's Fahrzeug'} gelöscht`, 'success');
}

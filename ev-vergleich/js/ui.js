import { state, adminMode, editCarId, setAdminMode, setEditCarId, round2 } from './state.js';
import { TRACKED_FIELDS, ADMIN_PASSWORD } from './config.js';
import { applyFiltersAndSort, FMT_DE } from './filter.js';
import { renderHighlights, renderCards, escapeHtml } from './render.js';
import { refreshTCOCarSelects } from './tco.js';
import { renderDuplicatePanel } from './duplicates.js';
import { parseCSV } from './csv.js';
import { saveCarToCloud, updateCarInCloud, deleteCarFromCloud } from './firebase-db.js';

// ── Haupt-Render-Funktion ────────────────────────────────────────────────────
export function refresh() {
  applyFiltersAndSort();
  renderHighlights();
  renderCards();
  if (typeof refreshTCOCarSelects === 'function') refreshTCOCarSelects();
  renderDuplicatePanel();
  refreshIncompleteWidget();
}

// ── Autos hinzufügen / löschen ───────────────────────────────────────────────
export function addCar(formData) {
  const num = (k) => { const v = parseFloat(formData[k]); return isNaN(v) ? null : v; };
  const car = {
    marke:                 (formData.marke  || '').trim(),
    modell:                (formData.modell || '').trim(),
    markteinfuehrung:      (formData.markteinfuehrung || '').trim() || null,
    batterieNetto:         num('batterieNetto'),
    ladezeit:              num('ladezeit'),
    maxLadeleistung:       num('maxLadeleistung'),
    anhaengelast:          num('anhaengelast'),
    wltpReichweite:        num('wltpReichweite'),
    basisPreis:            num('basisPreis'),
    nullHundert:           num('nullHundert'),
    psLeistung:            num('psLeistung'),
    hoechstgeschwindigkeit:num('hoechstgeschwindigkeit'),
    voltArchitektur:       num('voltArchitektur'),
  };

  // Duplikat-Prüfung gegen den aktuellen lokalen Stand
  const isDuplicate = state.cars.some(c =>
    (c.marke  || '').trim().toLowerCase() === car.marke.toLowerCase() &&
    (c.modell || '').trim().toLowerCase() === car.modell.toLowerCase()
  );
  if (isDuplicate) {
    toast(`${car.marke} ${car.modell} ist bereits vorhanden und wurde nicht hinzugefügt.`, 'info');
    return;
  }

  // In Firestore speichern – onSnapshot aktualisiert state und UI automatisch
  saveCarToCloud(car);
  toast(`${car.marke} ${car.modell} hinzugefügt`, 'success');
}

export function deleteCar(id) {
  const car = state.cars.find(c => c.id === id);
  if (!car) return;
  // In Firestore löschen – onSnapshot aktualisiert state und UI automatisch
  deleteCarFromCloud(id);
  toast(`${car.marke} ${car.modell} entfernt`);
}

// ── CSV laden ────────────────────────────────────────────────────────────────
export function loadCSVFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const newCars = parseCSV(e.target.result);
      if (newCars.length === 0) throw new Error('Keine Datensätze in der CSV gefunden.');

      // Bestehende Autos beibehalten – nur neue Einträge in Firestore schreiben
      let added = 0;
      for (const car of newCars) {
        const exists = state.cars.some(c =>
          (c.marke  || '').trim().toLowerCase() === (car.marke  || '').trim().toLowerCase() &&
          (c.modell || '').trim().toLowerCase() === (car.modell || '').trim().toLowerCase()
        );
        if (!exists) {
          saveCarToCloud(car); // onSnapshot aktualisiert state und UI automatisch
          added++;
        }
      }

      state.filters = {};
      const skipped = newCars.length - added;
      let msg = `${added} neue${added !== 1 ? ' Autos' : 's Auto'} aus CSV hochgeladen`;
      if (skipped > 0) msg += ` (${skipped} bereits vorhanden, übersprungen)`;
      toast(msg, 'success');
    } catch (err) {
      toast('Fehler beim Laden: ' + err.message, 'error');
      console.error(err);
    }
  };
  reader.onerror = () => toast('Datei konnte nicht gelesen werden.', 'error');
  reader.readAsText(file, 'UTF-8');
}

// ── Verbrenner CSV laden (für TCO-Rechner) ────────────────────────────────────
/**
 * Parst eine ICE-CSV und speichert das Ergebnis in state.iceCars.
 * Lädt die Daten NICHT in Firestore – nur lokale Nutzung im TCO-Rechner.
 */
export function loadIceCSVFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const newCars = parseIceCSV(e.target.result);
      if (newCars.length === 0) throw new Error('Keine Datensätze in der CSV gefunden.');
      state.iceCars = newCars;
      if (typeof refreshTCOCarSelects === 'function') refreshTCOCarSelects();
      toast(`${newCars.length} Verbrenner importiert – jetzt im TCO-Rechner auswählbar`, 'success');
    } catch (err) {
      toast('Fehler beim Laden: ' + err.message, 'error');
      console.error(err);
    }
  };
  reader.onerror = () => toast('Datei konnte nicht gelesen werden.', 'error');
  reader.readAsText(file, 'UTF-8');
}

// ── Toast ────────────────────────────────────────────────────────────────────
export function toast(msg, type = 'info') {
  const border = type === 'success' ? 'border-teal-200'  : type === 'error' ? 'border-red-200'  : 'border-gray-200';
  const dot    = type === 'success' ? 'bg-teal-500'      : type === 'error' ? 'bg-red-500'      : 'bg-gray-400';
  const el = document.createElement('div');
  el.className = `toast-anim pointer-events-auto flex items-center gap-3 px-4 py-2.5 bg-white border ${border} rounded-xl text-sm text-gray-800 shadow-lg`;
  el.innerHTML = `<span class="w-2 h-2 rounded-full flex-shrink-0 ${dot}"></span>${escapeHtml(msg)}`;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 3500);
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

export function updateCar(id, formData) {
  const num = k => { const v = parseFloat(formData[k]); return isNaN(v) ? null : v; };
  const updates = {
    marke:                 (formData.marke  || '').trim(),
    modell:                (formData.modell || '').trim(),
    markteinfuehrung:      (formData.markteinfuehrung || '').trim() || null,
    batterieNetto:         num('batterieNetto'),
    ladezeit:              num('ladezeit'),
    maxLadeleistung:       num('maxLadeleistung'),
    anhaengelast:          num('anhaengelast'),
    wltpReichweite:        num('wltpReichweite'),
    basisPreis:            num('basisPreis'),
    nullHundert:           num('nullHundert'),
    psLeistung:            num('psLeistung'),
    hoechstgeschwindigkeit:num('hoechstgeschwindigkeit'),
    voltArchitektur:       num('voltArchitektur'),
  };
  // In Firestore aktualisieren – onSnapshot aktualisiert state und UI automatisch
  updateCarInCloud(id, updates);
  toast(`${updates.marke} ${updates.modell} aktualisiert`, 'success');
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

// ── Admin-Modus ───────────────────────────────────────────────────────────────

/** Zeigt/versteckt alle [data-admin-only] und .admin-element Elemente und aktualisiert den Admin-Button. */
export function updateAdminUI() {
  // Admin-Bar ein-/ausblenden + Body-Padding anpassen
  const adminBar = document.getElementById('adminBar');
  if (adminBar) {
    if (adminMode) {
      adminBar.classList.remove('hidden');
      document.body.style.paddingTop = '100px'; // 56px Header + 44px Admin-Bar
    } else {
      adminBar.classList.add('hidden');
      document.body.style.paddingTop = '56px';
    }
  }

  // Alle anderen [data-admin-only] und .admin-element Elemente (Karten-Buttons, Header-Buttons etc.)
  document.querySelectorAll('[data-admin-only], .admin-element').forEach(el => {
    if (el.id === 'adminBar') return; // bereits oben behandelt
    if (adminMode) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });

  const btn = document.getElementById('adminBtn');
  if (!btn) return;
  if (adminMode) {
    btn.innerHTML = `<i data-lucide="lock-open" class="w-4 h-4"></i><span class="hidden sm:inline">Admin</span>`;
    btn.className = 'h-8 px-3 flex items-center gap-1.5 text-sm font-medium text-violet-700 bg-violet-50 border border-violet-300 rounded-lg hover:bg-violet-100 transition-colors';
    btn.title = 'Admin-Modus aktiv – klicken zum Abmelden';
  } else {
    btn.innerHTML = `<i data-lucide="lock" class="w-4 h-4"></i><span class="hidden sm:inline">Admin</span>`;
    btn.className = 'h-8 px-3 flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:text-gray-900 hover:border-gray-300 transition-colors';
    btn.title = 'Als Admin anmelden';
  }
  lucide.createIcons();
  renderDuplicatePanel();
}

export function openAdminLogin() {
  const modal = document.getElementById('adminLoginModal');
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('adminPasswordInput')?.focus(), 100);
}

export function closeAdminLogin() {
  const modal = document.getElementById('adminLoginModal');
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  document.getElementById('adminPasswordInput').value = '';
  document.getElementById('adminLoginError').classList.add('hidden');
}

export function submitAdminLogin() {
  const pw = document.getElementById('adminPasswordInput').value;
  if (pw === ADMIN_PASSWORD) {
    setAdminMode(true);
    closeAdminLogin();
    updateAdminUI();
    refresh();
    toast('Admin-Modus aktiviert', 'success');
  } else {
    document.getElementById('adminLoginError').classList.remove('hidden');
    document.getElementById('adminPasswordInput').value = '';
    document.getElementById('adminPasswordInput').focus();
  }
}

export function logoutAdmin() {
  setAdminMode(false);
  updateAdminUI();
  refresh();
  toast('Admin-Modus beendet');
}

// ── Incomplete-Widget ─────────────────────────────────────────────────────────

/** Zählt fehlende Felder eines einzelnen Autos (anhand TRACKED_FIELDS). */
export function countMissingFields(car) {
  return TRACKED_FIELDS.filter(f => car[f] == null || car[f] === '').length;
}

/** Gibt alle Autos zurück, bei denen mehr als `limit` Felder fehlen. */
export function getIncompleteCars(limit) {
  return (state.cars || []).filter(car => countMissingFields(car) > limit);
}

/** Aktualisiert Badge und Button-Zustand des Incomplete-Widgets. */
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

/** Löscht alle Autos mit mehr als `limit` fehlenden Feldern. */
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

// ── Sortier-UI ───────────────────────────────────────────────────────────────
export function updateSortUI() {
  const btn = document.getElementById('sortDirBtn');
  btn.classList.toggle('desc', state.sortDir === 'desc');
  btn.title = state.sortDir === 'desc'
    ? 'Absteigend (klicken für aufsteigend)'
    : 'Aufsteigend (klicken für absteigend)';
}
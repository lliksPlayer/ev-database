'use strict';

// ── Haupt-Render-Funktion ────────────────────────────────────────────────────
function refresh() {
  applyFiltersAndSort();
  renderHighlights();
  renderCards();
  if (typeof refreshTCOCarSelects === 'function') refreshTCOCarSelects();
  renderDuplicatePanel();
}

// ── Autos hinzufügen / löschen ───────────────────────────────────────────────
function addCar(formData) {
  const num = (k) => { const v = parseFloat(formData[k]); return isNaN(v) ? null : v; };
  const car = {
    id: uid(),
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
  calcDerived(car);
  state.cars.push(car);
  const removed = autoFixDuplicates();
  const carAdded = state.cars.some(c => c.id === car.id);
  computeBounds(state.cars);
  saveCars();
  buildFilterPanel();
  refresh();
  if (carAdded) {
    toast(`${car.marke} ${car.modell} hinzugefügt`, 'success');
    if (removed > 0) toast(`${removed} nahezu identisches Duplikat${removed !== 1 ? 'e' : ''} automatisch entfernt`, 'info');
  } else {
    toast(`${car.marke} ${car.modell} ist fast identisch mit einem vorhandenen Eintrag und wurde nicht hinzugefügt`, 'info');
  }
}

function deleteCar(id) {
  const idx = state.cars.findIndex(c => c.id === id);
  if (idx === -1) return;
  const removed = state.cars.splice(idx, 1)[0];
  computeBounds(state.cars);
  saveCars();
  buildFilterPanel();
  refresh();
  toast(`${removed.marke} ${removed.modell} entfernt`);
}

// ── CSV laden ────────────────────────────────────────────────────────────────
function loadCSVFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const newCars = parseCSV(e.target.result);
      if (newCars.length === 0) throw new Error('Keine Datensätze in der CSV gefunden.');

      // Bestehende Autos beibehalten – nur neue Einträge hinzufügen
      let added = 0;
      for (const car of newCars) {
        const exists = state.cars.some(c =>
          (c.marke  || '').trim().toLowerCase() === (car.marke  || '').trim().toLowerCase() &&
          (c.modell || '').trim().toLowerCase() === (car.modell || '').trim().toLowerCase()
        );
        if (!exists) { state.cars.push(car); added++; }
      }

      const removed = autoFixDuplicates();
      state.filters = {};
      computeBounds(state.cars);
      saveCars();
      buildFilterPanel();
      refresh();
      const skipped = newCars.length - added;
      let msg = `${added} neue${added !== 1 ? ' Autos' : 's Auto'} aus CSV hinzugefügt`;
      if (skipped > 0) msg += ` (${skipped} bereits vorhanden, übersprungen)`;
      if (removed > 0) msg += ` · ${removed} Duplikat${removed !== 1 ? 'e' : ''} automatisch entfernt`;
      toast(msg, 'success');
    } catch (err) {
      toast('Fehler beim Laden: ' + err.message, 'error');
      console.error(err);
    }
  };
  reader.onerror = () => toast('Datei konnte nicht gelesen werden.', 'error');
  reader.readAsText(file, 'UTF-8');
}

// ── Toast ────────────────────────────────────────────────────────────────────
function toast(msg, type = 'info') {
  const border = type === 'success' ? 'border-teal-200'  : type === 'error' ? 'border-red-200'  : 'border-gray-200';
  const dot    = type === 'success' ? 'bg-teal-500'      : type === 'error' ? 'bg-red-500'      : 'bg-gray-400';
  const el = document.createElement('div');
  el.className = `toast-anim pointer-events-auto flex items-center gap-3 px-4 py-2.5 bg-white border ${border} rounded-xl text-sm text-gray-800 shadow-lg`;
  el.innerHTML = `<span class="w-2 h-2 rounded-full flex-shrink-0 ${dot}"></span>${escapeHtml(msg)}`;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ── Formular-Livekalkulation ──────────────────────────────────────────────────
function updateFormCalc() {
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
function openModal() {
  const overlay = document.getElementById('addCarModal');
  overlay.classList.add('is-open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('f-marke')?.focus(), 100);
}

function closeModal() {
  editCarId = null;
  document.getElementById('modalTitle').textContent     = 'Neues Auto hinzufügen';
  document.getElementById('modalSubmitBtn').textContent = 'Auto speichern';
  const overlay = document.getElementById('addCarModal');
  overlay.classList.remove('is-open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  document.getElementById('addCarForm').reset();
  updateFormCalc();
}

function openEditModal(car) {
  editCarId = car.id;
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

function updateCar(id, formData) {
  const idx = state.cars.findIndex(c => c.id === id);
  if (idx === -1) return;
  const num = k => { const v = parseFloat(formData[k]); return isNaN(v) ? null : v; };
  const car = state.cars[idx];
  car.marke                  = (formData.marke  || '').trim();
  car.modell                 = (formData.modell || '').trim();
  car.markteinfuehrung       = (formData.markteinfuehrung || '').trim() || null;
  car.batterieNetto          = num('batterieNetto');
  car.ladezeit               = num('ladezeit');
  car.maxLadeleistung        = num('maxLadeleistung');
  car.anhaengelast           = num('anhaengelast');
  car.wltpReichweite         = num('wltpReichweite');
  car.basisPreis             = num('basisPreis');
  car.nullHundert            = num('nullHundert');
  car.psLeistung             = num('psLeistung');
  car.hoechstgeschwindigkeit = num('hoechstgeschwindigkeit');
  car.voltArchitektur        = num('voltArchitektur');
  calcDerived(car);
  autoFixDuplicates(); // Prüft ob Bearbeitung ein neues Duplikat erzeugt hat
  computeBounds(state.cars);
  saveCars();
  buildFilterPanel();
  refresh();
  toast(`${car.marke} ${car.modell} aktualisiert`, 'success');
}

// ── Filter-Panel ─────────────────────────────────────────────────────────────
function toggleFilter() {
  const panel  = document.getElementById('filterPanel');
  const btn    = document.getElementById('filterToggle');
  const isOpen = panel.classList.toggle('is-open');
  btn.setAttribute('aria-expanded', isOpen);
  panel.setAttribute('aria-hidden', !isOpen);
}

// ── Ansichtsgröße ────────────────────────────────────────────────────────────
const VIEW_GRID = {
  large:  'grid grid-cols-1 md:grid-cols-2 gap-5',
  medium: 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5',
  small:  'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4',
};
const BTN_ON  = 'view-btn h-8 w-8 flex items-center justify-center text-teal-600 bg-teal-50 border border-teal-300 rounded-lg transition-colors';
const BTN_OFF = 'view-btn h-8 w-8 flex items-center justify-center text-gray-500 bg-gray-50 border border-gray-200 rounded-lg hover:text-gray-800 hover:border-gray-300 transition-colors';

function setView(size) {
  state.viewSize = size;
  document.getElementById('carsGrid').className = VIEW_GRID[size] ?? VIEW_GRID.medium;
  document.querySelectorAll('.view-btn').forEach(btn => {
    const on = btn.dataset.view === size;
    btn.className = on ? BTN_ON : BTN_OFF;
    btn.setAttribute('aria-pressed', on);
  });
}

// ── Admin-Modus ───────────────────────────────────────────────────────────────

/** Zeigt/versteckt alle [data-admin-only]-Elemente und aktualisiert den Admin-Button. */
function updateAdminUI() {
  document.querySelectorAll('[data-admin-only]').forEach(el => {
    el.classList.toggle('hidden', !adminMode);
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

function openAdminLogin() {
  const modal = document.getElementById('adminLoginModal');
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('adminPasswordInput')?.focus(), 100);
}

function closeAdminLogin() {
  const modal = document.getElementById('adminLoginModal');
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  document.getElementById('adminPasswordInput').value = '';
  document.getElementById('adminLoginError').classList.add('hidden');
}

function submitAdminLogin() {
  const pw = document.getElementById('adminPasswordInput').value;
  if (pw === ADMIN_PASSWORD) {
    adminMode = true;
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

function logoutAdmin() {
  adminMode = false;
  updateAdminUI();
  refresh();
  toast('Admin-Modus beendet');
}

// ── Sortier-UI ───────────────────────────────────────────────────────────────
function updateSortUI() {
  const btn = document.getElementById('sortDirBtn');
  btn.classList.toggle('desc', state.sortDir === 'desc');
  btn.title = state.sortDir === 'desc'
    ? 'Absteigend (klicken für aufsteigend)'
    : 'Aufsteigend (klicken für absteigend)';
}

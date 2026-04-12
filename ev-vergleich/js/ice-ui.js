'use strict';

// ── Haupt-Render-Funktion ─────────────────────────────────────────────────────
function refresh() {
  applyFiltersAndSort();
  renderHighlights();
  renderCards();
  if (typeof buildFilterPanel === 'function') buildFilterPanel();
}

// ── Fahrzeug hinzufügen / löschen ─────────────────────────────────────────────
function addCar(formData) {
  const num = (k) => { const v = parseFloat(formData[k]); return isNaN(v) ? null : v; };
  const car = {
    marke:                  (formData.marke  || '').trim(),
    modell:                 (formData.modell || '').trim(),
    markteinfuehrung:       (formData.markteinfuehrung || '').trim() || null,
    kraftstoffart:          (formData.kraftstoffart || '').trim() || null,
    tankinhalt:             num('tankinhalt'),
    verbrauch:              num('verbrauch'),
    anhaengelast:           num('anhaengelast'),
    basisPreis:             num('basisPreis'),
    nullHundert:            num('nullHundert'),
    psLeistung:             num('psLeistung'),
    hoechstgeschwindigkeit: num('hoechstgeschwindigkeit'),
    bordnetzspannung:       num('bordnetzspannung'),
  };

  const isDuplicate = state.cars.some(c =>
    (c.marke  || '').trim().toLowerCase() === car.marke.toLowerCase() &&
    (c.modell || '').trim().toLowerCase() === car.modell.toLowerCase()
  );
  if (isDuplicate) {
    toast(`${car.marke} ${car.modell} ist bereits vorhanden.`, 'info');
    return;
  }

  calcDerived(car);
  saveIceCarToCloud(car);
  toast(`${car.marke} ${car.modell} hinzugefügt`, 'success');
}

function deleteCar(id) {
  const car = state.cars.find(c => c.id === id);
  if (!car) return;
  deleteIceCarFromCloud(id);
  toast(`${car.marke} ${car.modell} entfernt`);
}

function updateCar(id, formData) {
  const num = k => { const v = parseFloat(formData[k]); return isNaN(v) ? null : v; };
  const updates = {
    marke:                  (formData.marke  || '').trim(),
    modell:                 (formData.modell || '').trim(),
    markteinfuehrung:       (formData.markteinfuehrung || '').trim() || null,
    kraftstoffart:          (formData.kraftstoffart || '').trim() || null,
    tankinhalt:             num('tankinhalt'),
    verbrauch:              num('verbrauch'),
    anhaengelast:           num('anhaengelast'),
    basisPreis:             num('basisPreis'),
    nullHundert:            num('nullHundert'),
    psLeistung:             num('psLeistung'),
    hoechstgeschwindigkeit: num('hoechstgeschwindigkeit'),
    bordnetzspannung:       num('bordnetzspannung'),
  };
  updateIceCarInCloud(id, updates);
  toast(`${updates.marke} ${updates.modell} aktualisiert`, 'success');
}

// ── CSV laden ─────────────────────────────────────────────────────────────────
function loadIceCSVFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const newCars = parseIceCSV(e.target.result);
      if (newCars.length === 0) throw new Error('Keine Datensätze in der CSV gefunden.');

      let added = 0;
      for (const car of newCars) {
        const exists = state.cars.some(c =>
          (c.marke  || '').trim().toLowerCase() === (car.marke  || '').trim().toLowerCase() &&
          (c.modell || '').trim().toLowerCase() === (car.modell || '').trim().toLowerCase()
        );
        if (!exists) {
          saveIceCarToCloud(car);
          added++;
        }
      }

      state.filters = {};
      const skipped = newCars.length - added;
      let msg = `${added} neue${added !== 1 ? ' Fahrzeuge' : 's Fahrzeug'} aus CSV hochgeladen`;
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

function loadEvCSVFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    window.loadEvCarsFromCSV(e.target.result)
      .then(count => toast(`${count} neue EV-Fahrzeuge gespeichert`, 'success'))
      .catch(err  => toast('Fehler beim Laden: ' + err.message, 'error'));
  };
  reader.onerror = () => toast('Datei konnte nicht gelesen werden.', 'error');
  reader.readAsText(file, 'UTF-8');
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function toast(msg, type = 'info') {
  const border = type === 'success' ? 'border-teal-200' : type === 'error' ? 'border-red-200' : 'border-gray-200';
  const dot    = type === 'success' ? 'bg-teal-500'     : type === 'error' ? 'bg-red-500'     : 'bg-gray-400';
  const el = document.createElement('div');
  el.className = `toast-anim pointer-events-auto flex items-center gap-3 px-4 py-2.5 bg-white border ${border} rounded-xl text-sm text-gray-800 shadow-lg`;
  el.innerHTML = `<span class="w-2 h-2 rounded-full flex-shrink-0 ${dot}"></span>${escapeHtml(msg)}`;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ── Filter-Panel ──────────────────────────────────────────────────────────────
function toggleFilter() {
  const panel  = document.getElementById('filterPanel');
  const btn    = document.getElementById('filterToggle');
  const isOpen = panel.classList.toggle('is-open');
  btn.setAttribute('aria-expanded', isOpen);
  panel.setAttribute('aria-hidden', !isOpen);
}

// ── Ansichtsgröße ─────────────────────────────────────────────────────────────
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

function updateSortUI() {
  const btn = document.getElementById('sortDirBtn');
  if (!btn) return;
  btn.classList.toggle('desc', state.sortDir === 'desc');
  btn.title = state.sortDir === 'desc'
    ? 'Absteigend (klicken für aufsteigend)'
    : 'Aufsteigend (klicken für absteigend)';
}

// ── Admin-Modus ───────────────────────────────────────────────────────────────
function updateAdminUI() {
  const btn = document.getElementById('adminBtn');
  if (btn) {
    if (adminMode) {
      btn.innerHTML = `<i data-lucide="lock-open" class="w-4 h-4"></i><span class="hidden sm:inline">Admin</span>`;
      btn.className = 'h-8 px-3 flex items-center gap-1.5 text-sm font-medium text-violet-700 bg-violet-50 border border-violet-300 rounded-lg hover:bg-violet-100 transition-colors';
    } else {
      btn.innerHTML = `<i data-lucide="lock" class="w-4 h-4"></i><span class="hidden sm:inline">Admin</span>`;
      btn.className = 'h-8 px-3 flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 shadow-sm rounded-lg hover:text-gray-900 hover:bg-gray-50 transition-colors';
    }
  }

  // Admin-Elemente (wie "Daten laden" und "Hinzufügen") ein-/ausblenden
  document.querySelectorAll('.admin-element').forEach(el => {
    if (adminMode) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });

  lucide.createIcons();
  refresh();
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
    sessionStorage.setItem('ev-admin', '1');
    closeAdminLogin();
    updateAdminUI();
    toast('Admin-Modus aktiviert', 'success');
  } else {
    document.getElementById('adminLoginError').classList.remove('hidden');
    document.getElementById('adminPasswordInput').value = '';
    document.getElementById('adminPasswordInput').focus();
  }
}

function logoutAdmin() {
  adminMode = false;
  sessionStorage.removeItem('ev-admin');
  updateAdminUI();
  toast('Admin-Modus beendet');
}

// ── Add-Car Modal ─────────────────────────────────────────────────────────────
function openModal() {
  const overlay = document.getElementById('addCarModal');
  overlay.classList.add('is-open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('f-marke')?.focus(), 100);
}

function closeModal() {
  editCarId = null;
  document.getElementById('modalTitle').textContent     = 'Neues Fahrzeug hinzufügen';
  document.getElementById('modalSubmitBtn').textContent = 'Fahrzeug speichern';
  const overlay = document.getElementById('addCarModal');
  overlay.classList.remove('is-open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  document.getElementById('addCarForm').reset();
}

function openEditModal(car) {
  editCarId = car.id;
  const f = document.getElementById('addCarForm');
  f.marke.value                    = car.marke                    || '';
  f.modell.value                   = car.modell                   || '';
  f.markteinfuehrung.value         = car.markteinfuehrung         || '';
  f.kraftstoffart.value            = car.kraftstoffart            || '';
  f.tankinhalt.value               = car.tankinhalt               ?? '';
  f.verbrauch.value                = car.verbrauch                ?? '';
  f.anhaengelast.value             = car.anhaengelast             ?? '';
  f.basisPreis.value               = car.basisPreis               ?? '';
  f.nullHundert.value              = car.nullHundert              ?? '';
  f.psLeistung.value               = car.psLeistung               ?? '';
  f.hoechstgeschwindigkeit.value   = car.hoechstgeschwindigkeit   ?? '';
  f.bordnetzspannung.value         = car.bordnetzspannung         ?? '';
  document.getElementById('modalTitle').textContent     = 'Fahrzeug bearbeiten';
  document.getElementById('modalSubmitBtn').textContent = 'Änderungen speichern';
  openModal();
}
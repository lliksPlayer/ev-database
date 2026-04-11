'use strict';

// ── Daten laden: gespeicherte Autos oder Demo-Daten ──────────────────────────
(function initCars() {
  // Zuerst aus localStorage laden
  const saved = loadSavedCars();
  if (saved) {
    state.cars = saved;
    computeBounds(state.cars);
    return;
  }

  // Kein gespeicherter Stand → Demo-Daten einmalig vorbelegen
  const demo = [
    { marke: 'Tesla',      modell: 'Model 3 LR RWD',   batterieNetto: 75,    ladezeit: 25, maxLadeleistung: 170, anhaengelast: null, wltpReichweite: 629, basisPreis: 42990,  nullHundert: 5.8, psLeistung: 358, hoechstgeschwindigkeit: 201, voltArchitektur: 400, markteinfuehrung: '2024-Q1' },
    { marke: 'BYD',        modell: 'Seal AWD',          batterieNetto: 82.56, ladezeit: 30, maxLadeleistung: 150, anhaengelast: 750,  wltpReichweite: 520, basisPreis: 44990,  nullHundert: 3.8, psLeistung: 530, hoechstgeschwindigkeit: 180, voltArchitektur: 800, markteinfuehrung: '2023-Q3' },
    { marke: 'Hyundai',    modell: 'IONIQ 6 AWD 77',    batterieNetto: 77.4,  ladezeit: 18, maxLadeleistung: 230, anhaengelast: 1600, wltpReichweite: 519, basisPreis: 51900,  nullHundert: 5.1, psLeistung: 325, hoechstgeschwindigkeit: 185, voltArchitektur: 800, markteinfuehrung: '2023-Q1' },
    { marke: 'Kia',        modell: 'EV6 GT',            batterieNetto: 77.4,  ladezeit: 18, maxLadeleistung: 240, anhaengelast: 1600, wltpReichweite: 424, basisPreis: 64990,  nullHundert: 3.4, psLeistung: 585, hoechstgeschwindigkeit: 260, voltArchitektur: 800, markteinfuehrung: '2022-Q4' },
    { marke: 'Mercedes',   modell: 'EQS 450+',          batterieNetto: 107.8, ladezeit: 31, maxLadeleistung: 200, anhaengelast: 750,  wltpReichweite: 782, basisPreis: 109551, nullHundert: 6.2, psLeistung: 333, hoechstgeschwindigkeit: 210, voltArchitektur: 400, markteinfuehrung: '2022-Q2' },
    { marke: 'Porsche',    modell: 'Taycan Turbo S',    batterieNetto: 97,    ladezeit: 22, maxLadeleistung: 320, anhaengelast: 1000, wltpReichweite: 630, basisPreis: 190983, nullHundert: 2.4, psLeistung: 761, hoechstgeschwindigkeit: 260, voltArchitektur: 800, markteinfuehrung: '2024-Q1' },
    { marke: 'Volkswagen', modell: 'ID.7 Pro S',        batterieNetto: 86,    ladezeit: 28, maxLadeleistung: 200, anhaengelast: 1200, wltpReichweite: 709, basisPreis: 59995,  nullHundert: 6.5, psLeistung: 286, hoechstgeschwindigkeit: 180, voltArchitektur: 400, markteinfuehrung: '2023-Q4' },
    { marke: 'BMW',        modell: 'i4 eDrive40',       batterieNetto: 83.9,  ladezeit: 31, maxLadeleistung: 205, anhaengelast: 1600, wltpReichweite: 590, basisPreis: 59100,  nullHundert: 5.7, psLeistung: 340, hoechstgeschwindigkeit: 190, voltArchitektur: 400, markteinfuehrung: '2022-Q1' },
  ];
  state.cars = demo.map(d => { d.id = uid(); return calcDerived(d); });
  computeBounds(state.cars);
  saveCars(); // Demo-Daten direkt speichern, damit auch sie erhalten bleiben
})();

// ── Event-Handler ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // Suche
  document.getElementById('searchInput').addEventListener('input', e => {
    state.searchQuery = e.target.value.trim();
    refresh();
  });

  // Sortierung
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

  // Filter
  document.getElementById('filterToggle').addEventListener('click', toggleFilter);
  document.getElementById('filterResetBtn').addEventListener('click', () => {
    state.filters = {};
    buildFilterPanel();
    refresh();
    toast('Filter zurückgesetzt');
  });

  // Ansichtsgröße
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => setView(btn.dataset.view));
  });

  // CSV laden
  document.getElementById('loadDataBtn').addEventListener('click',  () => document.getElementById('fileInput').click());
  document.getElementById('emptyLoadBtn').addEventListener('click', () => document.getElementById('fileInput').click());
  document.getElementById('fileInput').addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) loadCSVFile(file);
    e.target.value = '';
  });

  // Modal
  document.getElementById('addCarBtn').addEventListener('click',    openModal);
  document.getElementById('emptyAddBtn').addEventListener('click',  openModal);
  document.getElementById('modalClose').addEventListener('click',   closeModal);
  document.getElementById('modalCancel').addEventListener('click',  closeModal);
  document.getElementById('addCarModal').addEventListener('click',  e => { if (e.target === e.currentTarget) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  // Formular: Live-Kalkulation
  ['f-batterieNetto', 'f-ladezeit', 'f-wltpReichweite'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updateFormCalc);
  });

  // Formular: Absenden
  document.getElementById('addCarForm').addEventListener('submit', e => {
    e.preventDefault();
    const form = e.target;
    if (!form.marke.value.trim())   { toast('Bitte Marke eingeben.',           'error'); return; }
    if (!form.modell.value.trim())  { toast('Bitte Modell eingeben.',          'error'); return; }
    if (!form.batterieNetto.value)  { toast('Bitte Batterie Netto eingeben.',  'error'); return; }
    if (!form.ladezeit.value)       { toast('Bitte Ladezeit eingeben.',        'error'); return; }
    if (!form.wltpReichweite.value) { toast('Bitte WLTP Reichweite eingeben.', 'error'); return; }
    if (!form.basisPreis.value)     { toast('Bitte Basispreis eingeben.',      'error'); return; }
    const data = Object.fromEntries(new FormData(form));
    if (editCarId) updateCar(editCarId, data);
    else           addCar(data);
    closeModal();
  });

  // Kaufberater
  document.getElementById('advisorToggle').addEventListener('click', toggleAdvisor);
  document.getElementById('advisorResetBtn').addEventListener('click', resetAdvisor);

  // Admin
  document.getElementById('adminBtn').addEventListener('click', () => {
    if (adminMode) logoutAdmin();
    else openAdminLogin();
  });
  document.getElementById('adminLoginForm').addEventListener('submit', e => {
    e.preventDefault();
    submitAdminLogin();
  });
  document.getElementById('adminLoginClose').addEventListener('click', closeAdminLogin);
  document.getElementById('adminLoginCancel').addEventListener('click', closeAdminLogin);
  document.getElementById('adminLoginModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeAdminLogin();
  });
  document.getElementById('adminPasswordInput').addEventListener('keydown', e => {
    if (e.key === 'Escape') closeAdminLogin();
  });

  // Initiales Rendering
  lucide.createIcons();
  buildFilterPanel();
  buildAdvisorPanel();

  // Einmalig beim Start: nahezu identische Duplikate (≤10%) automatisch bereinigen
  const startupRemoved = autoFixDuplicates();
  if (startupRemoved > 0) {
    computeBounds(state.cars);
    saveCars();
  }

  refresh();
  updateAdminUI(); // Admin-only-Elemente beim Start verstecken
});

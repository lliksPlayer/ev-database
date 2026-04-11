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

  // Kein gespeicherter Stand → aus data.js laden (gemeinsame Datenbasis)
  if (typeof DEFAULT_CARS !== 'undefined' && DEFAULT_CARS.length > 0) {
    state.cars = DEFAULT_CARS.map(d => {
      const c = Object.assign({}, d);
      c.id = uid();
      return calcDerived(c);
    });
    computeBounds(state.cars);
    saveCars();
  }
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

  // GitHub Auto-Sync (Admin)
  document.getElementById('githubBtn').addEventListener('click', openGithubModal);

  // Daten exportieren (Admin, Fallback ohne GitHub Token)
  document.getElementById('exportDataBtn').addEventListener('click', () => {
    const clean = state.cars.map(({ id, geladeneEnergie, ladespeed, verbrauch, ...rest }) => rest);
    const content = `// js/data.js – Exportiert am ${new Date().toLocaleDateString('de-DE')}\n// Diese Datei ins Projekt kopieren und Seite neu laden.\nconst DEFAULT_CARS = ${JSON.stringify(clean, null, 2)};\n`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type: 'text/javascript' }));
    a.download = 'data.js';
    a.click();
    toast('data.js heruntergeladen – ins Projektordner kopieren!', 'success');
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

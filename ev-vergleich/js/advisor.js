'use strict';

/* Standardrichtung je Feld: 'higher' = mehr ist besser, 'lower' = weniger ist besser */
const ADVISOR_DIR = {
  batterieNetto:           'higher',
  ladezeit:                'lower',
  geladeneEnergie:         'higher',
  ladespeed:               'higher',
  maxLadeleistung:         'higher',
  anhaengelast:            'higher',
  wltpReichweite:          'higher',
  verbrauch:               'lower',
  basisPreis:              'lower',
  nullHundert:             'lower',
  psLeistung:              'higher',
  hoechstgeschwindigkeit:  'higher',
  voltArchitektur:         'higher',
};

/*
 * advisorConfig: {
 *   ok:      number|null  – Ab diesem Wert gilt das Feld als "Ok" (darunter = No go)
 *   gut:     number|null  – Ab diesem Wert gilt das Feld als "Gut"
 *   dir:     'higher'|'lower'
 *   enabled: boolean      – Feld aktiv/inaktiv
 * }
 * Gewichtung wurde entfernt – jedes aktive Feld zählt gleich.
 */
const advisorConfig = {};
FIELDS.forEach(({ key }) => {
  advisorConfig[key] = {
    ok:      null,
    gut:     null,
    dir:     ADVISOR_DIR[key] ?? 'higher',
    enabled: true,
  };
});

let advisorActive = false;

/* ── Auswertungslogik ─────────────────────────────────────────────────────── */

/**
 * Gibt 'nogo' | 'ok' | 'gut' | null zurück.
 * null = Feld nicht konfiguriert oder deaktiviert.
 * No go = 0 Punkte, Ok = 1 Punkt, Gut = 2 Punkte.
 */
function getFieldStatus(val, key) {
  if (val == null || isNaN(val)) return null;
  const { ok, gut, dir, enabled } = advisorConfig[key];
  if (!enabled || (ok == null && gut == null)) return null;

  if (dir === 'higher') {
    if (gut != null && val >= gut) return 'gut';
    if (ok  != null && val >= ok)  return 'ok';
    // Nogo: innerhalb 15% der Schwelle = "near-nogo", darunter = "nogo"
    if (ok != null && val >= ok * (1 - 0.15)) return 'near-nogo';
    return 'nogo';
  } else {
    if (gut != null && val <= gut) return 'gut';
    if (ok  != null && val <= ok)  return 'ok';
    // Nogo: innerhalb 15% der Schwelle = "near-nogo", darüber = "nogo"
    if (ok != null && val <= ok * (1 + 0.15)) return 'near-nogo';
    return 'nogo';
  }
}

/** Gesamtpunktzahl eines Autos: Σ (0/1/2 Punkte). */
function getCarScore(car) {
  let total = 0;
  FIELDS.forEach(({ key }) => {
    const { ok, gut, enabled } = advisorConfig[key];
    if (!enabled || (ok == null && gut == null)) return;
    const status = getFieldStatus(car[key], key);
    if (status == null) return;
    total += status === 'gut' ? 2 : status === 'ok' ? 1 : 0;
  });
  return total;
}

/** Maximal erreichbare Punktzahl mit aktueller Konfiguration. */
function getMaxScore() {
  return FIELDS.reduce((sum, { key }) => {
    const { ok, gut, enabled } = advisorConfig[key];
    if (!enabled || (ok == null && gut == null)) return sum;
    return sum + (gut != null ? 2 : 1);
  }, 0);
}

/* ── Panel-UI ────────────────────────────────────────────────────────────── */

function buildAdvisorPanel() {
  const container = document.getElementById('advisorRows');
  container.innerHTML = '';

  // Karten-Grid
  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3';
  container.appendChild(grid);

  FIELDS.forEach(({ key, label, unit }) => {
    const cfg      = advisorConfig[key];
    const isHigher = cfg.dir === 'higher';
    const isOn     = cfg.enabled;

    const card = document.createElement('div');
    card.className = [
      'flex flex-col gap-3 p-3 rounded-xl border transition-all duration-200',
      isOn ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-50',
    ].join(' ');

    card.innerHTML = `
      <!-- Name + Toggle-Switch -->
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <p class="text-sm font-bold text-gray-800 leading-snug">${label}</p>
          <p class="text-xs text-gray-400">${unit}</p>
        </div>
        <button class="adv-toggle flex-shrink-0 relative w-9 h-5 rounded-full transition-colors focus:outline-none
                       ${isOn ? 'bg-teal-500' : 'bg-gray-300'}"
                data-key="${key}" aria-pressed="${isOn}"
                title="${isOn ? 'Deaktivieren' : 'Aktivieren'}">
          <span class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform
                       ${isOn ? 'translate-x-4' : 'translate-x-0'}"></span>
        </button>
      </div>

      <!-- Richtungs-Button -->
      <button class="adv-dir w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg
                     text-xs font-semibold border transition-colors
                     ${isHigher
                       ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                       : 'bg-blue-50   text-blue-700   border-blue-200   hover:bg-blue-100'}"
              data-key="${key}" ${!isOn ? 'disabled' : ''}>
        <svg viewBox="0 0 12 12" fill="none" class="w-3 h-3 flex-shrink-0" aria-hidden="true">
          ${isHigher
            ? '<path d="M1 9L6 3L11 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
            : '<path d="M1 3L6 9L11 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'}
        </svg>
        ${isHigher ? 'Mehr ist besser' : 'Weniger ist besser'}
      </button>

      <!-- Schwellen-Inputs -->
      <div class="flex flex-col gap-2">
        <div>
          <label class="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 mb-1">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0"></span>
            Ok ${isHigher ? '≥' : '≤'}
          </label>
          <input class="h-8 w-full px-2 text-sm font-semibold text-center text-gray-800
                        bg-amber-50 border border-amber-200 rounded-lg
                        focus:border-amber-400 focus:bg-white focus:outline-none
                        placeholder:text-gray-300 transition-colors"
                 type="number" id="adv-ok-${key}" placeholder="–"
                 value="${cfg.ok ?? ''}" ${!isOn ? 'disabled' : ''} />
        </div>
        <div>
          <label class="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
            Gut ${isHigher ? '≥' : '≤'}
          </label>
          <input class="h-8 w-full px-2 text-sm font-semibold text-center text-gray-800
                        bg-emerald-50 border border-emerald-200 rounded-lg
                        focus:border-emerald-400 focus:bg-white focus:outline-none
                        placeholder:text-gray-300 transition-colors"
                 type="number" id="adv-gut-${key}" placeholder="–"
                 value="${cfg.gut ?? ''}" ${!isOn ? 'disabled' : ''} />
        </div>
      </div>`;

    grid.appendChild(card);

    const okInput   = card.querySelector(`#adv-ok-${key}`);
    const gutInput  = card.querySelector(`#adv-gut-${key}`);
    const dirBtn    = card.querySelector('.adv-dir');
    const toggleBtn = card.querySelector('.adv-toggle');

    function update() {
      const okVal  = parseFloat(okInput.value);
      const gutVal = parseFloat(gutInput.value);
      advisorConfig[key].ok  = isNaN(okVal)  ? null : okVal;
      advisorConfig[key].gut = isNaN(gutVal) ? null : gutVal;
      if (advisorActive) refresh();
    }

    dirBtn.addEventListener('click', () => {
      advisorConfig[key].dir = advisorConfig[key].dir === 'higher' ? 'lower' : 'higher';
      buildAdvisorPanel();
      if (advisorActive) refresh();
    });

    toggleBtn.addEventListener('click', () => {
      advisorConfig[key].enabled = !advisorConfig[key].enabled;
      buildAdvisorPanel();
      if (advisorActive) refresh();
    });

    okInput.addEventListener('input',  update);
    gutInput.addEventListener('input', update);
  });
}

/* ── Toggle & Reset ───────────────────────────────────────────────────────── */

function toggleAdvisor() {
  const panel = document.getElementById('advisorPanel');
  const btn   = document.getElementById('advisorToggle');
  advisorActive = panel.classList.toggle('is-open');
  btn.setAttribute('aria-expanded', advisorActive);
  panel.setAttribute('aria-hidden', !advisorActive);
  btn.classList.toggle('text-violet-700',   advisorActive);
  btn.classList.toggle('bg-violet-50',      advisorActive);
  btn.classList.toggle('border-violet-300', advisorActive);

  if (advisorActive) {
    document.getElementById('sortSelect').value = 'advisor';
    state.sortKey = 'advisor';
  } else if (state.sortKey === 'advisor') {
    state.sortKey = 'wltpReichweite';
    document.getElementById('sortSelect').value = 'wltpReichweite';
  }
  refresh();
}

function resetAdvisor() {
  FIELDS.forEach(({ key }) => {
    advisorConfig[key] = {
      ok:      null,
      gut:     null,
      dir:     ADVISOR_DIR[key] ?? 'higher',
      enabled: true,
    };
  });
  buildAdvisorPanel();
  if (advisorActive) refresh();
  toast('Kaufberater zurückgesetzt');
}

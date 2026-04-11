'use strict';

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Aktualisiert die zwei Highlight-Karten oben. */
function renderHighlights() {
  const cars = state.visible;

  const bestR  = cars.reduce((b, c) => c.wltpReichweite > (b?.wltpReichweite ?? -Infinity) ? c : b, null);
  const bestPS = cars.reduce((b, c) => c.psLeistung     > (b?.psLeistung     ?? -Infinity) ? c : b, null);

  document.getElementById('hlReichweiteVal').textContent = bestR  ? fmt(bestR.wltpReichweite, 'wltpReichweite') + ' km' : '–';
  document.getElementById('hlReichweiteNam').textContent = bestR  ? `${bestR.marke} ${bestR.modell}`   : '–';
  document.getElementById('hlPSVal').textContent         = bestPS ? fmt(bestPS.psLeistung, 'psLeistung') + ' PS' : '–';
  document.getElementById('hlPSNam').textContent         = bestPS ? `${bestPS.marke} ${bestPS.modell}`  : '–';
}

/** Rendert alle Fahrzeug-Karten neu. */
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
  grid.innerHTML = state.visible.map((car, i) => buildCardHTML(car, i + 1)).join('');
  lucide.createIcons();

  grid.querySelectorAll('[data-delete-id]').forEach(btn => {
    btn.addEventListener('click', () => deleteCar(btn.dataset.deleteId));
  });

  grid.querySelectorAll('[data-tco-car-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const car = state.cars.find(c => c.id === btn.dataset.tcoCarId);
      if (car && typeof importCarToTCO === 'function') importCarToTCO(car);
    });
  });

  grid.querySelectorAll('[data-edit-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const car = state.cars.find(c => c.id === btn.dataset.editId);
      if (car) openEditModal(car);
    });
  });

  grid.querySelectorAll('.missing-data-save').forEach(btn => {
    btn.addEventListener('click', () => {
      const car = state.cars.find(c => c.id === btn.dataset.carId);
      if (!car) return;
      const section = btn.closest('.missing-data-section');
      let updated = false;
      section.querySelectorAll('.missing-field-input').forEach(input => {
        const val = input.value.trim();
        if (val === '') return;
        if (input.type === 'number') {
          const num = parseFloat(val);
          if (!isNaN(num)) { car[input.dataset.field] = num; updated = true; }
        } else {
          car[input.dataset.field] = val;
          updated = true;
        }
      });
      if (updated) {
        calcDerived(car);
        computeBounds(state.cars);
        saveCars();
        buildFilterPanel();
        refresh();
        toast(`${car.marke} ${car.modell} aktualisiert`, 'success');
      } else {
        toast('Keine neuen Werte eingegeben', 'info');
      }
    });
  });
}

/** Erzeugt das HTML einer einzelnen Auto-Karte. */
function buildCardHTML(car, rank) {
  const unit = (key) => FIELDS.find(f => f.key === key)?.unit ?? '';

  const STATUS_COLOR = {
    nogo: 'text-red-500',
    ok:   'text-amber-500',
    gut:  'text-emerald-600',
  };

  const isAdvisor = typeof advisorActive !== 'undefined' && advisorActive;

  const iconRow = (icon, color, val, key, label) => {
    if (val == null || isNaN(val)) return '';
    const status   = isAdvisor ? getFieldStatus(val, key) : null;
    const valColor = status ? (STATUS_COLOR[status] ?? 'text-gray-900') : 'text-gray-900';
    return `<div class="flex items-center gap-2">
      <i data-lucide="${icon}" class="w-3.5 h-3.5 ${color} flex-shrink-0"></i>
      <div class="min-w-0">
        <p class="${valColor} text-sm font-bold leading-none">${fmt(val, key)} <span class="text-gray-400 font-normal text-xs">${unit(key)}</span></p>
        <p class="text-gray-400 text-xs mt-0.5">${label}</p>
      </div>
    </div>`;
  };

  // Rang-Badge (Top 3 im Kaufberater-Modus)
  const rankBadge = (() => {
    if (!isAdvisor || rank > 3) return '';
    const styles = [
      '',
      'bg-yellow-50 text-yellow-700 border-yellow-300',
      'bg-gray-100 text-gray-600 border-gray-300',
      'bg-orange-50 text-orange-600 border-orange-300',
    ];
    const icons = ['', '&#9670;', '&#9671;', '&#9671;'];
    return `<span class="flex-shrink-0 px-2 py-0.5 border rounded-full text-xs font-black ${styles[rank]}">${icons[rank]} Platz ${rank}</span>`;
  })();

  // Score-Badge wenn Kaufberater aktiv
  const scoreBadge = (() => {
    if (!isAdvisor) return '';
    const score = getCarScore(car);
    const max   = getMaxScore();
    const pct   = max > 0 ? score / max : 0;
    const cls   = pct >= 0.66
      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
      : pct >= 0.33
        ? 'bg-amber-50 text-amber-700 border-amber-300'
        : 'bg-red-50 text-red-600 border-red-300';
    return `<span class="flex-shrink-0 px-2 py-0.5 border rounded-full text-xs font-black ${cls}">${score} Pkt</span>`;
  })();

  // Kartenrand für Top-3-Hervorhebung
  const cardBorder = (() => {
    if (!isAdvisor || rank > 3) return 'border-gray-100 hover:border-gray-200 hover:shadow-md';
    const borders = [
      '',
      'border-yellow-300 shadow-md shadow-yellow-100 hover:shadow-yellow-200',
      'border-gray-300   shadow-md shadow-gray-100   hover:shadow-gray-200',
      'border-orange-300 shadow-md shadow-orange-100 hover:shadow-orange-200',
    ];
    return borders[rank];
  })();

  // Fehlende-Daten-Sektion (nur Admin-Modus)
  const missingSection = (() => {
    if (!adminMode) return '';
    const manualFields = [
      { key: 'batterieNetto',          label: 'Batterie Netto',    unit: 'kWh',   type: 'number', step: 0.1,  placeholder: '82.0' },
      { key: 'ladezeit',               label: '10%–80% in min',    unit: 'min',   type: 'number', step: 1,    placeholder: '28' },
      { key: 'maxLadeleistung',        label: 'Max. Ladeleistung', unit: 'kW',    type: 'number', step: 1,    placeholder: '250' },
      { key: 'voltArchitektur',        label: 'Volt-Architektur',  unit: 'V',     type: 'number', step: 100,  placeholder: '800' },
      { key: 'wltpReichweite',         label: 'WLTP Reichweite',   unit: 'km',    type: 'number', step: 1,    placeholder: '491' },
      { key: 'basisPreis',             label: 'Basispreis',        unit: '€',     type: 'number', step: 100,  placeholder: '43990' },
      { key: 'nullHundert',            label: '0–100 km/h',        unit: 's',     type: 'number', step: 0.1,  placeholder: '5.8' },
      { key: 'psLeistung',             label: 'PS-Leistung',       unit: 'PS',    type: 'number', step: 1,    placeholder: '258' },
      { key: 'hoechstgeschwindigkeit', label: 'Top Speed',         unit: 'km/h',  type: 'number', step: 1,    placeholder: '201' },
      { key: 'anhaengelast',           label: 'Anhängelast',       unit: 'kg',    type: 'number', step: 50,   placeholder: '1000' },
      { key: 'markteinfuehrung',       label: 'Markteinführung',   unit: '',      type: 'text',   step: null, placeholder: '2024-Q1' },
    ];
    const missing = manualFields.filter(f => car[f.key] == null || car[f.key] === '');
    if (missing.length === 0) return '';
    const inputs = missing.map(f => `
      <div class="flex flex-col gap-1">
        <label class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider leading-none">${escapeHtml(f.label)}${f.unit ? ` <span class="font-normal normal-case">(${escapeHtml(f.unit)})</span>` : ''}</label>
        <input type="${f.type}"
               class="missing-field-input h-8 px-2 text-xs text-gray-900 bg-white border border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none transition-colors placeholder:text-gray-300"
               data-field="${f.key}"
               placeholder="${f.placeholder}"
               ${f.step ? `step="${f.step}"` : ''}
               ${f.type === 'number' ? 'min="0"' : ''} />
      </div>`).join('');
    return `
    <div class="missing-data-section border-t border-amber-100 bg-amber-50/50 px-5 py-4">
      <div class="flex items-center gap-1.5 mb-3">
        <i data-lucide="alert-triangle" class="w-3.5 h-3.5 text-amber-500 flex-shrink-0"></i>
        <span class="text-xs font-bold text-amber-600">Fehlende Daten</span>
        <span class="text-[10px] text-amber-400">(${missing.length} Feld${missing.length !== 1 ? 'er' : ''})</span>
      </div>
      <div class="grid grid-cols-2 gap-2 mb-3">${inputs}</div>
      <button class="missing-data-save w-full h-8 flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors"
              data-car-id="${car.id}">
        <i data-lucide="save" class="w-3.5 h-3.5"></i>
        Daten speichern
      </button>
    </div>`;
  })();

  return `
  <article class="bg-white border ${cardBorder} rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 shadow-sm" data-id="${car.id}">
    <div class="px-5 pt-5 pb-4 flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-teal-600 text-xs font-bold uppercase tracking-widest mb-1">${escapeHtml(car.marke)}</p>
        <h3 class="text-gray-900 text-xl font-black leading-tight truncate">${escapeHtml(car.modell)}</h3>
      </div>
      <div class="flex flex-col items-end gap-1.5 flex-shrink-0">
        ${rankBadge}
        ${scoreBadge}
        ${car.markteinfuehrung ? `<span class="px-2.5 py-1 bg-gray-100 text-gray-500 text-xs font-semibold rounded-full">${escapeHtml(String(car.markteinfuehrung))}</span>` : ''}
      </div>
    </div>
    <div class="px-5 pb-4 grid grid-cols-2 gap-3">
      <div class="bg-blue-50 rounded-xl p-3">
        <p class="text-blue-500 text-xs font-semibold uppercase tracking-wider mb-1">WLTP</p>
        <p class="text-blue-700 text-2xl font-black leading-none">${car.wltpReichweite != null ? fmt(car.wltpReichweite, 'wltpReichweite') : '–'}<span class="text-sm font-semibold text-blue-400">${car.wltpReichweite != null ? ' km' : ''}</span></p>
      </div>
      <div class="bg-emerald-50 rounded-xl p-3">
        <p class="text-emerald-600 text-xs font-semibold uppercase tracking-wider mb-1">Basis Preis</p>
        <p class="text-emerald-700 text-xl font-black leading-none">${car.basisPreis != null ? fmt(car.basisPreis, 'basisPreis') : '–'}</p>
      </div>
    </div>
    <div class="mx-5 border-t border-gray-100"></div>
    <div class="px-5 py-4 grid grid-cols-2 gap-x-4 gap-y-3 flex-1">
      ${iconRow('battery-charging', 'text-emerald-500', car.batterieNetto,          'batterieNetto',          'Batterie Netto')}
      ${iconRow('timer',            'text-orange-500',  car.ladezeit,               'ladezeit',               '10%-80% in min')}
      ${iconRow('database',         'text-teal-500',    car.geladeneEnergie,        'geladeneEnergie',        'kWh nach 70%')}
      ${iconRow('zap',              'text-yellow-500',  car.ladespeed,              'ladespeed',              'kWh/min')}
      ${iconRow('zap',              'text-amber-600',   car.maxLadeleistung,        'maxLadeleistung',        'max. Ladeleistung')}
      ${iconRow('truck',            'text-amber-700',   car.anhaengelast,           'anhaengelast',           'Anhängelast')}
      ${iconRow('activity',         'text-violet-500',  car.verbrauch,              'verbrauch',              'WLTP Verbrauch')}
      ${iconRow('rocket',           'text-red-500',     car.nullHundert,            'nullHundert',            '0-100')}
      ${iconRow('gauge',            'text-rose-500',    car.psLeistung,             'psLeistung',             'PS')}
      ${iconRow('wind',             'text-sky-500',     car.hoechstgeschwindigkeit, 'hoechstgeschwindigkeit', 'Top Speed')}
      ${iconRow('cpu',              'text-blue-500',    car.voltArchitektur,        'voltArchitektur',        'Volt')}
    </div>
    <div class="border-t border-gray-100 flex">
      <button class="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium text-teal-500 hover:text-teal-700 hover:bg-teal-50 transition-colors"
              data-tco-car-id="${car.id}" title="In TCO-Rechner übernehmen">
        <i data-lucide="calculator" class="w-3.5 h-3.5" aria-hidden="true"></i>
        In TCO
      </button>
      ${adminMode ? `
      <div class="w-px bg-gray-100 flex-shrink-0"></div>
      <button class="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
              data-edit-id="${car.id}">
        <i data-lucide="pencil" class="w-3.5 h-3.5" aria-hidden="true"></i>
        Bearbeiten
      </button>
      <div class="w-px bg-gray-100 flex-shrink-0"></div>
      <button class="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              data-delete-id="${car.id}" aria-label="${escapeHtml(car.marke)} ${escapeHtml(car.modell)} entfernen">
        <i data-lucide="trash-2" class="w-3.5 h-3.5" aria-hidden="true"></i>
        Entfernen
      </button>` : ''}
    </div>
    ${missingSection}
  </article>`;
}

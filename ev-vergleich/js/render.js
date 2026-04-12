import { state, adminMode, calcDerived } from './state.js';
import { FIELDS } from './config.js';
import { fmt } from './filter.js';
import { advisorActive, getFieldStatus, getCarScore, getMaxScore } from './advisor.js';
import { updateCarInCloud } from './firebase-db.js';
import { toast } from './ui.js';

export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Aktualisiert die zwei Highlight-Karten oben. */
export function renderHighlights() {
  const cars = state.visible;

  const bestR  = cars.reduce((b, c) => c.wltpReichweite > (b?.wltpReichweite ?? -Infinity) ? c : b, null);
  const bestPS = cars.reduce((b, c) => c.psLeistung     > (b?.psLeistung     ?? -Infinity) ? c : b, null);

  document.getElementById('hlReichweiteVal').textContent = bestR  ? fmt(bestR.wltpReichweite, 'wltpReichweite') + ' km' : '–';
  document.getElementById('hlReichweiteNam').textContent = bestR  ? `${bestR.marke} ${bestR.modell}`   : '–';
  document.getElementById('hlPSVal').textContent         = bestPS ? fmt(bestPS.psLeistung, 'psLeistung') + ' PS' : '–';
  document.getElementById('hlPSNam').textContent         = bestPS ? `${bestPS.marke} ${bestPS.modell}`  : '–';
}

/** Rendert alle Fahrzeug-Karten neu. */
export function renderCards() {
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
        // In Firestore speichern – onSnapshot aktualisiert state und UI automatisch
        updateCarInCloud(car.id, car);
        toast(`${car.marke} ${car.modell} aktualisiert`, 'success');
      } else {
        toast('Keine neuen Werte eingegeben', 'info');
      }
    });
  });
}

/** Erzeugt das HTML einer einzelnen Auto-Karte. */
export function buildCardHTML(car, rank) {
  const unit = (key) => FIELDS.find(f => f.key === key)?.unit ?? '';

  const STATUS_COLOR = {
    nogo:       'text-red-500',
    'near-nogo': 'text-orange-500',
    ok:         'text-amber-500',
    gut:        'text-teal-500', // Update auf Teal für "Gut" gem. Guidelines
  };

  const isAdvisor = typeof advisorActive !== 'undefined' && advisorActive;

  const iconRow = (icon, color, val, key, label) => {
    if (val == null || isNaN(val)) return '';
    const status   = isAdvisor ? getFieldStatus(val, key) : null;
    const valColor = status ? (STATUS_COLOR[status] ?? 'text-gray-900') : 'text-gray-900';
    const nearNogoBadge = status === 'near-nogo'
      ? `<span title="Knapp unter der No-go-Schwelle (≤15%)" class="ml-1 inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-orange-50 border border-orange-100 text-orange-600 flex-shrink-0" style="font-size:9px;font-weight:900">!</span>`
      : '';
    return `<div class="flex items-center gap-2">
      <i data-lucide="${icon}" class="w-4 h-4 ${color} flex-shrink-0"></i>
      <div class="min-w-0 flex flex-col justify-center">
        <p class="${valColor} text-sm font-black leading-none flex items-center">${fmt(val, key)} <span class="text-gray-400 font-medium text-[10px] ml-1 uppercase">${unit(key)}</span>${nearNogoBadge}</p>
        <p class="text-gray-500 text-[10px] mt-0.5 font-bold uppercase tracking-widest truncate">${label}</p>
      </div>
    </div>`;
  };

  // Rang-Badge (Top 3 im Kaufberater-Modus)
  const rankBadge = (() => {
    if (!isAdvisor || rank > 3) return '';
    const styles = [
      '',
      'bg-yellow-50 text-yellow-700 border-yellow-200 shadow-sm',
      'bg-gray-50 text-gray-600 border-gray-200 shadow-sm',
      'bg-orange-50 text-orange-600 border-orange-200 shadow-sm',
    ];
    const icons = ['', '&#9670;', '&#9671;', '&#9671;'];
    return `<span class="flex-shrink-0 px-2 py-0.5 border rounded-full text-[10px] font-black uppercase tracking-wider ${styles[rank]}">${icons[rank]} Platz ${rank}</span>`;
  })();

  // Score-Badge wenn Kaufberater aktiv
  const scoreBadge = (() => {
    if (!isAdvisor) return '';
    const score = getCarScore(car);
    const max   = getMaxScore();
    const pct   = max > 0 ? score / max : 0;
    const cls   = pct >= 0.66
      ? 'bg-teal-50 text-teal-700 border-teal-200'
      : pct >= 0.33
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-red-50 text-red-600 border-red-200';
    return `<span class="flex-shrink-0 px-2 py-0.5 border rounded-full text-[10px] font-black uppercase tracking-wider ${cls}">${score} Pkt</span>`;
  })();

  // Kartenrand für Top-3-Hervorhebung
  const cardBorder = (() => {
    if (!isAdvisor || rank > 3) return 'border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md';
    const borders = [
      '',
      'border-yellow-300 shadow-md hover:shadow-lg',
      'border-gray-300 shadow-md hover:shadow-lg',
      'border-orange-300 shadow-md hover:shadow-lg',
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
        <label class="text-[9px] font-bold text-orange-500/80 uppercase tracking-widest leading-none">${escapeHtml(f.label)}${f.unit ? ` <span class="font-medium normal-case">(${escapeHtml(f.unit)})</span>` : ''}</label>
        <input type="${f.type}"
               class="missing-field-input h-8 px-2 text-xs font-bold text-gray-900 bg-white border border-orange-200 rounded-lg focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:outline-none transition-shadow placeholder:text-gray-300"
               data-field="${f.key}"
               placeholder="${f.placeholder}"
               ${f.step ? `step="${f.step}"` : ''}
               ${f.type === 'number' ? 'min="0"' : ''} />
      </div>`).join('');
    return `
    <div class="missing-data-section border-t border-orange-100 bg-orange-50/50 px-5 py-4">
      <div class="flex items-center gap-1.5 mb-3">
        <i data-lucide="alert-triangle" class="w-4 h-4 text-orange-500 flex-shrink-0"></i>
        <span class="text-xs font-bold text-orange-600 uppercase tracking-widest">Fehlende Daten</span>
        <span class="text-[10px] text-orange-400 font-bold">(${missing.length} Feld${missing.length !== 1 ? 'er' : ''})</span>
      </div>
      <div class="grid grid-cols-2 gap-3 mb-3">${inputs}</div>
      <button class="missing-data-save w-full h-9 flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-orange-500 rounded-lg hover:bg-orange-600 shadow-sm transition-colors"
              data-car-id="${car.id}">
        <i data-lucide="save" class="w-3.5 h-3.5"></i>
        Daten speichern
      </button>
    </div>`;
  })();

  return `
  <article class="bg-white border ${cardBorder} rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1" data-id="${car.id}">
    <div class="px-6 pt-6 pb-4 flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-teal-600 text-[10px] font-bold uppercase tracking-widest mb-1">${escapeHtml(car.marke)}</p>
        <h3 class="text-gray-900 text-xl font-black leading-tight truncate">${escapeHtml(car.modell)}</h3>
      </div>
      <div class="flex flex-col items-end gap-1.5 flex-shrink-0">
        ${rankBadge}
        ${scoreBadge}
        ${car.markteinfuehrung ? `<span class="px-2.5 py-1 bg-white border border-gray-200 shadow-sm text-gray-600 text-[10px] font-bold uppercase tracking-widest rounded-full">${escapeHtml(String(car.markteinfuehrung))}</span>` : ''}
      </div>
    </div>
    
    <div class="px-6 pb-5 grid grid-cols-2 gap-4">
      <div class="bg-blue-50/50 border border-blue-100 rounded-xl p-3.5">
        <p class="text-blue-500 text-[10px] font-bold uppercase tracking-widest mb-1">WLTP</p>
        <p class="text-blue-700 text-2xl font-black leading-none">${car.wltpReichweite != null ? fmt(car.wltpReichweite, 'wltpReichweite') : '–'}<span class="text-sm font-bold text-blue-400 ml-0.5">${car.wltpReichweite != null ? ' km' : ''}</span></p>
      </div>
      <div class="bg-teal-50/50 border border-teal-100 rounded-xl p-3.5">
        <p class="text-teal-600 text-[10px] font-bold uppercase tracking-widest mb-1">Basis Preis</p>
        <p class="text-teal-700 text-2xl font-black leading-none">${car.basisPreis != null ? fmt(car.basisPreis, 'basisPreis') : '–'}</p>
      </div>
    </div>
    
    <div class="mx-6 border-t border-gray-100"></div>
    
    <div class="px-6 py-5 grid grid-cols-2 gap-x-4 gap-y-4 flex-1">
      ${iconRow('battery-charging', 'text-teal-500',   car.batterieNetto,          'batterieNetto',          'Batterie Netto')}
      ${iconRow('timer',            'text-orange-400',  car.ladezeit,               'ladezeit',               '10%-80% in min')}
      ${iconRow('database',         'text-teal-600',    car.geladeneEnergie,        'geladeneEnergie',        'kWh nach 70%')}
      ${iconRow('zap',              'text-yellow-500',  car.ladespeed,              'ladespeed',              'kWh/min')}
      ${iconRow('zap',              'text-amber-500',   car.maxLadeleistung,        'maxLadeleistung',        'max. Ladeleistung')}
      ${iconRow('truck',            'text-amber-600',   car.anhaengelast,           'anhaengelast',           'Anhängelast')}
      ${iconRow('activity',         'text-violet-500',  car.verbrauch,              'verbrauch',              'WLTP Verbrauch')}
      ${iconRow('rocket',           'text-red-500',     car.nullHundert,            'nullHundert',            '0-100')}
      ${iconRow('gauge',            'text-rose-500',    car.psLeistung,             'psLeistung',             'PS')}
      ${iconRow('wind',             'text-sky-500',     car.hoechstgeschwindigkeit, 'hoechstgeschwindigkeit', 'Top Speed')}
      ${iconRow('cpu',              'text-blue-500',    car.voltArchitektur,        'voltArchitektur',        'Volt')}
    </div>
    
    <div class="border-t border-gray-100 flex bg-gray-50/50">
      <button class="flex-1 flex items-center justify-center gap-1.5 py-3.5 text-xs font-bold text-gray-500 hover:text-teal-600 hover:bg-teal-50 transition-colors"
              data-tco-car-id="${car.id}" title="In TCO-Rechner übernehmen">
        <i data-lucide="calculator" class="w-4 h-4" aria-hidden="true"></i>
        In TCO
      </button>
      ${adminMode ? `
      <div class="w-px bg-gray-200 flex-shrink-0 my-2"></div>
      <button class="flex-1 flex items-center justify-center gap-1.5 py-3.5 text-xs font-bold text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              data-edit-id="${car.id}">
        <i data-lucide="pencil" class="w-4 h-4" aria-hidden="true"></i>
        Bearbeiten
      </button>
      <div class="w-px bg-gray-200 flex-shrink-0 my-2"></div>
      <button class="flex-1 flex items-center justify-center gap-1.5 py-3.5 text-xs font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
              data-delete-id="${car.id}" aria-label="${escapeHtml(car.marke)} ${escapeHtml(car.modell)} entfernen">
        <i data-lucide="trash-2" class="w-4 h-4" aria-hidden="true"></i>
        Löschen
      </button>` : ''}
    </div>
    ${missingSection}
  </article>`;
}
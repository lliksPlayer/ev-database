'use strict';

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Aktualisiert die Highlight-Karten. */
function renderHighlights() {
  const cars = state.visible;

  const bestR  = cars.reduce((b, c) => (c.gesamtreichweite ?? -Infinity) > (b?.gesamtreichweite ?? -Infinity) ? c : b, null);
  const bestPS = cars.reduce((b, c) => (c.psLeistung      ?? -Infinity) > (b?.psLeistung      ?? -Infinity) ? c : b, null);

  document.getElementById('hlReichweiteVal').textContent = bestR  ? fmt(bestR.gesamtreichweite,  'gesamtreichweite')  + ' km' : '–';
  document.getElementById('hlReichweiteNam').textContent = bestR  ? `${bestR.marke} ${bestR.modell}`  : '–';
  document.getElementById('hlPSVal').textContent         = bestPS ? fmt(bestPS.psLeistung, 'psLeistung') + ' PS'  : '–';
  document.getElementById('hlPSNam').textContent         = bestPS ? `${bestPS.marke} ${bestPS.modell}` : '–';
}

/** Rendert alle Fahrzeug-Karten neu. */
function renderCards() {
  const grid    = document.getElementById('carsGrid');
  const emptyEl = document.getElementById('emptyState');
  const countEl = document.getElementById('carCount');

  countEl.textContent = `${state.cars.length} Fahrzeug${state.cars.length !== 1 ? 'e' : ''}`;

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
  grid.innerHTML = state.visible.map(car => buildCardHTML(car)).join('');
  lucide.createIcons();

  // In TCO übernehmen (Weiterleitung zur Hauptseite)
  grid.querySelectorAll('[data-tco-ice-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const car = state.cars.find(c => c.id === btn.dataset.tcoIceId);
      if (car) {
        localStorage.setItem('tcoImportIce', JSON.stringify({
          id: car.id,
          preis: car.basisPreis,
          verbrauch: car.verbrauch,
          marke: car.marke,
          modell: car.modell
        }));
        window.location.href = 'index.html#tcoSection';
      }
    });
  });

  // Bearbeiten / Löschen Events (nur wenn Admin-Modus an ist)
  grid.querySelectorAll('[data-delete-id]').forEach(btn => {
    btn.addEventListener('click', () => deleteCar(btn.dataset.deleteId));
  });
  grid.querySelectorAll('[data-edit-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const car = state.cars.find(c => c.id === btn.dataset.editId);
      if (car) openEditModal(car);
    });
  });
}

/** Kraftstoffart → Badge-Farbe (angepasst an Clean UI) */
function kraftstoffColor(art) {
  if (!art) return { bg: 'bg-white border-gray-200', text: 'text-gray-600' };
  const a = art.toLowerCase();
  if (a.includes('diesel'))          return { bg: 'bg-amber-50 border-amber-200',  text: 'text-amber-700' };
  if (a.includes('benzin') || a.includes('petrol')) return { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' };
  if (a.includes('hybrid'))          return { bg: 'bg-teal-50 border-teal-200',  text: 'text-teal-700' };
  return { bg: 'bg-gray-50 border-gray-200', text: 'text-gray-600' };
}

/** Erzeugt das HTML einer einzelnen ICE-Fahrzeug-Karte. */
function buildCardHTML(car) {
  const unit = (key) => FIELDS.find(f => f.key === key)?.unit ?? '';

  const iconRow = (icon, color, val, key, label) => {
    if (val == null || isNaN(val)) return '';
    return `<div class="flex items-center gap-2">
      <i data-lucide="${icon}" class="w-4 h-4 ${color} flex-shrink-0"></i>
      <div class="min-w-0 flex flex-col justify-center">
        <p class="text-gray-900 text-sm font-black leading-none flex items-center">${fmt(val, key)}<span class="text-gray-400 font-medium text-[10px] ml-1 uppercase">${unit(key)}</span></p>
        <p class="text-gray-500 text-[10px] mt-0.5 font-bold uppercase tracking-widest truncate">${label}</p>
      </div>
    </div>`;
  };

  const kc = kraftstoffColor(car.kraftstoffart);

  return `
  <article class="bg-white border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-lg rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1" data-id="${car.id}">
    
    <div class="px-6 pt-6 pb-4 flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-orange-600 text-[10px] font-bold uppercase tracking-widest mb-1">${escapeHtml(car.marke)}</p>
        <h3 class="text-gray-900 text-xl font-black leading-tight truncate">${escapeHtml(car.modell)}</h3>
      </div>
      <div class="flex flex-col items-end gap-1.5 flex-shrink-0">
        ${car.kraftstoffart ? `<span class="px-2.5 py-1 ${kc.bg} border ${kc.text} text-[10px] font-bold uppercase tracking-widest rounded-full shadow-sm">${escapeHtml(car.kraftstoffart)}</span>` : ''}
        ${car.markteinfuehrung ? `<span class="px-2.5 py-1 bg-white border border-gray-200 shadow-sm text-gray-600 text-[10px] font-bold uppercase tracking-widest rounded-full">${escapeHtml(String(car.markteinfuehrung))}</span>` : ''}
      </div>
    </div>

    <div class="px-6 pb-5 grid grid-cols-2 gap-4">
      <div class="bg-blue-50/50 border border-blue-100 rounded-xl p-3.5">
        <p class="text-blue-500 text-[10px] font-bold uppercase tracking-widest mb-1">Reichweite</p>
        <p class="text-blue-700 text-2xl font-black leading-none">${car.gesamtreichweite != null ? fmt(car.gesamtreichweite, 'gesamtreichweite') : '–'}<span class="text-sm font-bold text-blue-400 ml-0.5">${car.gesamtreichweite != null ? ' km' : ''}</span></p>
      </div>
      <div class="bg-teal-50/50 border border-teal-100 rounded-xl p-3.5">
        <p class="text-teal-600 text-[10px] font-bold uppercase tracking-widest mb-1">Basis Preis</p>
        <p class="text-teal-700 text-2xl font-black leading-none">${car.basisPreis != null ? fmt(car.basisPreis, 'basisPreis') : '–'}</p>
      </div>
    </div>

    <div class="mx-6 border-t border-gray-100"></div>

    <div class="px-6 py-5 grid grid-cols-2 gap-x-4 gap-y-4 flex-1">
      ${iconRow('droplets',  'text-blue-500',    car.tankinhalt,            'tankinhalt',            'Tankinhalt')}
      ${iconRow('activity',  'text-violet-500',  car.verbrauch,             'verbrauch',             'Verbrauch')}
      ${iconRow('truck',     'text-amber-600',   car.anhaengelast,          'anhaengelast',          'Anhängelast')}
      ${iconRow('rocket',    'text-red-500',     car.nullHundert,           'nullHundert',           '0-100')}
      ${iconRow('gauge',     'text-rose-500',    car.psLeistung,            'psLeistung',            'PS')}
      ${iconRow('wind',      'text-sky-500',     car.hoechstgeschwindigkeit,'hoechstgeschwindigkeit','Top Speed')}
      ${iconRow('cpu',       'text-slate-500',   car.bordnetzspannung,      'bordnetzspannung',      'Bordnetz')}
    </div>

    <div class="border-t border-gray-100 flex bg-gray-50/50">
      
      <button class="flex-1 flex items-center justify-center gap-1.5 py-3.5 text-xs font-bold text-gray-500 hover:text-orange-600 hover:bg-orange-50 transition-colors"
              data-tco-ice-id="${car.id}" title="In TCO-Rechner übernehmen">
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
      </button>
      ` : ''}
    </div>
  </article>`;
}
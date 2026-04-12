import { FIELDS } from './config.js';
import { state } from './state.js';
import { refresh } from './ui.js';

/** Baut die Filter-Schieberegler aus den aktuellen Bounds neu auf. */
export function buildFilterPanel() {
  const container = document.getElementById('filterSliders');
  container.innerHTML = '';

  FIELDS.forEach(({ key, label, unit, step }) => {
    const { min, max } = state.bounds[key] ?? { min: 0, max: 0 };
    const cur = state.filters[key] ?? { min, max };
    const id  = `filter-${key}`;

    const el = document.createElement('div');
    el.className = 'flex flex-col gap-2';
    el.innerHTML = `
      <label class="text-xs font-bold text-gray-500 uppercase tracking-wider">
        ${label} <span class="text-gray-300 font-normal normal-case">(${unit})</span>
      </label>
      <div class="flex items-center gap-2">
        <input class="w-14 h-7 px-1.5 text-xs text-center text-gray-700 bg-white border border-gray-200 rounded-lg focus:border-teal-400 focus:outline-none"
               type="number" id="${id}-min" value="${cur.min}" min="${min}" max="${max}" step="${step}" aria-label="${label} Minimum" />
        <input type="range" id="${id}-slider-min" value="${cur.min}" min="${min}" max="${max}" step="${step}" class="flex-1" />
        <span class="text-xs text-gray-300 flex-shrink-0">–</span>
        <input type="range" id="${id}-slider-max" value="${cur.max}" min="${min}" max="${max}" step="${step}" class="flex-1" />
        <input class="w-14 h-7 px-1.5 text-xs text-center text-gray-700 bg-white border border-gray-200 rounded-lg focus:border-teal-400 focus:outline-none"
               type="number" id="${id}-max" value="${cur.max}" min="${min}" max="${max}" step="${step}" aria-label="${label} Maximum" />
      </div>`;

    container.appendChild(el);

    const numMin    = el.querySelector(`#${id}-min`);
    const numMax    = el.querySelector(`#${id}-max`);
    const sliderMin = el.querySelector(`#${id}-slider-min`);
    const sliderMax = el.querySelector(`#${id}-slider-max`);

    function applyFilter() {
      let fMin = parseFloat(numMin.value);
      let fMax = parseFloat(numMax.value);
      if (isNaN(fMin)) fMin = min;
      if (isNaN(fMax)) fMax = max;
      if (fMin > fMax) [fMin, fMax] = [fMax, fMin];
      numMin.value = sliderMin.value = fMin;
      numMax.value = sliderMax.value = fMax;
      if (fMin === min && fMax === max) delete state.filters[key];
      else state.filters[key] = { min: fMin, max: fMax };
      refresh();
    }

    sliderMin.addEventListener('input',  () => { numMin.value = sliderMin.value; applyFilter(); });
    sliderMax.addEventListener('input',  () => { numMax.value = sliderMax.value; applyFilter(); });
    numMin.addEventListener('change',    applyFilter);
    numMax.addEventListener('change',    applyFilter);
    numMin.addEventListener('keydown',   e => { if (e.key === 'Enter') applyFilter(); });
    numMax.addEventListener('keydown',   e => { if (e.key === 'Enter') applyFilter(); });
  });
}

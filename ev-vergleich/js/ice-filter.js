'use strict';

/** Wendet Filter und Sortierung an → füllt state.visible. */
function applyFiltersAndSort() {
  let cars = [...state.cars];

  // Suche (Marke + Modell)
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    cars = cars.filter(c =>
      (c.marke  ?? '').toLowerCase().includes(q) ||
      (c.modell ?? '').toLowerCase().includes(q)
    );
  }

  // Kraftstoffart-Filter (Text-Filter)
  if (state.kraftstoffFilter) {
    const kf = state.kraftstoffFilter.toLowerCase();
    cars = cars.filter(c =>
      !c.kraftstoffart || c.kraftstoffart.toLowerCase().includes(kf)
    );
  }

  // Numerische Range-Filter
  Object.entries(state.filters).forEach(([key, { min, max }]) => {
    cars = cars.filter(car => {
      const v = car[key];
      return v == null || (v >= min && v <= max);
    });
  });

  // Sortierung
  const { sortKey, sortDir } = state;
  cars.sort((a, b) => {
    const av = a[sortKey], bv = b[sortKey];
    if (typeof av === 'string' || typeof bv === 'string') {
      return sortDir === 'asc'
        ? String(av ?? '').localeCompare(String(bv ?? ''), 'de')
        : String(bv ?? '').localeCompare(String(av ?? ''), 'de');
    }
    if (av == null) return 1;
    if (bv == null) return -1;
    return sortDir === 'asc' ? av - bv : bv - av;
  });

  state.visible = cars;
}

// ── Zahlenformatierung ─────────────────────────────────────────────────────────
const FMT_DE  = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 });
const FMT_EUR = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

function fmt(val, key) {
  if (val == null || isNaN(val)) return '–';
  return key === 'basisPreis' ? FMT_EUR.format(val) : FMT_DE.format(val);
}

'use strict';

/** Wendet alle aktiven Filter an und sortiert das Ergebnis in state.visible. */
function applyFiltersAndSort() {
  let cars = [...state.cars];

  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    cars = cars.filter(c =>
      (c.marke  ?? '').toLowerCase().includes(q) ||
      (c.modell ?? '').toLowerCase().includes(q)
    );
  }

  Object.entries(state.filters).forEach(([key, { min, max }]) => {
    cars = cars.filter(car => {
      const v = car[key];
      return v == null || (v >= min && v <= max);
    });
  });

  // Kaufberater: Autos mit einem "harten" No-go (>15% von der Schwelle) ausblenden
  if (typeof advisorActive !== 'undefined' && advisorActive) {
    cars = cars.filter(car =>
      !FIELDS.some(({ key }) => {
        const { enabled, ok } = advisorConfig[key];
        if (!enabled || ok == null) return false;
        const val = car[key];
        if (val == null || isNaN(val)) return false;
        return getFieldStatus(val, key) === 'nogo';
      })
    );
  }

  const { sortKey, sortDir } = state;

  if (sortKey === 'advisor') {
    cars.sort((a, b) => getCarScore(b) - getCarScore(a));
  } else {
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
  }

  state.visible = cars;
}

// Zahlenformatierung
const FMT_DE  = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 });
const FMT_EUR = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

function fmt(val, key) {
  if (val == null || isNaN(val)) return '–';
  return key === 'basisPreis' ? FMT_EUR.format(val) : FMT_DE.format(val);
}

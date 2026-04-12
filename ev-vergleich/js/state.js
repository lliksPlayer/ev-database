export const state = {
  cars:        [],        // alle geladenen Autos (EV, aus Firestore)
  iceCars:     [],        // importierte Verbrenner-Daten (lokal, für TCO)
  visible:     [],        // gefiltert + sortiert
  viewSize:    'medium',  // 'large' | 'medium' | 'small'
  sortKey:     'wltpReichweite',
  sortDir:     'desc',    // 'desc' | 'asc'
  filters:     {},        // { feldKey: { min, max } }
  bounds:      {},        // Wertebereich je Feld
  searchQuery: '',        // Suchtext für Marke/Modell
};

export let adminMode  = false;  // true = Admin-Modus
export let editCarId  = null;   // ID des zu bearbeitenden Autos (null = Neu-Modus)

export let _nextId = 1; // Zähler für lokale IDs (wird von storage.js nach dem Laden korrigiert)
export const uid = () => String(_nextId++);

// Setter für Module, die diese Variablen schreiben müssen
export function setAdminMode(v)  { adminMode  = v; }
export function setEditCarId(v)  { editCarId  = v; }
export function setNextId(v)     { _nextId    = v; }

export function round2(n) { return Math.round(n * 100) / 100; }

export function calcDerived(car) {
  // Number() konvertiert Strings → Zahlen; NaN bei ungültigen Werten
  const bn  = car.batterieNetto  != null ? Number(car.batterieNetto)  : NaN;
  const lz  = car.ladezeit       != null ? Number(car.ladezeit)       : NaN;
  const rei = car.wltpReichweite != null ? Number(car.wltpReichweite) : NaN;

  // kWh nach 70% = Batterie Netto × 0,7
  car.geladeneEnergie = isFinite(bn)  && bn  > 0
    ? round2(bn * 0.7) : null;

  // kWh/min = kWh nach 70% / Ladezeit (10%–80%)
  car.ladespeed = car.geladeneEnergie != null && isFinite(lz) && lz > 0
    ? round2(car.geladeneEnergie / lz) : null;

  // WLTP Verbrauch = Batterie Netto / WLTP × 100
  car.verbrauch = isFinite(bn)  && bn  > 0 && isFinite(rei) && rei > 0
    ? round2((bn / rei) * 100) : null;

  return car;
}

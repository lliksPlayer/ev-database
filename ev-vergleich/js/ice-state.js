'use strict';

const state = {
  cars:             [],         // alle ICE-Fahrzeuge (aus Firestore)
  visible:          [],         // gefiltert + sortiert
  viewSize:         'medium',   // 'large' | 'medium' | 'small'
  sortKey:          'gesamtreichweite',
  sortDir:          'desc',
  filters:          {},
  bounds:           {},
  searchQuery:      '',
  kraftstoffFilter: '',         // Text-Filter für Kraftstoffart
};

let adminMode = false;
let editCarId = null;

var _nextId = 1;
const uid = () => String(_nextId++);

function round2(n) { return Math.round(n * 100) / 100; }

/**
 * Berechnet abgeleitete ICE-Felder:
 *   gesamtreichweite = tankinhalt / verbrauch × 100  (wenn nicht bereits gesetzt)
 */
function calcDerived(car) {
  const tank = car.tankinhalt != null ? Number(car.tankinhalt) : NaN;
  const verb = car.verbrauch  != null ? Number(car.verbrauch)  : NaN;
  if (!car.gesamtreichweite) {
    car.gesamtreichweite = (isFinite(tank) && tank > 0 && isFinite(verb) && verb > 0)
      ? Math.round(tank / verb * 100)
      : null;
  }
  return car;
}

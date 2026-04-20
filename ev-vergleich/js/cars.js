import { state } from './state.js';
import { parseCSV } from './csv.js';
import { saveCarToCloud, updateCarInCloud, deleteCarFromCloud, saveIceCarsToCloud } from './firebase-db.js';
import { toast } from './toast.js';
import { refresh } from './ui.js';
import { refreshTCOCarSelects } from './tco.js';

const num = (formData, k) => { const v = parseFloat(formData[k]); return isNaN(v) ? null : v; };

export function addCar(formData) {
  const car = {
    marke:                 (formData.marke  || '').trim(),
    modell:                (formData.modell || '').trim(),
    markteinfuehrung:      (formData.markteinfuehrung || '').trim() || null,
    batterieNetto:         num(formData, 'batterieNetto'),
    ladezeit:              num(formData, 'ladezeit'),
    maxLadeleistung:       num(formData, 'maxLadeleistung'),
    anhaengelast:          num(formData, 'anhaengelast'),
    wltpReichweite:        num(formData, 'wltpReichweite'),
    basisPreis:            num(formData, 'basisPreis'),
    nullHundert:           num(formData, 'nullHundert'),
    psLeistung:            num(formData, 'psLeistung'),
    hoechstgeschwindigkeit:num(formData, 'hoechstgeschwindigkeit'),
    voltArchitektur:       num(formData, 'voltArchitektur'),
  };

  const isDuplicate = state.cars.some(c =>
    (c.marke  || '').trim().toLowerCase() === car.marke.toLowerCase() &&
    (c.modell || '').trim().toLowerCase() === car.modell.toLowerCase()
  );
  if (isDuplicate) {
    toast(`${car.marke} ${car.modell} ist bereits vorhanden und wurde nicht hinzugefügt.`, 'info');
    return;
  }

  saveCarToCloud(car);
  toast(`${car.marke} ${car.modell} hinzugefügt`, 'success');
}

export function deleteCar(id) {
  const car = state.cars.find(c => c.id === id);
  if (!car) return;
  deleteCarFromCloud(id);
  toast(`${car.marke} ${car.modell} entfernt`);
}

export function updateCar(id, formData) {
  const updates = {
    marke:                 (formData.marke  || '').trim(),
    modell:                (formData.modell || '').trim(),
    markteinfuehrung:      (formData.markteinfuehrung || '').trim() || null,
    batterieNetto:         num(formData, 'batterieNetto'),
    ladezeit:              num(formData, 'ladezeit'),
    maxLadeleistung:       num(formData, 'maxLadeleistung'),
    anhaengelast:          num(formData, 'anhaengelast'),
    wltpReichweite:        num(formData, 'wltpReichweite'),
    basisPreis:            num(formData, 'basisPreis'),
    nullHundert:           num(formData, 'nullHundert'),
    psLeistung:            num(formData, 'psLeistung'),
    hoechstgeschwindigkeit:num(formData, 'hoechstgeschwindigkeit'),
    voltArchitektur:       num(formData, 'voltArchitektur'),
  };
  updateCarInCloud(id, updates);
  toast(`${updates.marke} ${updates.modell} aktualisiert`, 'success');
}

export function loadCSVFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const newCars = parseCSV(e.target.result);
      if (newCars.length === 0) throw new Error('Keine Datensätze in der CSV gefunden.');

      let added = 0;
      for (const car of newCars) {
        const exists = state.cars.some(c =>
          (c.marke  || '').trim().toLowerCase() === (car.marke  || '').trim().toLowerCase() &&
          (c.modell || '').trim().toLowerCase() === (car.modell || '').trim().toLowerCase()
        );
        if (!exists) { saveCarToCloud(car); added++; }
      }

      state.filters = {};
      const skipped = newCars.length - added;
      let msg = `${added} neue${added !== 1 ? ' Autos' : 's Auto'} aus CSV hochgeladen`;
      if (skipped > 0) msg += ` (${skipped} bereits vorhanden, übersprungen)`;
      toast(msg, 'success');
    } catch (err) {
      toast('Fehler beim Laden: ' + err.message, 'error');
      console.error(err);
    }
  };
  reader.onerror = () => toast('Datei konnte nicht gelesen werden.', 'error');
  reader.readAsText(file, 'UTF-8');
}

export function loadIceCSVFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      // parseIceCSV wird von ice-csv.js als window.parseIceCSV bereitgestellt
      const newCars = window.parseIceCSV(e.target.result);
      if (newCars.length === 0) throw new Error('Keine Datensätze in der CSV gefunden.');
      state.iceCars = newCars;
      saveIceCarsToCloud(newCars);
      refreshTCOCarSelects();
      toast(`${newCars.length} Verbrenner importiert – jetzt im TCO-Rechner auswählbar`, 'success');
    } catch (err) {
      toast('Fehler beim Laden: ' + err.message, 'error');
      console.error(err);
    }
  };
  reader.onerror = () => toast('Datei konnte nicht gelesen werden.', 'error');
  reader.readAsText(file, 'UTF-8');
}

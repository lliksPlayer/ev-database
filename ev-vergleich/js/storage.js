'use strict';

const LS_KEY = 'ev-vergleich-v1-cars';

/** Speichert alle aktuellen Autos in localStorage. */
function saveCars() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state.cars));
  } catch (_) {
    // localStorage voll oder nicht verfügbar – ignorieren
  }
}

/**
 * Lädt gespeicherte Autos aus localStorage.
 * Gibt das Array zurück oder null wenn nichts gespeichert ist.
 * Setzt _nextId automatisch auf max(vorhandene IDs) + 1.
 */
function loadSavedCars() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;

    // ID-Zähler so setzen, dass keine Kollisionen entstehen
    const maxId = parsed.reduce((m, c) => Math.max(m, parseInt(c.id) || 0), 0);
    if (maxId >= _nextId) _nextId = maxId + 1;

    // Abgeleitete Felder neu berechnen (für Konsistenz nach App-Updates)
    return parsed.map(c => calcDerived(c));
  } catch (_) {
    return null;
  }
}

/** Löscht alle gespeicherten Daten (für "Alles zurücksetzen"). */
function clearSavedCars() {
  try { localStorage.removeItem(LS_KEY); } catch (_) {}
}

// ─── Firebase SDK (Modular v12) via CDN ───────────────────────────────────────
import { initializeApp }  from 'https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js';
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
} from 'https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js';

// ─── Lokale Module ────────────────────────────────────────────────────────────
import { state, calcDerived } from './state.js';
import { computeBounds } from './csv.js';
import { buildFilterPanel } from './filter-ui.js';
import { refresh, toast } from './ui.js';
import { DEFAULT_CARS } from './data.js';

// ─── Konfiguration ────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            'AIzaSyBh5qTkGH9pm_859sFelGQ5oE5W3tvzuWU',
  authDomain:        'ev-vergleich-c830d.firebaseapp.com',
  projectId:         'ev-vergleich-c830d',
  storageBucket:     'ev-vergleich-c830d.firebasestorage.app',
  messagingSenderId: '615383165570',
  appId:             '1:615383165570:web:25c36ddf70ade3e899e29b',
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

console.log('[Firebase] ✓ App initialisiert, Firestore verbunden');

// ─── Hilfsfunktion: Lokal berechnete Felder vor dem Schreiben entfernen ───────
function stripDerived(car) {
  const { id, geladeneEnergie, ladespeed, verbrauch, ...data } = car;
  // Alle null-Werte durch undefined ersetzen, damit Firestore sie ignoriert
  return Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== null && v !== undefined && v !== '')
  );
}

// ─── UI-Aktualisierung nach Datenänderung ─────────────────────────────────────
function updateUI() {
  buildFilterPanel();
  refresh();
}

// ─── Einmalige Migration: localStorage → Firestore ────────────────────────────
/**
 * Prüft ob die Firestore-Collection leer ist und ob localStorage Daten enthält.
 * Wenn ja, werden alle localStorage-Autos einmalig nach Firestore hochgeladen.
 * Danach wird localStorage geleert, damit keine doppelte Datenhaltung entsteht.
 */
async function migrateFromLocalStorageIfNeeded() {
  // Prüfen ob Firestore bereits Daten hat
  const snapshot = await getDocs(collection(db, 'cars'));

  // 1) localStorage-Migration
  const LS_KEY = 'ev-vergleich-v1-cars';
  const raw = localStorage.getItem(LS_KEY);
  if (raw) {
    let localCars;
    try {
      localCars = JSON.parse(raw);
    } catch {
      console.warn('[Firebase] localStorage-Daten konnten nicht gelesen werden.');
    }
    if (Array.isArray(localCars) && localCars.length > 0) {
      if (!snapshot.empty) {
        console.log(`[Firebase] Firestore hat bereits ${snapshot.size} Dokument(e) – localStorage-Migration übersprungen.`);
      } else {
        console.log(`[Firebase] Starte Migration: ${localCars.length} Autos aus localStorage → Firestore`);
        let erfolg = 0;
        for (const car of localCars) {
          try {
            await addDoc(collection(db, 'cars'), stripDerived(car));
            erfolg++;
          } catch (e) {
            console.error('[Firebase] Fehler beim Migrieren eines Autos:', e.message, car);
          }
        }
        console.log(`[Firebase] ✓ Migration abgeschlossen: ${erfolg}/${localCars.length} Autos hochgeladen`);
      }
    }
    localStorage.removeItem(LS_KEY);
    return;
  }

  // 2) Fallback: DEFAULT_CARS aus data.js laden, wenn Firestore leer ist
  if (snapshot.empty) {
    console.log(`[Firebase] Firestore leer – lade ${DEFAULT_CARS.length} Standard-Fahrzeuge aus data.js`);
    let erfolg = 0;
    for (const car of DEFAULT_CARS) {
      try {
        await addDoc(collection(db, 'cars'), stripDerived(car));
        erfolg++;
      } catch (e) {
        console.error('[Firebase] Fehler beim Laden der Standarddaten:', e.message, car);
      }
    }
    console.log(`[Firebase] ✓ Standarddaten geladen: ${erfolg}/${DEFAULT_CARS.length} Autos`);
  } else {
    console.log(`[Firebase] Firestore hat ${snapshot.size} Dokument(e) – keine Migration nötig.`);
  }
}

// ─── Live-Listener: onSnapshot auf Collection "cars" ─────────────────────────
/**
 * Startet einen permanenten Echtzeit-Listener.
 * Feuert sofort beim ersten Laden und bei jeder späteren Änderung.
 */
function listenToCars() {
  console.log('[Firebase] Starte onSnapshot-Listener auf Collection "cars" …');

  onSnapshot(
    collection(db, 'cars'),

    (snapshot) => {
      console.log(`[Firebase] Snapshot empfangen: ${snapshot.size} Dokument(e)`);

      state.cars = snapshot.docs.map(docSnap => {
        const car = { id: docSnap.id, ...docSnap.data() };
        return calcDerived(car);
      });

      computeBounds(state.cars);
      updateUI();
    },

    (error) => {
      console.error('[Firebase] ✗ Listener-Fehler:', error.code, error.message);
      toast(`Datenbankfehler: ${error.message}`, 'error');
    }
  );
}

// ─── Schreibfunktionen ────────────────────────────────────────────────────────

/**
 * Fügt ein neues Auto zur Firestore-Collection "cars" hinzu.
 * Firestore vergibt automatisch eine eindeutige Dokument-ID.
 * onSnapshot reagiert und aktualisiert die UI automatisch.
 */
export async function saveCarToCloud(carObj) {
  console.log('[Firebase] Speichere neues Auto:', carObj.marke, carObj.modell);
  try {
    const docRef = await addDoc(collection(db, 'cars'), stripDerived(carObj));
    console.log('[Firebase] ✓ Auto gespeichert mit ID:', docRef.id);
  } catch (e) {
    console.error('[Firebase] ✗ Speichern fehlgeschlagen:', e.message);
    toast('Speichern fehlgeschlagen: ' + e.message, 'error');
  }
}

/**
 * Aktualisiert ein bestehendes Dokument in Firestore.
 * Nur geänderte Felder werden überschrieben.
 */
export async function updateCarInCloud(id, updates) {
  console.log('[Firebase] Aktualisiere Auto:', id);
  try {
    await updateDoc(doc(db, 'cars', id), stripDerived(updates));
    console.log('[Firebase] ✓ Auto aktualisiert:', id);
  } catch (e) {
    console.error('[Firebase] ✗ Aktualisieren fehlgeschlagen:', e.message);
    toast('Aktualisieren fehlgeschlagen: ' + e.message, 'error');
  }
}

/**
 * Löscht ein Dokument dauerhaft aus Firestore.
 */
export async function deleteCarFromCloud(id) {
  console.log('[Firebase] Lösche Auto:', id);
  try {
    await deleteDoc(doc(db, 'cars', id));
    console.log('[Firebase] ✓ Auto gelöscht:', id);
  } catch (e) {
    console.error('[Firebase] ✗ Löschen fehlgeschlagen:', e.message);
    toast('Löschen fehlgeschlagen: ' + e.message, 'error');
  }
}

// ─── ICE-Fahrzeuge ────────────────────────────────────────────────────────────

function listenToIceCars() {
  onSnapshot(
    collection(db, 'ice_cars'),
    (snapshot) => {
      if (snapshot.empty) return;
      state.iceCars = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      refresh();
    },
    (error) => console.error('[Firebase] iceCars Listener-Fehler:', error.message)
  );
}

export async function saveIceCarsToCloud(cars) {
  try {
    const existing = await getDocs(collection(db, 'ice_cars'));
    for (const d of existing.docs) await deleteDoc(doc(db, 'ice_cars', d.id));
    for (const car of cars) {
      const { id, ...data } = car;
      await addDoc(collection(db, 'ice_cars'), data);
    }
    console.log(`[Firebase] ✓ ${cars.length} Verbrenner gespeichert`);
  } catch (e) {
    console.error('[Firebase] ✗ iceCars speichern fehlgeschlagen:', e.message);
    toast('Verbrenner speichern fehlgeschlagen: ' + e.message, 'error');
  }
}

// ─── Start ────────────────────────────────────────────────────────────────────
// Reihenfolge: erst Migration (einmalig), dann Live-Listener starten.
// migrateFromLocalStorageIfNeeded ist async – listenToCars() startet danach,
// damit der erste Snapshot die bereits migrierten Daten enthält.
(async () => {
  await migrateFromLocalStorageIfNeeded();
  listenToCars();
  listenToIceCars();
})();

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
} from 'https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js';

// ─── Konfiguration (gleiches Projekt wie EV-Seite) ────────────────────────────
const firebaseConfig = {
  apiKey:            'AIzaSyBh5qTkGH9pm_859sFelGQ5oE5W3tvzuWU',
  authDomain:        'ev-vergleich-c830d.firebaseapp.com',
  projectId:         'ev-vergleich-c830d',
  storageBucket:     'ev-vergleich-c830d.firebasestorage.app',
  messagingSenderId: '615383165570',
  appId:             '1:615383165570:web:25c36ddf70ade3e899e29b',
};

const app = initializeApp(firebaseConfig, 'ice-app');
const db  = getFirestore(app);

console.log('[ICE-Firebase] ✓ App initialisiert, Firestore (ice_cars) verbunden');

// ─── Abgeleitete Felder vor dem Schreiben entfernen ───────────────────────────
function stripDerived(car) {
  const { id, gesamtreichweite, ...data } = car;
  // Wenn gesamtreichweite explizit gesetzt wurde (nicht abgeleitet), behalten
  if (car.gesamtreichweite != null) data.gesamtreichweite = car.gesamtreichweite;
  return Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== null && v !== undefined && v !== '')
  );
}

// ─── ICE-abgeleitete Felder berechnen (lokal, für onSnapshot) ─────────────────
function calcDerivedLocal(car) {
  const tank = car.tankinhalt != null ? Number(car.tankinhalt) : NaN;
  const verb = car.verbrauch  != null ? Number(car.verbrauch)  : NaN;
  if (!car.gesamtreichweite) {
    car.gesamtreichweite = (isFinite(tank) && tank > 0 && isFinite(verb) && verb > 0)
      ? Math.round(tank / verb * 100)
      : null;
  }
  return car;
}

// ─── UI-Aktualisierung ────────────────────────────────────────────────────────
function updateUI() {
  if (typeof buildFilterPanel === 'function') buildFilterPanel();
  if (typeof refresh          === 'function') refresh();
}

// ─── Live-Listener: onSnapshot auf Collection "ice_cars" ─────────────────────
function listenToIceCars() {
  console.log('[ICE-Firebase] Starte onSnapshot-Listener auf Collection "ice_cars" …');
  onSnapshot(
    collection(db, 'ice_cars'),
    (snapshot) => {
      console.log(`[ICE-Firebase] Snapshot: ${snapshot.size} Dokument(e)`);
      state.cars = snapshot.docs.map(docSnap => {
        const car = { id: docSnap.id, ...docSnap.data() };
        return calcDerivedLocal(car);
      });
      if (state.cars.length > 0 && typeof computeBounds === 'function') {
        computeBounds(state.cars);
      }
      updateUI();
    },
    (error) => {
      console.error('[ICE-Firebase] ✗ Listener-Fehler:', error.code, error.message);
      if (typeof toast === 'function') toast(`Datenbankfehler: ${error.message}`, 'error');
    }
  );
}

// ─── Schreibfunktionen ────────────────────────────────────────────────────────
async function saveIceCarToCloud(carObj) {
  try {
    const docRef = await addDoc(collection(db, 'ice_cars'), stripDerived(carObj));
    console.log('[ICE-Firebase] ✓ Fahrzeug gespeichert:', docRef.id);
  } catch (e) {
    console.error('[ICE-Firebase] ✗ Speichern fehlgeschlagen:', e.message);
    if (typeof toast === 'function') toast('Speichern fehlgeschlagen: ' + e.message, 'error');
  }
}

async function updateIceCarInCloud(id, updates) {
  try {
    await updateDoc(doc(db, 'ice_cars', id), stripDerived(updates));
    console.log('[ICE-Firebase] ✓ Fahrzeug aktualisiert:', id);
  } catch (e) {
    console.error('[ICE-Firebase] ✗ Aktualisieren fehlgeschlagen:', e.message);
    if (typeof toast === 'function') toast('Aktualisieren fehlgeschlagen: ' + e.message, 'error');
  }
}

async function deleteIceCarFromCloud(id) {
  try {
    await deleteDoc(doc(db, 'ice_cars', id));
    console.log('[ICE-Firebase] ✓ Fahrzeug gelöscht:', id);
  } catch (e) {
    console.error('[ICE-Firebase] ✗ Löschen fehlgeschlagen:', e.message);
    if (typeof toast === 'function') toast('Löschen fehlgeschlagen: ' + e.message, 'error');
  }
}

// ─── Globale Exports für klassische (non-module) Scripts ──────────────────────
window.saveIceCarToCloud     = saveIceCarToCloud;
window.updateIceCarInCloud   = updateIceCarInCloud;
window.deleteIceCarFromCloud = deleteIceCarFromCloud;

// ─── Start ────────────────────────────────────────────────────────────────────
listenToIceCars();

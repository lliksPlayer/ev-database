'use strict';

// ============================================================
//  FIREBASE REALTIME DATABASE – Konfiguration
//  So einrichten (einmalig, ~5 Min):
//
//  1. Gehe zu: https://console.firebase.google.com
//  2. "Projekt hinzufügen" → Name wählen (z.B. "ev-vergleich")
//  3. Links: "Erstellen" → "Realtime Database" → "Datenbank erstellen"
//     → Standort: europe-west1 → Testmodus (für den Anfang)
//  4. Zahnrad (oben links) → "Projekteinstellungen"
//     → "Deine Apps" → Web-App-Symbol (</>)
//     → App registrieren → unten "firebaseConfig" kopieren
//  5. Die Werte unten eintragen und Datei speichern.
// ============================================================

const FIREBASE_CONFIG = {
  apiKey:            'AIzaSyC3Hu17KVeJ5Gl6tvBTR9z9XbOw_jXgOAs',
  authDomain:        'ev-vergleich.firebaseapp.com',
  // databaseURL: In der Firebase Console unter Realtime Database nachschauen
  // Format: https://ev-vergleich-default-rtdb.firebaseio.com  (USA)
  //     oder https://ev-vergleich-default-rtdb.europe-west1.firebasedatabase.app  (Europa)
  databaseURL:       'https://ev-vergleich-default-rtdb.europe-west1.firebasedatabase.app',
  projectId:         'ev-vergleich',
  storageBucket:     'ev-vergleich.firebasestorage.app',
  messagingSenderId: '983865253331',
  appId:             '1:983865253331:web:0e80feaea96ab05c85e326',
};

// Pfad in der Datenbank wo die Autos gespeichert werden
const FB_PATH = 'ev-cars';

let _db = null;
let _fbListening = false;

/** true wenn Firebase konfiguriert und verbunden ist */
function fbReady() { return _db !== null; }

/**
 * Firebase initialisieren.
 * Wird in events.js vor dem ersten Rendering aufgerufen.
 */
function initFirebase() {
  if (!FIREBASE_CONFIG.databaseURL || FIREBASE_CONFIG.databaseURL.includes('DEIN_')) {
    console.info('[Firebase] databaseURL fehlt – nur localStorage wird verwendet.');
    return;
  }
  try {
    firebase.initializeApp(FIREBASE_CONFIG);
    _db = firebase.database();
    console.info('[Firebase] Verbunden ✓');
  } catch (e) {
    console.warn('[Firebase] Initialisierung fehlgeschlagen:', e.message);
  }
}

/**
 * Alle Autos in Firebase speichern.
 * Wird automatisch von saveCars() aufgerufen.
 */
function fbSaveCars(cars) {
  if (!fbReady()) return;
  _db.ref(FB_PATH).set(cars).catch(e => {
    console.warn('[Firebase] Speichern fehlgeschlagen:', e.message);
  });
}

/**
 * Autos einmalig aus Firebase lesen.
 * Gibt Promise<Array|null> zurück.
 */
async function fbLoadCars() {
  if (!fbReady()) return null;
  try {
    const snap = await _db.ref(FB_PATH).get();
    if (!snap.exists()) return null;
    const data = snap.val();
    return Array.isArray(data) ? data : null;
  } catch (e) {
    console.warn('[Firebase] Laden fehlgeschlagen:', e.message);
    return null;
  }
}

/**
 * Echtzeit-Listener: wird aufgerufen wenn ein anderes Gerät Daten ändert.
 * onUpdate(cars: Array) wird mit den neuen Autos aufgerufen.
 */
function fbListenForChanges(onUpdate) {
  if (!fbReady() || _fbListening) return;
  _fbListening = true;
  _db.ref(FB_PATH).on('value', snap => {
    if (!snap.exists()) return;
    const data = snap.val();
    if (Array.isArray(data)) onUpdate(data);
  }, e => {
    console.warn('[Firebase] Listener-Fehler:', e.message);
  });
}

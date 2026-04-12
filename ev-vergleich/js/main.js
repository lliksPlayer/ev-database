// js/main.js – Einziger Einstiegspunkt der App
//
// Importiert die beiden Module mit Side-Effects:
//   firebase-db.js  → startet Firebase-Verbindung und onSnapshot-Listener
//   events.js       → bindet alle DOM-Event-Listener (DOMContentLoaded)
//
// tco.js, ui.js, render.js etc. werden transitiv durch events.js geladen.

import './firebase-db.js';
import './events.js';

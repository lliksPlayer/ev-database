// js/data.js – Gemeinsame Datenbasis für alle Besucher
// So aktualisieren:
//   1. Als Admin anmelden
//   2. Autos bearbeiten / hinzufügen / löschen
//   3. Button "Exportieren" klicken → data.js wird heruntergeladen
//   4. Diese Datei durch die heruntergeladene ersetzen
//   5. Website neu hochladen → alle Besucher sehen die aktuellen Daten
// Quellen: ev-database.org (April 2026)

export const DEFAULT_CARS = [
  // ─── Bestand ──────────────────────────────────────────────────────────────
  { marke: 'Tesla',      modell: 'Model 3 LR RWD',         batterieNetto: 75,    ladezeit: 25, maxLadeleistung: 170, anhaengelast: 1000, wltpReichweite: 629, basisPreis: 42990,  nullHundert: 5.8, psLeistung: 358,  hoechstgeschwindigkeit: 201, voltArchitektur: 400, markteinfuehrung: '2024-Q1' },
  { marke: 'BYD',        modell: 'Seal AWD',                batterieNetto: 82.56, ladezeit: 30, maxLadeleistung: 150, anhaengelast: 750,  wltpReichweite: 520, basisPreis: 44990,  nullHundert: 3.8, psLeistung: 530,  hoechstgeschwindigkeit: 180, voltArchitektur: 800, markteinfuehrung: '2023-Q3' },
  { marke: 'Hyundai',    modell: 'IONIQ 6 AWD 77',          batterieNetto: 77.4,  ladezeit: 18, maxLadeleistung: 230, anhaengelast: 1600, wltpReichweite: 519, basisPreis: 51900,  nullHundert: 5.1, psLeistung: 325,  hoechstgeschwindigkeit: 185, voltArchitektur: 800, markteinfuehrung: '2023-Q1' },
  { marke: 'Kia',        modell: 'EV6 GT',                  batterieNetto: 77.4,  ladezeit: 18, maxLadeleistung: 240, anhaengelast: 1600, wltpReichweite: 424, basisPreis: 64990,  nullHundert: 3.4, psLeistung: 585,  hoechstgeschwindigkeit: 260, voltArchitektur: 800, markteinfuehrung: '2022-Q4' },
  { marke: 'Mercedes',   modell: 'EQS 450+',                batterieNetto: 107.8, ladezeit: 31, maxLadeleistung: 200, anhaengelast: 750,  wltpReichweite: 782, basisPreis: 109551, nullHundert: 6.2, psLeistung: 333,  hoechstgeschwindigkeit: 210, voltArchitektur: 400, markteinfuehrung: '2022-Q2' },
  { marke: 'Porsche',    modell: 'Taycan Turbo S',          batterieNetto: 97,    ladezeit: 22, maxLadeleistung: 320, anhaengelast: 1000, wltpReichweite: 630, basisPreis: 190983, nullHundert: 2.4, psLeistung: 761,  hoechstgeschwindigkeit: 260, voltArchitektur: 800, markteinfuehrung: '2024-Q1' },
  { marke: 'Volkswagen', modell: 'ID.7 Pro S',              batterieNetto: 86,    ladezeit: 28, maxLadeleistung: 200, anhaengelast: 1200, wltpReichweite: 709, basisPreis: 59995,  nullHundert: 6.5, psLeistung: 286,  hoechstgeschwindigkeit: 180, voltArchitektur: 400, markteinfuehrung: '2023-Q4' },
  { marke: 'BMW',        modell: 'i4 eDrive40',             batterieNetto: 83.9,  ladezeit: 31, maxLadeleistung: 205, anhaengelast: 1600, wltpReichweite: 590, basisPreis: 59100,  nullHundert: 5.7, psLeistung: 340,  hoechstgeschwindigkeit: 190, voltArchitektur: 400, markteinfuehrung: '2022-Q1' },

  // ─── Tesla ────────────────────────────────────────────────────────────────
  { marke: 'Tesla',      modell: 'Model Y LR AWD',          batterieNetto: 75,    ladezeit: 27, maxLadeleistung: 250, anhaengelast: 1600, wltpReichweite: 533, basisPreis: 52990,  nullHundert: 4.8, psLeistung: 514,  hoechstgeschwindigkeit: 217, voltArchitektur: 400, markteinfuehrung: '2025-Q1' },
  { marke: 'Tesla',      modell: 'Model 3 Performance',     batterieNetto: 75,    ladezeit: 27, maxLadeleistung: 250, anhaengelast: null, wltpReichweite: 528, basisPreis: 58470,  nullHundert: 3.4, psLeistung: 627,  hoechstgeschwindigkeit: 262, voltArchitektur: 400, markteinfuehrung: '2024-Q1' },
  { marke: 'Tesla',      modell: 'Model S Plaid',           batterieNetto: 95,    ladezeit: 30, maxLadeleistung: 250, anhaengelast: 1600, wltpReichweite: 617, basisPreis: 120970, nullHundert: 2.4, psLeistung: 1020, hoechstgeschwindigkeit: 282, voltArchitektur: 400, markteinfuehrung: '2022-Q2' },

  // ─── Kia ──────────────────────────────────────────────────────────────────
  { marke: 'Kia',        modell: 'EV6 LR AWD',              batterieNetto: 80,    ladezeit: 17, maxLadeleistung: 263, anhaengelast: 1600, wltpReichweite: 506, basisPreis: 53990,  nullHundert: 5.2, psLeistung: 325,  hoechstgeschwindigkeit: 188, voltArchitektur: 800, markteinfuehrung: '2024-Q1' },
  { marke: 'Kia',        modell: 'EV3 Long Range',          batterieNetto: 78,    ladezeit: 33, maxLadeleistung: 135, anhaengelast: 1000, wltpReichweite: 605, basisPreis: 41390,  nullHundert: 7.7, psLeistung: 204,  hoechstgeschwindigkeit: 170, voltArchitektur: 400, markteinfuehrung: '2024-Q4' },
  { marke: 'Kia',        modell: 'EV9 99.8 AWD',            batterieNetto: 96,    ladezeit: 22, maxLadeleistung: 209, anhaengelast: 2500, wltpReichweite: 541, basisPreis: 68990,  nullHundert: 6.0, psLeistung: 385,  hoechstgeschwindigkeit: 200, voltArchitektur: 800, markteinfuehrung: '2023-Q3' },

  // ─── Hyundai ──────────────────────────────────────────────────────────────
  { marke: 'Hyundai',    modell: 'IONIQ 5 N',               batterieNetto: 80,    ladezeit: 18, maxLadeleistung: 263, anhaengelast: null, wltpReichweite: 448, basisPreis: 74900,  nullHundert: 3.4, psLeistung: 650,  hoechstgeschwindigkeit: 260, voltArchitektur: 800, markteinfuehrung: '2024-Q1' },
  { marke: 'Hyundai',    modell: 'IONIQ 5 84 AWD',          batterieNetto: 80,    ladezeit: 18, maxLadeleistung: 263, anhaengelast: 1600, wltpReichweite: 507, basisPreis: 59900,  nullHundert: 5.3, psLeistung: 325,  hoechstgeschwindigkeit: 185, voltArchitektur: 800, markteinfuehrung: '2024-Q3' },
  { marke: 'Hyundai',    modell: 'IONIQ 6 RWD 77',          batterieNetto: 77.4,  ladezeit: 18, maxLadeleistung: 220, anhaengelast: null, wltpReichweite: 614, basisPreis: 45900,  nullHundert: 7.4, psLeistung: 229,  hoechstgeschwindigkeit: 185, voltArchitektur: 800, markteinfuehrung: '2023-Q1' },

  // ─── BMW ──────────────────────────────────────────────────────────────────
  { marke: 'BMW',        modell: 'i5 eDrive40',             batterieNetto: 81.2,  ladezeit: 29, maxLadeleistung: 206, anhaengelast: 1600, wltpReichweite: 582, basisPreis: 70200,  nullHundert: 6.0, psLeistung: 340,  hoechstgeschwindigkeit: 193, voltArchitektur: 400, markteinfuehrung: '2023-Q2' },
  { marke: 'BMW',        modell: 'iX xDrive50',             batterieNetto: 105.2, ladezeit: 33, maxLadeleistung: 195, anhaengelast: 2500, wltpReichweite: 631, basisPreis: 100100, nullHundert: 4.6, psLeistung: 523,  hoechstgeschwindigkeit: 200, voltArchitektur: 400, markteinfuehrung: '2021-Q4' },

  // ─── Polestar / Volvo ─────────────────────────────────────────────────────
  { marke: 'Polestar',   modell: '2 LR Dual Motor',         batterieNetto: 79,    ladezeit: 32, maxLadeleistung: 207, anhaengelast: 1500, wltpReichweite: 551, basisPreis: 56990,  nullHundert: 4.5, psLeistung: 421,  hoechstgeschwindigkeit: 205, voltArchitektur: 400, markteinfuehrung: '2024-Q2' },
  { marke: 'Polestar',   modell: '3 LR Dual Motor',         batterieNetto: 107,   ladezeit: 32, maxLadeleistung: 250, anhaengelast: 2200, wltpReichweite: 631, basisPreis: 85590,  nullHundert: 5.0, psLeistung: 489,  hoechstgeschwindigkeit: 210, voltArchitektur: 400, markteinfuehrung: '2022-Q4' },
  { marke: 'Volvo',      modell: 'EX40 Twin Motor',         batterieNetto: 79,    ladezeit: 32, maxLadeleistung: 207, anhaengelast: 1500, wltpReichweite: 484, basisPreis: 59590,  nullHundert: 4.8, psLeistung: 408,  hoechstgeschwindigkeit: 180, voltArchitektur: 400, markteinfuehrung: '2024-Q1' },

  // ─── Volkswagen ───────────────────────────────────────────────────────────
  { marke: 'Volkswagen', modell: 'ID.4 Pro',                batterieNetto: 77,    ladezeit: 28, maxLadeleistung: 175, anhaengelast: 1200, wltpReichweite: 522, basisPreis: 46335,  nullHundert: 6.7, psLeistung: 286,  hoechstgeschwindigkeit: 160, voltArchitektur: 400, markteinfuehrung: '2023-Q4' },
  { marke: 'Volkswagen', modell: 'ID.5 GTX',                batterieNetto: 77,    ladezeit: 28, maxLadeleistung: 175, anhaengelast: 1000, wltpReichweite: 480, basisPreis: 56455,  nullHundert: 5.5, psLeistung: 340,  hoechstgeschwindigkeit: 180, voltArchitektur: 400, markteinfuehrung: '2023-Q4' },

  // ─── Renault ──────────────────────────────────────────────────────────────
  { marke: 'Renault',    modell: 'Scenic E-Tech EV87',      batterieNetto: 87,    ladezeit: 40, maxLadeleistung: 150, anhaengelast: 1100, wltpReichweite: 620, basisPreis: 48900,  nullHundert: 7.9, psLeistung: 218,  hoechstgeschwindigkeit: 170, voltArchitektur: 400, markteinfuehrung: '2023-Q4' },

  // ─── Audi ─────────────────────────────────────────────────────────────────
  { marke: 'Audi',       modell: 'e-tron GT quattro',       batterieNetto: 97,    ladezeit: 16, maxLadeleistung: 322, anhaengelast: null, wltpReichweite: 609, basisPreis: 108900, nullHundert: 4.0, psLeistung: 585,  hoechstgeschwindigkeit: 245, voltArchitektur: 800, markteinfuehrung: '2025-Q2' },
  { marke: 'Audi',       modell: 'RS e-tron GT',            batterieNetto: 97,    ladezeit: 16, maxLadeleistung: 322, anhaengelast: null, wltpReichweite: 598, basisPreis: 147500, nullHundert: 2.8, psLeistung: 857,  hoechstgeschwindigkeit: 250, voltArchitektur: 800, markteinfuehrung: '2024-Q2' },

  // ─── Mercedes ─────────────────────────────────────────────────────────────
  { marke: 'Mercedes',   modell: 'EQE 350+',                batterieNetto: 96,    ladezeit: 30, maxLadeleistung: 173, anhaengelast: 750,  wltpReichweite: 654, basisPreis: 71412,  nullHundert: 6.1, psLeistung: 320,  hoechstgeschwindigkeit: 210, voltArchitektur: 400, markteinfuehrung: '2025-Q2' },
  { marke: 'Mercedes',   modell: 'EQA 250',                 batterieNetto: 66.5,  ladezeit: 29, maxLadeleistung: 112, anhaengelast: 750,  wltpReichweite: 500, basisPreis: 50777,  nullHundert: 8.6, psLeistung: 190,  hoechstgeschwindigkeit: 160, voltArchitektur: 400, markteinfuehrung: '2023-Q4' },

  // ─── Lucid ────────────────────────────────────────────────────────────────
  { marke: 'Lucid',      modell: 'Air Grand Touring',       batterieNetto: 117,   ladezeit: 27, maxLadeleistung: 300, anhaengelast: null, wltpReichweite: 859, basisPreis: 130900, nullHundert: 3.2, psLeistung: 831,  hoechstgeschwindigkeit: 270, voltArchitektur: 800, markteinfuehrung: '2024-Q3' },

  // ─── Porsche ──────────────────────────────────────────────────────────────
  { marke: 'Porsche',    modell: 'Taycan',                  batterieNetto: 82.3,  ladezeit: 19, maxLadeleistung: 270, anhaengelast: 1000, wltpReichweite: 590, basisPreis: 101500, nullHundert: 4.8, psLeistung: 408,  hoechstgeschwindigkeit: 230, voltArchitektur: 800, markteinfuehrung: '2024-Q1' },
];

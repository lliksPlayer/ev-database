// js/data.js – Gemeinsame Datenbasis für alle Besucher
// So aktualisieren:
//   1. Als Admin anmelden
//   2. Autos bearbeiten / hinzufügen / löschen
//   3. Button "Exportieren" klicken → data.js wird heruntergeladen
//   4. Diese Datei durch die heruntergeladene ersetzen
//   5. Website neu hochladen → alle Besucher sehen die aktuellen Daten

const DEFAULT_CARS = [
  { marke: 'Tesla',      modell: 'Model 3 LR RWD',   batterieNetto: 75,    ladezeit: 25, maxLadeleistung: 170, anhaengelast: null, wltpReichweite: 629, basisPreis: 42990,  nullHundert: 5.8, psLeistung: 358, hoechstgeschwindigkeit: 201, voltArchitektur: 400, markteinfuehrung: '2024-Q1' },
  { marke: 'BYD',        modell: 'Seal AWD',          batterieNetto: 82.56, ladezeit: 30, maxLadeleistung: 150, anhaengelast: 750,  wltpReichweite: 520, basisPreis: 44990,  nullHundert: 3.8, psLeistung: 530, hoechstgeschwindigkeit: 180, voltArchitektur: 800, markteinfuehrung: '2023-Q3' },
  { marke: 'Hyundai',    modell: 'IONIQ 6 AWD 77',    batterieNetto: 77.4,  ladezeit: 18, maxLadeleistung: 230, anhaengelast: 1600, wltpReichweite: 519, basisPreis: 51900,  nullHundert: 5.1, psLeistung: 325, hoechstgeschwindigkeit: 185, voltArchitektur: 800, markteinfuehrung: '2023-Q1' },
  { marke: 'Kia',        modell: 'EV6 GT',            batterieNetto: 77.4,  ladezeit: 18, maxLadeleistung: 240, anhaengelast: 1600, wltpReichweite: 424, basisPreis: 64990,  nullHundert: 3.4, psLeistung: 585, hoechstgeschwindigkeit: 260, voltArchitektur: 800, markteinfuehrung: '2022-Q4' },
  { marke: 'Mercedes',   modell: 'EQS 450+',          batterieNetto: 107.8, ladezeit: 31, maxLadeleistung: 200, anhaengelast: 750,  wltpReichweite: 782, basisPreis: 109551, nullHundert: 6.2, psLeistung: 333, hoechstgeschwindigkeit: 210, voltArchitektur: 400, markteinfuehrung: '2022-Q2' },
  { marke: 'Porsche',    modell: 'Taycan Turbo S',    batterieNetto: 97,    ladezeit: 22, maxLadeleistung: 320, anhaengelast: 1000, wltpReichweite: 630, basisPreis: 190983, nullHundert: 2.4, psLeistung: 761, hoechstgeschwindigkeit: 260, voltArchitektur: 800, markteinfuehrung: '2024-Q1' },
  { marke: 'Volkswagen', modell: 'ID.7 Pro S',        batterieNetto: 86,    ladezeit: 28, maxLadeleistung: 200, anhaengelast: 1200, wltpReichweite: 709, basisPreis: 59995,  nullHundert: 6.5, psLeistung: 286, hoechstgeschwindigkeit: 180, voltArchitektur: 400, markteinfuehrung: '2023-Q4' },
  { marke: 'BMW',        modell: 'i4 eDrive40',       batterieNetto: 83.9,  ladezeit: 31, maxLadeleistung: 205, anhaengelast: 1600, wltpReichweite: 590, basisPreis: 59100,  nullHundert: 5.7, psLeistung: 340, hoechstgeschwindigkeit: 190, voltArchitektur: 400, markteinfuehrung: '2022-Q1' },
];

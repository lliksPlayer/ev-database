// ─── Einmaliger Firestore-Patch: fehlende Anhängelasten nachtragen ────────────
// Ausführen: Browser-Konsole auf der EV-Vergleich-Website öffnen,
//            diesen Code hineinkopieren und Enter drücken.
//
// Quellen: ev-database.org / mercedes-benz.de (April 2026)
// ─────────────────────────────────────────────────────────────────────────────

const PATCHES = [
  { marke: 'Tesla',   modell: 'Model 3 LR RWD',      anhaengelast: 1000 },
  { marke: 'Tesla',   modell: 'Model S Plaid',        anhaengelast: 1600 },
  { marke: 'Kia',     modell: 'EV3 Long Range',       anhaengelast: 1000 },
  { marke: 'Renault', modell: 'Scenic E-Tech EV87',   anhaengelast: 1100 },
  { marke: 'Mercedes',modell: 'EQA 250',              anhaengelast: 750  },
];

(async () => {
  if (typeof updateCarInCloud !== 'function' || !Array.isArray(state?.cars)) {
    console.error('[Patch] Bitte auf der EV-Vergleich-Website ausführen (state.cars und updateCarInCloud müssen verfügbar sein).');
    return;
  }

  let updated = 0;
  for (const patch of PATCHES) {
    const car = state.cars.find(c => c.marke === patch.marke && c.modell === patch.modell);
    if (!car) {
      console.warn(`[Patch] Nicht gefunden: ${patch.marke} ${patch.modell}`);
      continue;
    }
    if (car.anhaengelast !== null && car.anhaengelast !== undefined) {
      console.log(`[Patch] Übersprungen (hat bereits Wert ${car.anhaengelast}): ${patch.marke} ${patch.modell}`);
      continue;
    }
    await updateCarInCloud(car.id, { anhaengelast: patch.anhaengelast });
    console.log(`[Patch] ✓ ${patch.marke} ${patch.modell} → ${patch.anhaengelast} kg`);
    updated++;
  }

  console.log(`[Patch] Fertig: ${updated} von ${PATCHES.length} Fahrzeugen aktualisiert.`);
})();

'use strict';

/* ── Standardwerte für Experten-Felder (gelten im Basis-Modus) ─────────────── */
const TCO_DEFAULTS = {
  evWertverlust:  55,   // % Gesamtwertverlust über die Haltedauer
  evFixkosten:   1200,  // €/Jahr (Versicherung, Steuer, Wartung)
  iceWertverlust: 65,
  iceFixkosten:  1800,
};

let tcoExpertMode = false;

/* ── Hilfsfunktionen ─────────────────────────────────────────────────────────── */

function tcoGetVal(id, fallback) {
  const el = document.getElementById(id);
  if (!el) return fallback;
  const v = parseFloat(el.value);
  return isNaN(v) ? fallback : v;
}

const TCO_FMT = new Intl.NumberFormat('de-DE', {
  style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
});

/* ── Hauptberechnung ─────────────────────────────────────────────────────────── */

/**
 * Formel:
 * Gesamtkosten = (Preis × Wertverlust/100)
 *              + (Jahre × km/100 × Verbrauch × Energiepreis)
 *              + (Jahre × Fixkosten)
 */
function updateTCO() {
  // Allgemeine Parameter
  const jahre = tcoGetVal('tco-jahre', 5);
  const km    = tcoGetVal('tco-km',    15000);

  // EV
  const evPreis  = tcoGetVal('tco-ev-preis',    45000);
  const evVerb   = tcoGetVal('tco-ev-verbrauch', 18);
  const evEPreis = tcoGetVal('tco-ev-epreis',    0.32);
  const evWv     = tcoExpertMode
    ? tcoGetVal('tco-ev-wv',  TCO_DEFAULTS.evWertverlust)
    : TCO_DEFAULTS.evWertverlust;
  const evFix    = tcoExpertMode
    ? tcoGetVal('tco-ev-fix', TCO_DEFAULTS.evFixkosten)
    : TCO_DEFAULTS.evFixkosten;

  // Verbrenner
  const icePreis  = tcoGetVal('tco-ice-preis',    35000);
  const iceVerb   = tcoGetVal('tco-ice-verbrauch', 7);
  const iceEPreis = tcoGetVal('tco-ice-epreis',    1.75);
  const iceWv     = tcoExpertMode
    ? tcoGetVal('tco-ice-wv',  TCO_DEFAULTS.iceWertverlust)
    : TCO_DEFAULTS.iceWertverlust;
  const iceFix    = tcoExpertMode
    ? tcoGetVal('tco-ice-fix', TCO_DEFAULTS.iceFixkosten)
    : TCO_DEFAULTS.iceFixkosten;

  // Aufschlüsselung
  const evDepr    = evPreis  * evWv  / 100;
  const iceDepr   = icePreis * iceWv / 100;
  const evEnergy  = jahre * km / 100 * evVerb  * evEPreis;
  const iceEnergy = jahre * km / 100 * iceVerb * iceEPreis;
  const evFixT    = jahre * evFix;
  const iceFixT   = jahre * iceFix;

  const evTotal   = evDepr  + evEnergy  + evFixT;
  const iceTotal  = iceDepr + iceEnergy + iceFixT;
  const diff      = Math.abs(evTotal - iceTotal);
  const evCheaper = evTotal <= iceTotal;

  // ── DOM-Updates ──────────────────────────────────────────────────────────────

  document.getElementById('tco-ev-result').textContent  = TCO_FMT.format(evTotal);
  document.getElementById('tco-ice-result').textContent = TCO_FMT.format(iceTotal);

  document.getElementById('tco-ev-depr').textContent    = TCO_FMT.format(evDepr);
  document.getElementById('tco-ice-depr').textContent   = TCO_FMT.format(iceDepr);
  document.getElementById('tco-ev-energy').textContent  = TCO_FMT.format(evEnergy);
  document.getElementById('tco-ice-energy').textContent = TCO_FMT.format(iceEnergy);
  document.getElementById('tco-ev-fix-r').textContent   = TCO_FMT.format(evFixT);
  document.getElementById('tco-ice-fix-r').textContent  = TCO_FMT.format(iceFixT);

  // Balken
  const max = Math.max(evTotal, iceTotal);
  if (max > 0) {
    document.getElementById('tco-ev-bar').style.width  = (evTotal  / max * 100).toFixed(1) + '%';
    document.getElementById('tco-ice-bar').style.width = (iceTotal / max * 100).toFixed(1) + '%';
  }

  // Kosten pro km & monatliche Kosten
  const totalKm = jahre * km;
  document.getElementById('tco-ev-km-cost').textContent  = (evTotal  / totalKm).toFixed(2).replace('.', ',') + ' €/km';
  document.getElementById('tco-ice-km-cost').textContent = (iceTotal / totalKm).toFixed(2).replace('.', ',') + ' €/km';
  document.getElementById('tco-ev-monthly').textContent  = TCO_FMT.format(evTotal  / (jahre * 12)) + '/Mo.';
  document.getElementById('tco-ice-monthly').textContent = TCO_FMT.format(iceTotal / (jahre * 12)) + '/Mo.';

  // Break-even
  const evAnnual  = km / 100 * evVerb  * evEPreis + evFix;
  const iceAnnual = km / 100 * iceVerb * iceEPreis + iceFix;
  const beEl = document.getElementById('tco-breakeven');
  if (evDepr <= iceDepr && evAnnual <= iceAnnual) {
    beEl.innerHTML = '<span class="text-teal-600 font-bold">EV von Beginn an günstiger</span>';
  } else if (evDepr > iceDepr && iceAnnual < evAnnual) {
    beEl.innerHTML = '<span class="text-orange-600 font-bold">EV amortisiert sich nicht</span>';
  } else if (evDepr > iceDepr && evAnnual < iceAnnual) {
    const beY = (evDepr - iceDepr) / (iceAnnual - evAnnual);
    beEl.innerHTML = beY <= 50
      ? `Nach <span class="font-bold">${beY.toFixed(1).replace('.', ',')} Jahren</span>`
      : '<span class="text-orange-600 font-bold">Kein Break-even</span>';
  } else {
    beEl.textContent = '–';
  }

  // CO₂-Einsparung (Benziner ~2,37 kg CO₂/L · DE-Strommix ~0,34 kg/kWh)
  const co2SavedKg = Math.round(
    (iceVerb * 23.7 - evVerb * 3.4) * km * jahre / 1000
  );
  document.getElementById('tco-co2').textContent = co2SavedKg > 0
    ? co2SavedKg.toLocaleString('de-DE') + ' kg CO₂'
    : '–';

  // Fazit
  const jahrText  = jahre === 1 ? 'Jahr' : 'Jahre';
  const winnerCls = evCheaper ? 'text-teal-600' : 'text-orange-600';
  const winner    = evCheaper ? 'EV' : 'Verbrenner';
  document.getElementById('tco-summary').innerHTML =
    `<span class="${winnerCls} font-black">${winner}</span> ist über ${jahre} ${jahrText} ` +
    `um <span class="font-black">${TCO_FMT.format(diff)}</span> günstiger.`;

  // Gesamtkarten optisch hervorheben
  const evCard  = document.getElementById('tco-ev-result').closest('.rounded-xl');
  const iceCard = document.getElementById('tco-ice-result').closest('.rounded-xl');
  if (evCard && iceCard) {
    evCard.classList.toggle('ring-2',          evCheaper);
    evCard.classList.toggle('ring-teal-400',   evCheaper);
    iceCard.classList.toggle('ring-2',         !evCheaper);
    iceCard.classList.toggle('ring-orange-400',!evCheaper);
  }
}

/* ── Experten-Modus Toggle ────────────────────────────────────────────────────── */

function toggleTCOExpert() {
  tcoExpertMode = !tcoExpertMode;

  const fields   = document.getElementById('tcoExpertFields');
  const btn      = document.getElementById('tcoExpertToggle');
  const chevron  = btn.querySelector('.tco-expert-chevron');
  const label    = btn.querySelector('[data-tco-expert-label]');

  fields.classList.toggle('hidden', !tcoExpertMode);
  btn.setAttribute('aria-expanded', tcoExpertMode);
  if (label)   label.textContent            = tcoExpertMode ? 'Experten-Modus ausblenden' : 'Experten-Modus';
  if (chevron) chevron.style.transform      = tcoExpertMode ? 'rotate(180deg)' : '';

  updateTCO();
}

/* ── Panel Toggle ─────────────────────────────────────────────────────────────── */

function toggleTCOPanel() {
  const panel   = document.getElementById('tcoPanel');
  const btn     = document.getElementById('tcoToggle');
  const chevron = btn.querySelector('.tco-chevron');
  const isOpen  = panel.classList.toggle('is-open');

  btn.setAttribute('aria-expanded', isOpen);
  panel.setAttribute('aria-hidden', !isOpen);
  if (chevron) chevron.style.transform = isOpen ? 'rotate(180deg)' : '';
}

/* ── Fahrzeug-Dropdowns befüllen ─────────────────────────────────────────────── */

function refreshTCOCarSelects() {
  ['tco-ev-select', 'tco-ice-select'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const prev = sel.value;
    sel.innerHTML = '<option value="">– Manuell eingeben –</option>';
    (state.cars || []).forEach(car => {
      const opt = document.createElement('option');
      opt.value       = car.id;
      opt.textContent = `${car.marke} ${car.modell}`;
      sel.appendChild(opt);
    });
    if (prev && sel.querySelector(`option[value="${CSS.escape(prev)}"]`)) sel.value = prev;
  });
}

/* ── Auto-Import aus dem Fahrzeug-Grid ───────────────────────────────────────── */

/**
 * Übernimmt die Fahrzeugdaten in die EV-Seite des TCO-Rechners.
 * Öffnet das Panel automatisch und scrollt dorthin.
 */
function importCarToTCO(car) {
  // Kaufpreis übernehmen
  if (car.basisPreis != null) {
    document.getElementById('tco-ev-preis').value = car.basisPreis;
  }
  // Verbrauch (kWh/100km) übernehmen – berechnetes Feld
  if (car.verbrauch != null) {
    document.getElementById('tco-ev-verbrauch').value = car.verbrauch;
  }

  // Panel öffnen wenn geschlossen
  const panel = document.getElementById('tcoPanel');
  if (!panel.classList.contains('is-open')) {
    toggleTCOPanel();
  }

  // Neu rechnen und zur Sektion scrollen
  updateTCO();
  document.getElementById('tcoSection').scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Feedback
  if (typeof toast === 'function') {
    toast(`${escapeHtml(car.marke)} ${escapeHtml(car.modell)} in TCO (EV) übernommen`, 'success');
  }
}

/* ── Initialisierung ──────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  // TCO-Sektion vor das Fahrzeug-Grid verschieben
  const tcoSection     = document.getElementById('tcoSection');
  const carGridSection = document.getElementById('carsGrid')?.closest('section');
  if (tcoSection && carGridSection) {
    carGridSection.parentNode.insertBefore(tcoSection, carGridSection);
  }

  document.getElementById('tcoToggle').addEventListener('click', toggleTCOPanel);
  document.getElementById('tcoExpertToggle').addEventListener('click', toggleTCOExpert);

  document.querySelectorAll('.tco-input').forEach(el => {
    el.addEventListener('input', updateTCO);
  });

  // Fahrzeug-Selects
  ['ev', 'ice'].forEach(side => {
    document.getElementById(`tco-${side}-select`).addEventListener('change', e => {
      const car = (state.cars || []).find(c => c.id === e.target.value);
      if (!car) return;
      if (car.basisPreis != null) document.getElementById(`tco-${side}-preis`).value = car.basisPreis;
      if (side === 'ev' && car.verbrauch != null)
        document.getElementById('tco-ev-verbrauch').value = car.verbrauch;
      updateTCO();
    });
  });

  refreshTCOCarSelects();
  updateTCO();
});

import { state } from './state.js';
import { toast } from './toast.js';

/* ── Standardwerte (gelten im Basis-Modus) ────────────────────────────────── */
const TCO_DEFAULTS = {
  evWertverlust:  55,   // %
  evFixkosten:   1200,  // €/Jahr
  iceWertverlust: 65,
  iceFixkosten:  1800,
};

let tcoExpertMode   = false;
let tcoCompareMode  = 'ice'; // 'ice' | 'ev2'

/* ── Hilfsfunktionen ─────────────────────────────────────────────────────── */

function tcoGetVal(id, fallback) {
  const el = document.getElementById(id);
  if (!el) return fallback;
  const v = parseFloat(el.value);
  return isNaN(v) ? fallback : v;
}

const TCO_FMT = new Intl.NumberFormat('de-DE', {
  style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
});

/* ── Vergleichs-Modus wechseln ───────────────────────────────────────────── */

export function switchTCOMode(mode) {
  tcoCompareMode = mode;
  const isEv2 = mode === 'ev2';

  // Buttons
  document.getElementById('tcoModeIce').className =
    isEv2
      ? 'tco-mode-btn px-4 h-7 rounded-full text-gray-400 hover:text-gray-600 transition-colors'
      : 'tco-mode-btn px-4 h-7 rounded-full bg-white text-gray-800 shadow-sm transition-colors';
  document.getElementById('tcoModeEv2').className =
    isEv2
      ? 'tco-mode-btn px-4 h-7 rounded-full bg-white text-gray-800 shadow-sm transition-colors'
      : 'tco-mode-btn px-4 h-7 rounded-full text-gray-400 hover:text-gray-600 transition-colors';

  // Eingabe-Karte (Farben + Texte)
  const card = document.getElementById('tco-ice-card');
  if (card) {
    card.className = isEv2
      ? 'rounded-xl border border-violet-100 bg-violet-50/40 p-4 space-y-3'
      : 'rounded-xl border border-orange-100 bg-orange-50/40 p-4 space-y-3';
  }
  const cardTitle = document.getElementById('tco-ice-card-title');
  if (cardTitle) {
    cardTitle.className = isEv2
      ? 'text-xs font-bold text-violet-600 uppercase tracking-widest flex items-center gap-1.5'
      : 'text-xs font-bold text-orange-600 uppercase tracking-widest flex items-center gap-1.5';
    // Icon + Text
    const icon = document.getElementById('tco-ice-card-icon');
    if (icon) {
      icon.setAttribute('data-lucide', isEv2 ? 'zap' : 'fuel');
      lucide.createIcons({ nodes: [icon] });
    }
    // Titel-Text (alles außer dem Icon)
    cardTitle.childNodes.forEach(n => {
      if (n.nodeType === Node.TEXT_NODE) n.textContent = isEv2 ? ' EV 2' : ' Verbrenner (ICE)';
    });
  }

  // Feld-Beschriftungen + Default-Werte
  const verbLabel  = document.getElementById('tco-ice-verbrauch-label');
  const epreisLabel = document.getElementById('tco-ice-epreis-label');
  const verbInput  = document.getElementById('tco-ice-verbrauch');
  const epreisInput = document.getElementById('tco-ice-epreis');
  const preisInput = document.getElementById('tco-ice-preis');

  if (isEv2) {
    if (verbLabel)  verbLabel.textContent  = 'Verbrauch (kWh/100km)';
    if (epreisLabel) epreisLabel.textContent = 'Strompreis AC (€/kWh)';
    if (verbInput)  { verbInput.step = '0.5'; verbInput.value = 18; }
    if (epreisInput){ epreisInput.step = '0.01'; epreisInput.value = 0.32; }
    if (preisInput) preisInput.value = 40000;
  } else {
    if (verbLabel)  verbLabel.textContent  = 'Verbrauch (L/100km)';
    if (epreisLabel) epreisLabel.textContent = 'Kraftstoffpreis (€/L)';
    if (verbInput)  { verbInput.step = '0.1'; verbInput.value = 7; }
    if (epreisInput){ epreisInput.step = '0.05'; epreisInput.value = 1.75; }
    if (preisInput) preisInput.value = 35000;
  }

  // Ergebnis-Bereich (Farben + Labels)
  const resultCard = document.getElementById('tco-ice-result-card');
  if (resultCard) {
    resultCard.className = isEv2
      ? 'rounded-xl bg-violet-50 border border-violet-100 p-4 text-center'
      : 'rounded-xl bg-orange-50 border border-orange-100 p-4 text-center';
  }
  const resultLabel = document.getElementById('tco-ice-result-label');
  if (resultLabel) {
    resultLabel.className = isEv2
      ? 'text-xs font-semibold text-violet-500 uppercase tracking-widest mb-1'
      : 'text-xs font-semibold text-orange-500 uppercase tracking-widest mb-1';
    resultLabel.textContent = isEv2 ? 'EV 2 Gesamt' : 'Verbrenner Gesamt';
  }
  const resultVal = document.getElementById('tco-ice-result');
  if (resultVal) {
    resultVal.className = isEv2
      ? 'text-2xl font-black text-violet-700 leading-none tabular-nums'
      : 'text-2xl font-black text-orange-700 leading-none tabular-nums';
  }

  const barLabel = document.getElementById('tco-ice-bar-label');
  if (barLabel) {
    barLabel.className = isEv2
      ? 'w-24 text-xs font-bold text-violet-600 text-right flex-shrink-0'
      : 'w-24 text-xs font-bold text-orange-600 text-right flex-shrink-0';
    barLabel.textContent = isEv2 ? 'EV 2' : 'Verbrenner';
  }
  const iceBar = document.getElementById('tco-ice-bar');
  if (iceBar) {
    iceBar.className = isEv2
      ? 'h-full bg-violet-400 rounded-full tco-bar-transition'
      : 'h-full bg-orange-400 rounded-full tco-bar-transition';
  }

  const tableHeader = document.getElementById('tco-ice-table-header');
  if (tableHeader) {
    tableHeader.className = isEv2
      ? 'px-4 py-2.5 text-right text-xs font-bold text-violet-600 uppercase tracking-wider'
      : 'px-4 py-2.5 text-right text-xs font-bold text-orange-600 uppercase tracking-wider';
    tableHeader.textContent = isEv2 ? 'EV 2' : 'Verbrenner';
  }

  // Tabellenwerte Farbe
  ['tco-ice-depr', 'tco-ice-energy', 'tco-ice-fix-r', 'tco-ice-km-cost'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const isSmall = id.includes('km-cost');
    el.className = isEv2
      ? `px-5 py-3 ${isSmall ? 'text-sm font-black' : 'text-sm font-bold'} text-right text-violet-600 tabular-nums`
      : `px-5 py-3 ${isSmall ? 'text-sm font-black' : 'text-sm font-bold'} text-right text-orange-600 tabular-nums`;
  });

  // Experten-Karte rechts
  const expertCard = document.getElementById('tco-right-expert-card');
  if (expertCard) {
    expertCard.className = isEv2
      ? 'rounded-xl border border-violet-100 bg-violet-50/40 p-4 space-y-3'
      : 'rounded-xl border border-orange-100 bg-orange-50/40 p-4 space-y-3';
  }
  const expertTitle = document.getElementById('tco-right-expert-title');
  if (expertTitle) {
    expertTitle.className = isEv2
      ? 'text-[10px] font-bold text-violet-600 uppercase tracking-widest'
      : 'text-[10px] font-bold text-orange-600 uppercase tracking-widest';
    expertTitle.textContent = isEv2 ? 'EV 2 – Erweitert' : 'Verbrenner – Erweitert';
  }

  // EV2-only Felder im Experten-Bereich (falls du noch welche hinzufügst)
  document.querySelectorAll('[data-ev2-only]').forEach(el => {
    el.classList.toggle('hidden', !isEv2);
  });

  // Select-Inhalte und Sichtbarkeit aktualisieren
  refreshTCOCarSelects();

  // Header-Subtitle aktualisieren
  const subtitle = document.getElementById('tcoSubtitle');
  if (subtitle) subtitle.textContent = isEv2
    ? 'EV vs. EV – Total Cost of Ownership'
    : 'EV vs. Verbrenner – Total Cost of Ownership';

  // Experten-WV Default anpassen wenn Modus wechselt
  const iceWvInput = document.getElementById('tco-ice-wv');
  const iceFixInput = document.getElementById('tco-ice-fix');
  if (iceWvInput && !tcoExpertMode) {
    iceWvInput.value = isEv2 ? TCO_DEFAULTS.evWertverlust : TCO_DEFAULTS.iceWertverlust;
  }
  if (iceFixInput && !tcoExpertMode) {
    iceFixInput.value = isEv2 ? TCO_DEFAULTS.evFixkosten : TCO_DEFAULTS.iceFixkosten;
  }

  updateTCO();
}

/* ── Hauptberechnung ─────────────────────────────────────────────────────── */

export function updateTCO() {
  const jahre = tcoGetVal('tco-jahre', 5);
  const km    = tcoGetVal('tco-km',    15000);
  const isEv2 = tcoCompareMode === 'ev2';

  // EV 1 – Basiswerte
  const evPreis  = tcoGetVal('tco-ev-preis',    45000);
  const evVerb   = tcoGetVal('tco-ev-verbrauch', 18);
  const evEPreis = tcoGetVal('tco-ev-epreis',    0.32); // AC / Heimladen
  const evWv     = tcoExpertMode
    ? tcoGetVal('tco-ev-wv', TCO_DEFAULTS.evWertverlust)
    : TCO_DEFAULTS.evWertverlust;
  const evFix    = tcoExpertMode
    ? tcoGetVal('tco-ev-fix', TCO_DEFAULTS.evFixkosten)
    : TCO_DEFAULTS.evFixkosten;

  // EV 1 – Experten-Felder
  const evLadeverlust  = tcoExpertMode ? tcoGetVal('tco-ev-ladeverlust', 10)  : 0;
  const evHeimladen    = tcoExpertMode ? tcoGetVal('tco-ev-heimladen',   80)  : 100;
  const evEPreisDC     = tcoExpertMode ? tcoGetVal('tco-ev-epreis-dc',  0.60) : 0.60;
  const evThg          = tcoExpertMode ? tcoGetVal('tco-ev-thg',        100)  : 0;

  // Lade-Mix Label aktualisieren
  const schnellProzent = 100 - evHeimladen;
  const lademixLabel   = document.getElementById('tco-ev-lademix-label');
  if (lademixLabel) lademixLabel.textContent = `${evHeimladen}% Heim / ${schnellProzent}% DC`;

  // Rechte Seite (ICE oder EV2) – Basiswerte
  const icePreis  = tcoGetVal('tco-ice-preis',    isEv2 ? 40000 : 35000);
  const iceVerb   = tcoGetVal('tco-ice-verbrauch', isEv2 ? 18    : 7);
  const iceEPreis = tcoGetVal('tco-ice-epreis',    isEv2 ? 0.32  : 1.75);
  const iceWv     = tcoExpertMode
    ? tcoGetVal('tco-ice-wv', isEv2 ? TCO_DEFAULTS.evWertverlust : TCO_DEFAULTS.iceWertverlust)
    : (isEv2 ? TCO_DEFAULTS.evWertverlust : TCO_DEFAULTS.iceWertverlust);
  const iceFix    = tcoExpertMode
    ? tcoGetVal('tco-ice-fix', isEv2 ? TCO_DEFAULTS.evFixkosten : TCO_DEFAULTS.iceFixkosten)
    : (isEv2 ? TCO_DEFAULTS.evFixkosten : TCO_DEFAULTS.iceFixkosten);


  // ── EV Energiekosten (Experten-Modus: mit Ladeverlust & Lade-Mix) ──
  let evEnergy;
  if (tcoExpertMode) {
    const realVerbrauch = evVerb * (1 + evLadeverlust / 100);
    const mischPreis    = (evEPreis * evHeimladen / 100) + (evEPreisDC * schnellProzent / 100);
    evEnergy = jahre * (km / 100) * realVerbrauch * mischPreis;
  } else {
    evEnergy = jahre * (km / 100) * evVerb * evEPreis;
  }

  // ── ICE Energiekosten ──
  const iceEnergy = jahre * (km / 100) * iceVerb * iceEPreis;

  // ── Wertverlust ──
  const evDepr  = evPreis  * evWv  / 100;
  const iceDepr = icePreis * iceWv / 100;

  // ── Fixkosten ──
  const evFixT  = jahre * evFix;
  const iceFixT = jahre * iceFix;

  // ── Neue Kostenpositionen (Experten-Modus) ──
  const evThgT     = tcoExpertMode ? (jahre * evThg) : 0;   // Einnahme → wird abgezogen

  // ── Gesamtkosten ──
  const evTotal  = evDepr  + evEnergy  + evFixT  - evThgT;
  const iceTotal = iceDepr + iceEnergy + iceFixT;

  // ── DOM-Updates Hauptwerte ──
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

  // Kosten/km
  const totalKm = jahre * km;
  document.getElementById('tco-ev-km-cost').textContent  = (evTotal  / totalKm).toFixed(2).replace('.', ',') + ' €/km';
  document.getElementById('tco-ice-km-cost').textContent = (iceTotal / totalKm).toFixed(2).replace('.', ',') + ' €/km';
}

/* ── Experten-Modus Toggle ───────────────────────────────────────────────── */

export function toggleTCOExpert() {
  tcoExpertMode = !tcoExpertMode;

  const fields  = document.getElementById('tcoExpertFields');
  const btn     = document.getElementById('tcoExpertToggle');
  const chevron = btn.querySelector('.tco-expert-chevron');
  const label   = btn.querySelector('[data-tco-expert-label]');

  fields.classList.toggle('hidden', !tcoExpertMode);
  btn.setAttribute('aria-expanded', tcoExpertMode);
  if (label)   label.textContent       = tcoExpertMode ? 'Experten-Modus ausblenden' : 'Experten-Modus';
  if (chevron) chevron.style.transform = tcoExpertMode ? 'rotate(180deg)' : '';

  updateTCO();
}

/* ── Panel Toggle ────────────────────────────────────────────────────────── */

export function toggleTCOPanel() {
  const panel   = document.getElementById('tcoPanel');
  const btn     = document.getElementById('tcoToggle');
  const chevron = btn.querySelector('.tco-chevron');
  const isOpen  = panel.classList.toggle('is-open');

  btn.setAttribute('aria-expanded', isOpen);
  panel.setAttribute('aria-hidden', !isOpen);
  if (chevron) chevron.style.transform = isOpen ? 'rotate(180deg)' : '';
}

/* ── Fahrzeug-Dropdowns befüllen ─────────────────────────────────────────── */

export function refreshTCOCarSelects() {
  const isEv2 = tcoCompareMode === 'ev2';

  // EV-Select: immer aus state.cars
  const evSel = document.getElementById('tco-ev-select');
  if (evSel) {
    const prev = evSel.value;
    evSel.innerHTML = '<option value="">– Manuell eingeben –</option>';
    (state.cars || []).forEach(car => {
      const opt = document.createElement('option');
      opt.value       = car.id;
      opt.textContent = `${car.marke} ${car.modell}`;
      evSel.appendChild(opt);
    });
    if (prev && evSel.querySelector(`option[value="${CSS.escape(prev)}"]`)) evSel.value = prev;
  }

  // ICE/EV2-Select: im EV2-Modus aus state.cars, im ICE-Modus aus state.iceCars
  const iceSel = document.getElementById('tco-ice-select');
  if (iceSel) {
    const prev = iceSel.value;
    iceSel.innerHTML = '<option value="">– Manuell eingeben –</option>';
    const pool = isEv2 ? (state.cars || []) : (state.iceCars || []);
    pool.forEach(car => {
      const opt = document.createElement('option');
      opt.value       = car.id;
      opt.textContent = `${car.marke} ${car.modell}`;
      iceSel.appendChild(opt);
    });
    if (prev && iceSel.querySelector(`option[value="${CSS.escape(prev)}"]`)) iceSel.value = prev;
  }

  // Label aktualisieren
  const iceSelectLabel = document.querySelector('label[for="tco-ice-select"]');
  if (iceSelectLabel) {
    iceSelectLabel.textContent = isEv2 ? 'Aus EV-Datenbank laden' : 'Aus Verbrenner-Datenbank laden';
  }

  // Sichtbarkeit:
  const iceSelectWrap = document.getElementById('tco-ice-select-wrap');
  if (iceSelectWrap) {
    const hasData = isEv2 ? (state.cars || []).length > 0 : (state.iceCars || []).length > 0;
    iceSelectWrap.classList.toggle('hidden', !hasData);
  }
}

/* ── Auto-Import aus dem Fahrzeug-Grid ───────────────────────────────────── */

export function importCarToTCO(car) {
  const missing = [];
  if (car.basisPreis != null) {
    document.getElementById('tco-ev-preis').value = car.basisPreis;
  } else {
    document.getElementById('tco-ev-preis').value = '';
    missing.push('Kaufpreis');
  }
  if (car.verbrauch != null) {
    document.getElementById('tco-ev-verbrauch').value = car.verbrauch;
  } else {
    document.getElementById('tco-ev-verbrauch').value = '';
    missing.push('Verbrauch');
  }

  const panel = document.getElementById('tcoPanel');
  if (!panel.classList.contains('is-open')) toggleTCOPanel();

  updateTCO();
  document.getElementById('tcoSection').scrollIntoView({ behavior: 'smooth', block: 'start' });

  if (typeof toast === 'function') {
    if (missing.length > 0) {
      toast(`${car.marke} ${car.modell} übernommen – fehlende Daten: ${missing.join(', ')}`, 'info');
    } else {
      toast(`${car.marke} ${car.modell} in TCO (EV 1) übernommen`, 'success');
    }
  }
}

/* ── Initialisierung ─────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  // TCO-Sektion vor das Fahrzeug-Grid verschieben
  const tcoSection     = document.getElementById('tcoSection');
  const carGridSection = document.getElementById('carsGrid')?.closest('section');
  if (tcoSection && carGridSection) {
    carGridSection.parentNode.insertBefore(tcoSection, carGridSection);
  }

  document.getElementById('tcoToggle').addEventListener('click', toggleTCOPanel);
  document.getElementById('tcoExpertToggle').addEventListener('click', toggleTCOExpert);

  // Vergleichs-Modus Toggle
  document.querySelectorAll('.tco-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTCOMode(btn.dataset.mode));
  });

  // Inputs Listener
  document.querySelectorAll('.tco-input').forEach(el => {
    el.addEventListener('input', updateTCO);
  });

  // EV-Select Change
  const evSel = document.getElementById('tco-ev-select');
  if (evSel) {
    evSel.addEventListener('change', e => {
      const car = (state.cars || []).find(c => c.id === e.target.value);
      if (!car) return;
      const missing = [];
      if (car.basisPreis != null) {
        document.getElementById('tco-ev-preis').value = car.basisPreis;
      } else {
        document.getElementById('tco-ev-preis').value = '';
        missing.push('Kaufpreis');
      }
      if (car.verbrauch != null) {
        document.getElementById('tco-ev-verbrauch').value = car.verbrauch;
      } else {
        document.getElementById('tco-ev-verbrauch').value = '';
        missing.push('Verbrauch');
      }
      if (missing.length > 0 && typeof toast === 'function') {
        toast(`${car.marke} ${car.modell} übernommen – fehlende Daten: ${missing.join(', ')}`, 'info');
      }
      updateTCO();
    });
  }

  // ICE/EV2-Select Change
  const iceSel = document.getElementById('tco-ice-select');
  if (iceSel) {
    iceSel.addEventListener('change', e => {
      const isEv2 = tcoCompareMode === 'ev2';
      const pool = isEv2 ? (state.cars || []) : (state.iceCars || []);
      const car = pool.find(c => c.id === e.target.value);
      if (!car) return;
      const missing = [];
      if (car.basisPreis != null) {
        document.getElementById('tco-ice-preis').value = car.basisPreis;
      } else {
        document.getElementById('tco-ice-preis').value = '';
        missing.push('Kaufpreis');
      }
      if (car.verbrauch != null) {
        document.getElementById('tco-ice-verbrauch').value = car.verbrauch;
      } else {
        document.getElementById('tco-ice-verbrauch').value = '';
        missing.push('Verbrauch');
      }
      if (missing.length > 0 && typeof toast === 'function') {
        toast(`${car.marke} ${car.modell} übernommen – fehlende Daten: ${missing.join(', ')}`, 'info');
      }
      updateTCO();
    });
  }

  refreshTCOCarSelects();
  updateTCO();

  // ── Import eines Verbrenners aus der ice.html (localStorage) ──
  setTimeout(() => {
    const pendingIce = localStorage.getItem('tcoImportIce');
    if (pendingIce) {
      try {
        const car = JSON.parse(pendingIce);
        const missing = [];

        // Sicherstellen, dass wir im Modus "EV vs. Verbrenner" sind
        if (tcoCompareMode !== 'ice') {
          switchTCOMode('ice');
        }

        if (car.preis != null) {
          document.getElementById('tco-ice-preis').value = car.preis;
        } else {
          document.getElementById('tco-ice-preis').value = '';
          missing.push('Kaufpreis');
        }

        if (car.verbrauch != null) {
          document.getElementById('tco-ice-verbrauch').value = car.verbrauch;
        } else {
          document.getElementById('tco-ice-verbrauch').value = '';
          missing.push('Verbrauch');
        }

        // Falls die Fahrzeugdaten schon in der iceCars Liste sind, das Select aktualisieren
        const iceSelectDropdown = document.getElementById('tco-ice-select');
        if (iceSelectDropdown && iceSelectDropdown.querySelector(`option[value="${CSS.escape(car.id)}"]`)) {
           iceSelectDropdown.value = car.id;
        }

        // Speicher leeren, damit es nicht bei jedem Neuladen passiert
        localStorage.removeItem('tcoImportIce');
        
        // Panel öffnen, scrollen, Werte updaten und Toast anzeigen
        const panel = document.getElementById('tcoPanel');
        if (!panel.classList.contains('is-open')) toggleTCOPanel();
        
        updateTCO();
        document.getElementById('tcoSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        if (typeof toast === 'function') {
          if (missing.length > 0) {
            toast(`${car.marke} ${car.modell} übernommen – fehlende Daten: ${missing.join(', ')}`, 'info');
          } else {
            toast(`${car.marke} ${car.modell} in TCO (Verbrenner) übernommen`, 'success');
          }
        }
      } catch (e) {
        console.error('Fehler beim TCO-Import des Verbrenners:', e);
        localStorage.removeItem('tcoImportIce');
      }
    }
  }, 500); // 500ms Delay stellt sicher, dass die Daten geladen sind
});
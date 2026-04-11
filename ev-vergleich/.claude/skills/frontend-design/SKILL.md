---
name: frontend-design
description: Hilft beim Gestalten und Verbessern von Frontend-Komponenten für das EV-Vergleich Projekt. Nutzt Tailwind CSS, Lucide Icons und das bestehende Dark-Design-System.
---

# Frontend Design Skill

Du arbeitest am EV-Vergleich Projekt. Das Design-System ist:

## Stack
- **Tailwind CSS** (Play CDN, keine Build-Pipeline)
- **Lucide Icons** (UMD, `lucide.createIcons()` nach jedem dynamischen Render)
- **Vanilla JS** (kein Framework, global scope, keine ES-Module)

## Design-System
- **Hintergrund:** `bg-slate-900` (Seite), `bg-slate-800/50` (Karten)
- **Akzentfarbe:** `teal-400` / `teal-500` (Branding, Buttons, Fokus)
- **Text:** `text-white` (Hauptwerte), `text-slate-400` (Labels), `text-slate-500` (Subtext)
- **Borders:** `border-slate-700/50` (Standard), `border-slate-600` (Hover)
- **Statusfarben:** `text-emerald-400` (gut/positiv), `text-amber-400` (ok/mittel), `text-red-400` (nogo/negativ)
- **Kaufberater Top 3:** `border-yellow-500/60` (Platz 1), `border-slate-400/50` (Platz 2), `border-orange-600/50` (Platz 3)

## Komponenten-Muster
- Karten: `bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden`
- Buttons (aktiv): `text-teal-400 bg-teal-500/10 border border-teal-500/50 rounded-lg`
- Buttons (inaktiv): `text-slate-400 bg-slate-800 border border-slate-700/50 rounded-lg`
- Inputs: `bg-slate-800 border border-slate-700 rounded-lg focus:border-teal-500`
- Panels (kollabiert): `max-height: 0` → `is-open` Klasse setzt max-height + opacity

## Dateistruktur
- `index.html` – Markup, Tailwind CDN, Script-Tags
- `style.css` – Nur was Tailwind nicht kann (Transitions, Range-Inputs, Scrollbar)
- `js/config.js` – FIELDS Array + CSV_MAP
- `js/state.js` – state Objekt, uid(), calcDerived()
- `js/storage.js` – localStorage: saveCars(), loadSavedCars()
- `js/csv.js` – parseEuroNumber(), parseCSV(), computeBounds()
- `js/filter.js` – applyFiltersAndSort(), fmt()
- `js/render.js` – renderCards(), buildCardHTML()
- `js/filter-ui.js` – buildFilterPanel()
- `js/advisor.js` – Kaufberater-Logik + Panel
- `js/ui.js` – refresh(), addCar(), deleteCar(), toast(), Modal, View
- `js/events.js` – DOMContentLoaded + Demo-Daten

## Regeln
- Keine ES-Module (kein `import`/`export`) wegen `file://` Protokoll
- Nach jedem `innerHTML`-Update `lucide.createIcons()` aufrufen
- Dynamische Tailwind-Klassen funktionieren (Play CDN mit MutationObserver)
- `saveCars()` nach jeder Änderung an `state.cars` aufrufen

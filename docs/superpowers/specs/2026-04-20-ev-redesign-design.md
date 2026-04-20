# EV Vergleich — Redesign & Landing Page

**Date:** 2026-04-20  
**Scope:** ev-database (React + Vite) — visual redesign + new landing page  
**Approach:** "EV Magazin" — automagazin-artig, bunt, interaktiv, professionell

---

## 1. Ziele

- Steriles Erscheinungsbild durch lebendiges, magazinartiges Design ersetzen
- Bunte Icons, Hover-Glow-Effekte, farbige Akzente pro Metrik
- Neue Landing Page als primärer Einstiegspunkt
- Layout-Auffrischung: Sidebar-Filter, neue Karten-Proportionen, glassmorphism Nav
- WCAG AA Kontrast (min. 4.5:1) auf allen farbigen Elementen

---

## 2. Visuelles System

### Farbpalette

| Token | Wert | Verwendung |
|-------|------|------------|
| `--color-bg` | `#f8fafc` | Seitenhintergrund |
| `--color-surface` | `#ffffff` | Karten |
| `--color-primary` | `#0ea5e9` | EV-Akzent, primäre Buttons |
| `--color-ice` | `#f97316` | Verbrenner-Akzent |
| `--color-border` | `#e2e8f0` | Trennlinien |

**Semantische Metrik-Farben** (Icon + Hintergrundkreis mit `opacity: 0.12`):

| Metrik | Farbe |
|--------|-------|
| Reichweite | `#3b82f6` (Blau) |
| Laden (Geschwindigkeit) | `#f59e0b` (Amber) |
| Leistung / PS | `#ef4444` (Rot) |
| Effizienz / Verbrauch | `#10b981` (Grün) |
| Batterie | `#8b5cf6` (Lila) |
| Preis | `#06b6d4` (Cyan) |
| Anhängelast | `#84cc16` (Lime) |
| 0–100 / Sprint | `#f43f5e` (Rose) |
| Top Speed | `#14b8a6` (Teal) |
| Volt | `#a855f7` (Violet) |

Alle Farben auf weißem Hintergrund ≥ 4.5:1 Kontrastverhältnis. Icon-Kreise (`opacity: 0.12`) sind rein dekorativ — Text/Icon-Farbe bleibt immer die volle Farbe auf hellem Grund.

### Typografie

| Rolle | Font | Gewicht |
|-------|------|---------|
| Headlines | `Outfit` | 800 |
| Metriken / Zahlen | `Outfit` | 700 |
| Body / Labels | `Plus Jakarta Sans` | 400–600 |

`Plus Jakarta Sans` ersetzt `DM Sans` — moderner, besser lesbar in kleinen Größen.  
Google Fonts import wird in `index.css` aktualisiert.

### Hover-Effekte

- **Karten:** `transform: translateY(-3px)` + `box-shadow: 0 12px 40px rgba(primary, 0.18)`
- **Buttons (primary):** `box-shadow: 0 0 0 3px rgba(14,165,233,0.25)` Glow
- **Buttons (outline):** Border-Farbe wechselt zu Primary + leichter Glow
- **Filter-Chips:** Border leuchtet in `--color-primary` auf (`border-color` transition)
- **Nav-Links:** Unterstrich-Animation von links nach rechts (`::after` pseudo-element, `scaleX`)
- Alle Transitions: `200ms ease`

---

## 3. Komponenten-Änderungen

### TopNav

- Glassmorphism: `backdrop-filter: blur(12px)`, `background: rgba(248,250,252,0.85)`, `border-bottom: 1px solid rgba(226,232,240,0.8)`
- Logo: größer, mit farbigem Blitz-Icon (Lucide `Zap`, `--color-primary`)
- Nav-Links mit Hover-Unterstrich-Animation
- "Verbrenner"-Button bleibt Orange, als Pill-Button
- Position: `sticky top: 0`, `z-index: 100`

### CarCard

- Marken-Name als farbiger Badge oben links (Teal für EV, Orange für ICE)
- Jahrgang-Badge oben rechts (neutral, grau)
- Metrik-Zeilen: jede bekommt farbiges Lucide-Icon mit `opacity: 0.12` Kreis-Hintergrund
- Hover: `translateY(-3px)` + farbiger Schatten
- Karten-Proportionen etwas größer / weniger dicht — mehr Luft

### Filter (Autos-Seite)

- Von horizontaler TopBar → **linke Sidebar** (240px, sticky)
- Filter-Chips / Slider bleiben funktional identisch
- Sidebar hat eigenen Scroll bei vielen Filtern
- Auf Mobile: Sidebar wird zu einem Drawer (Hamburger/Filter-Icon öffnet es)

### HomePage Layout

- Neues Route-Setup: `/` → neue `LandingPage`, `/autos` → bisherige `HomePage`
- Grid: 3 Spalten Desktop (≥1280px), 2 Spalten Tablet (768–1279px), 1 Spalte Mobile

### TCO-Rechner (Calculator)

- Visuelles Upgrade: farbige Labels für Eingabefelder, Ergebnis-Panel mit Gradient-Akzent
- Keine strukturellen / funktionalen Änderungen

---

## 4. Neue Seite: LandingPage (`/`)

### Aufbau

Kompakter Single-Screen Hero — kein Scrollen erforderlich:

```
┌─────────────────────────────────────────────────────┐
│ [TopNav — glassmorphism, transparent über Hero]     │
├─────────────────────────────────────────────────────┤
│                                                     │
│   [Hintergrundbild: EV auf Straße, dunkles Overlay] │
│                                                     │
│          "Der smarteste Weg zum               │
│           richtigen Auto."                          │
│   Subtext: "399 Autos. Echte Daten. Klare Kosten." │
│                                                     │
│   [Autos entdecken →]   [Kosten berechnen →]       │
│   (Teal/Primary)         (White/Outline)            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Details

- Hintergrundbild: Ein EV-Foto auf moderner Straße (Querformat, Tag). Im Code wird ein Unsplash-Platzhalter-URL verwendet (`https://images.unsplash.com/...`). Der Nutzer kann jederzeit durch ein eigenes Bild in `public/` ersetzen.
- Overlay: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.4))`
- Headline: Outfit 800, weiß, 56px Desktop / 36px Mobile
- Subtext: Plus Jakarta Sans 500, `rgba(255,255,255,0.8)`, 18px
- CTA-Buttons: nebeneinander, großzügig padding, mit Hover-Glow
- TopNav auf Landing: transparent → scrollt zu `rgba(248,250,252,0.95)` (aber kein Scroll auf dieser Seite)
- Höhe: `100vh`

---

## 5. Routing-Änderungen (App.jsx)

| Route alt | Route neu | Komponente |
|-----------|-----------|------------|
| `/` | `/autos` | `HomePage` (EV-Datenbank) |
| *(neu)* | `/` | `LandingPage` |
| `/verbrenner` | `/verbrenner` | `IceHomePage` *(unverändert)* |
| `/rechner` | `/rechner` | `Calculator` *(unverändert)* |

TopNav-Links werden entsprechend aktualisiert.

---

## 6. Dateien die geändert werden

| Datei | Änderung |
|-------|----------|
| `src/index.css` | Font-Import, CSS-Variablen (neue Metrikfarben), globale Hover-Klassen |
| `src/App.jsx` | Neues Routing (`/` → Landing, `/autos` → HomePage) |
| `src/pages/LandingPage.jsx` | Neue Datei — Hero-Seite |
| `src/pages/LandingPage.module.css` | Neue Datei — Styles |
| `src/components/layout/TopNav.jsx` | Glassmorphism, Logo-Upgrade, Hover-Animationen, Link-Anpassung |
| `src/components/layout/TopNav.module.css` | Styles für neue Nav |
| `src/components/cars/CarCard.jsx` | Metrik-Icons mit Farbkreisen, Badge-Layout |
| `src/components/cars/CarCard.module.css` | Neue Karten-Styles, Hover-Effekte |
| `src/pages/HomePage.jsx` | Sidebar-Filter-Layout statt TopBar |
| `src/pages/HomePage.module.css` | Layout-Grid mit Sidebar |
| `src/components/cars/CarGrid.module.css` | Grid-Anpassung (3/2/1 Spalten) |

---

## 7. Out of Scope

- Funktionale Änderungen an Filter-Logik, TCO-Berechnung, Firebase, Admin
- i18n-Texte (nur neue Strings für Landing Page werden ergänzt)
- IceHomePage visuelles Upgrade — kommt als direktes Follow-up mit identischer Systematik (gleiche Icon-Farben, gleiche Karten-Struktur, Orange-Akzente statt Teal)
- Mobile Drawer für Filter (kann als Follow-up kommen, Desktop-First)

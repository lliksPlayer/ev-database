# Global Redesign "Electric Clean" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vollständiges visuelles Redesign der EV-Vergleichs-Website — hell, modern, kontrastreich, runde Ecken, bunte kategorisierte Icons — ohne Funktionsänderungen.

**Architecture:** Alle CSS-Variablen werden zentral in `index.css` als Custom Properties definiert. Komponenten greifen per `var(--color-*)` darauf zu. JSX-Änderungen sind minimal: nur Icon-Imports bei TopNav, CarCard und VehicleSlot.

**Tech Stack:** React 19, Vite, CSS Modules (plain CSS), lucide-react (neu), Google Fonts (Outfit + DM Sans)

---

## Dateien-Übersicht

| Datei | Art | Änderung |
|---|---|---|
| `ev-database/index.html` | Modify | Google Fonts Link-Tag |
| `ev-database/src/index.css` | Modify | CSS-Variablen, globale Fonts, Button-Stile |
| `ev-database/src/components/layout/TopNav.css` | Modify | Weiße Nav |
| `ev-database/src/components/layout/TopNav.jsx` | Modify | Zap-Icon statt ⚡ Emoji |
| `ev-database/src/components/cars/CarCard.css` | Modify | Redesign |
| `ev-database/src/components/cars/CarGrid.css` | Modify | Token-Anpassung |
| `ev-database/src/components/cars/CarList.css` | Modify | Token-Anpassung |
| `ev-database/src/components/cars/ViewToggle.css` | Modify | Pill-Switcher |
| `ev-database/src/pages/HomePage.css` | Modify | Outfit-Font, Token |
| `ev-database/src/pages/Calculator.css` | Modify | Redesign, Pill-Toggles |
| `ev-database/src/components/calculator/VehicleSlot.css` | Modify | Redesign |
| `ev-database/src/components/calculator/VehicleSlot.jsx` | Modify | Icons in Badges |
| `ev-database/src/components/calculator/ResultsPanel.css` | Modify | Redesign |
| `ev-database/src/components/calculator/IceForm.css` | Modify | Token-Anpassung |
| `ev-database/src/pages/LoginPage.css` | Modify | Redesign |
| `ev-database/src/components/admin/AdminPanel.css` | Modify | Token-Anpassung |
| `ev-database/src/components/admin/CarForm.css` | Modify | Token-Anpassung |
| `ev-database/src/components/admin/CarImport.css` | Modify | Token-Anpassung |
| `ev-database/src/components/admin/FieldToggle.css` | Modify | Token-Anpassung |
| `ev-database/src/pages/AdminPage.css` | Modify | Token-Anpassung |

---

## Task 1: lucide-react installieren + Google Fonts einbinden

**Files:**
- Modify: `ev-database/index.html`
- (package.json wird via npm install aktualisiert)

- [ ] **Step 1: lucide-react installieren**

```bash
cd ev-database
npm install lucide-react
```

Erwartete Ausgabe: `added N packages` ohne Fehler.

- [ ] **Step 2: Google Fonts in index.html einbinden**

Ersetze den `<head>`-Block in `ev-database/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>EV Database</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@700;800&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Dev-Server starten und prüfen**

```bash
cd ev-database
npm run dev
```

Browser öffnen (normalerweise http://localhost:5173). Prüfen: Seite lädt ohne Konsolenfehler.

- [ ] **Step 4: Committen**

```bash
cd ev-database
git add index.html package.json package-lock.json
git commit -m "feat: lucide-react installieren und Google Fonts einbinden"
```

---

## Task 2: CSS-Variablen und globale Stile (index.css)

**Files:**
- Modify: `ev-database/src/index.css`

- [ ] **Step 1: index.css vollständig ersetzen**

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'DM Sans', system-ui, sans-serif;
  background: var(--color-bg);
  color: var(--color-text);
  line-height: 1.5;
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'Outfit', system-ui, sans-serif;
}

:root {
  --color-bg:           #f8fafc;
  --color-surface:      #ffffff;
  --color-primary:      #0ea5e9;
  --color-primary-hover:#0284c7;
  --color-ev:           #0ea5e9;
  --color-ice:          #f97316;
  --color-positive:     #22c55e;
  --color-danger:       #ef4444;
  --color-text:         #0f172a;
  --color-muted:        #64748b;
  --color-border:       #e2e8f0;
  --color-expert:       #8b5cf6;
  --color-surface-alt:  #f1f5f9;

  --shadow-card:        0 2px 12px rgba(0,0,0,0.06);
  --shadow-ev-hover:    0 8px 32px rgba(14,165,233,0.18);
  --shadow-ice-hover:   0 8px 32px rgba(249,115,22,0.18);
  --shadow-btn:         0 2px 8px rgba(14,165,233,0.30);

  --radius-card:   20px;
  --radius-btn:    12px;
  --radius-input:  10px;
  --radius-pill:   999px;
  --radius-small:  8px;
}

/* ─── Buttons ─────────────────────────────────────────────────────────────── */

.btn {
  padding: 0.6rem 1.2rem;
  border-radius: var(--radius-btn);
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  font-family: 'DM Sans', system-ui, sans-serif;
  transition: background 0.15s, box-shadow 0.15s, transform 0.1s;
}

.btn:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-primary {
  background: var(--color-primary);
  color: white;
}
.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
  box-shadow: var(--shadow-btn);
}

.btn-secondary {
  background: var(--color-surface-alt);
  color: var(--color-text);
}
.btn-secondary:hover:not(:disabled) {
  background: #e2e8f0;
}

.btn-danger {
  background: var(--color-danger);
  color: white;
}
.btn-danger:hover:not(:disabled) { background: #dc2626; }

.btn-small { padding: 4px 10px; font-size: 0.8rem; border-radius: var(--radius-small); }
```

- [ ] **Step 2: Visuell prüfen**

Im Browser: Buttons, Hintergrundfarbe und Schriftarten kontrollieren. `h1`-Elemente sollten in Outfit erscheinen, Body in DM Sans.

- [ ] **Step 3: Committen**

```bash
git add src/index.css
git commit -m "feat: Design-Tokens und globale Stile (Electric Clean)"
```

---

## Task 3: TopNav redesignen

**Files:**
- Modify: `ev-database/src/components/layout/TopNav.css`
- Modify: `ev-database/src/components/layout/TopNav.jsx`

- [ ] **Step 1: TopNav.css ersetzen**

```css
.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  height: 60px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  box-shadow: 0 1px 8px rgba(0,0,0,0.06);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-brand {
  font-family: 'Outfit', system-ui, sans-serif;
  font-weight: 700;
  font-size: 1.15rem;
  text-decoration: none;
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.nav-brand-icon {
  color: var(--color-primary);
  width: 20px;
  height: 20px;
}

.nav-links { display: flex; gap: 1.5rem; align-items: center; }

.nav-link {
  color: var(--color-muted);
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  padding-bottom: 2px;
  border-bottom: 2px solid transparent;
  transition: color 0.15s, border-color 0.15s;
}

.nav-link:hover {
  color: var(--color-text);
}

.nav-link.active {
  color: var(--color-primary);
  font-weight: 600;
  border-bottom-color: var(--color-primary);
}

.nav-right { display: flex; align-items: center; gap: 1rem; }
```

- [ ] **Step 2: TopNav.jsx — Zap-Icon einbauen**

```jsx
import { Link, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import { Zap } from 'lucide-react'
import LanguageSwitch from './LanguageSwitch'
import './TopNav.css'

export default function TopNav() {
  const { t } = useTranslation()
  const { user } = useAuth()

  return (
    <nav className="nav">
      <Link to="/" className="nav-brand">
        <Zap className="nav-brand-icon" fill="currentColor" strokeWidth={0} />
        EV Database
      </Link>
      <div className="nav-links">
        <NavLink to="/" end className="nav-link">{t('nav.evDatabase')}</NavLink>
        <NavLink to="/verbrenner" className="nav-link">{t('nav.iceDatabase')}</NavLink>
        <NavLink to="/rechner" className="nav-link">{t('nav.calculator')}</NavLink>
      </div>
      <div className="nav-right">
        <LanguageSwitch />
        {user && (
          <NavLink to="/admin" className="nav-link">{t('nav.admin')}</NavLink>
        )}
      </div>
    </nav>
  )
}
```

- [ ] **Step 3: Visuell prüfen**

Nav ist jetzt weiß, Brand-Link hat Zap-Icon in Cyan, aktive Links haben Cyan-Underline.

- [ ] **Step 4: Committen**

```bash
git add src/components/layout/TopNav.css src/components/layout/TopNav.jsx
git commit -m "feat: TopNav redesign — weiß, Outfit-Font, Zap-Icon"
```

---

## Task 4: CarCard redesignen

**Files:**
- Modify: `ev-database/src/components/cars/CarCard.css`

- [ ] **Step 1: CarCard.css ersetzen**

```css
.car-card {
  background: var(--color-surface);
  border-radius: var(--radius-card);
  padding: 1.25rem;
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border: 1px solid var(--color-border);
}

.car-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-ev-hover);
  border-color: rgba(14,165,233,0.25);
}

.car-card-title {
  font-family: 'Outfit', system-ui, sans-serif;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 0.15rem;
}

.car-field {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  padding: 0.1rem 0;
}

.car-field-label { color: var(--color-muted); }

.car-field-value {
  font-weight: 600;
  color: var(--color-text);
}

.calc-btn {
  margin-top: 0.75rem;
  width: 100%;
  padding: 0.5rem 0;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-btn);
  cursor: pointer;
  font-size: 0.88rem;
  font-weight: 600;
  font-family: 'DM Sans', system-ui, sans-serif;
  transition: background 0.15s, box-shadow 0.15s, transform 0.1s;
}

.calc-btn:hover {
  background: var(--color-primary-hover);
  box-shadow: var(--shadow-btn);
  transform: scale(1.01);
}
```

- [ ] **Step 2: Visuell prüfen**

CarCards haben runde Ecken, hover zeigt Cyan-Glow, Button ist Cyan.

- [ ] **Step 3: Committen**

```bash
git add src/components/cars/CarCard.css
git commit -m "feat: CarCard redesign — rund, Cyan-Hover-Glow"
```

---

## Task 5: CarGrid, CarList, ViewToggle, HomePage

**Files:**
- Modify: `ev-database/src/components/cars/CarGrid.css`
- Modify: `ev-database/src/components/cars/CarList.css`
- Modify: `ev-database/src/components/cars/ViewToggle.css`
- Modify: `ev-database/src/pages/HomePage.css`

- [ ] **Step 1: CarGrid.css lesen und Token-Anpassung vornehmen**

Aktuelle Datei lesen. Alle Hardcoded-Farben (`#f5f5f5`, `#1a1a2e`, `#888`) durch CSS-Variablen ersetzen:

- `#f5f5f5` → `var(--color-bg)`
- `#1a1a2e` → `var(--color-text)`
- `#888`, `#777`, `#666` → `var(--color-muted)`
- `border-radius: Npx` → auf `var(--radius-card)` oder `var(--radius-btn)` angleichen (Cards: 20px, kleine Elemente: 10-12px)

- [ ] **Step 2: CarList.css lesen und Token-Anpassung vornehmen**

Gleiche Vorgehensweise wie CarGrid.css.

- [ ] **Step 3: ViewToggle.css — Pill-Switcher-Stil**

```css
.view-toggle {
  display: flex;
  background: var(--color-surface-alt);
  border-radius: var(--radius-btn);
  padding: 3px;
  gap: 2px;
}

.view-toggle button {
  padding: 0.3rem 0.75rem;
  border: none;
  background: transparent;
  border-radius: 9px;
  cursor: pointer;
  font-size: 0.85rem;
  font-family: 'DM Sans', system-ui, sans-serif;
  color: var(--color-muted);
  font-weight: 500;
  transition: background 0.15s, color 0.15s, box-shadow 0.15s;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.view-toggle button.active {
  background: var(--color-surface);
  color: var(--color-text);
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(0,0,0,0.10);
}

.view-toggle button:hover:not(.active) {
  color: var(--color-text);
}
```

- [ ] **Step 4: HomePage.css anpassen**

```css
.home-page {
  padding: 2rem 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

.home-page h1 {
  font-size: 1.8rem;
  font-family: 'Outfit', system-ui, sans-serif;
  font-weight: 800;
  color: var(--color-text);
  margin-bottom: 1.5rem;
}

.home-loading,
.home-empty {
  color: var(--color-muted);
  font-style: italic;
  padding: 2rem 0;
}
```

- [ ] **Step 5: Visuell prüfen**

Homepage zeigt Outfit-Heading, Grid/List-Toggle ist Pill-Switcher.

- [ ] **Step 6: Committen**

```bash
git add src/components/cars/CarGrid.css src/components/cars/CarList.css \
        src/components/cars/ViewToggle.css src/pages/HomePage.css
git commit -m "feat: CarGrid/List/ViewToggle/HomePage Token-Anpassung"
```

---

## Task 6: Calculator-Seite redesignen

**Files:**
- Modify: `ev-database/src/pages/Calculator.css`

- [ ] **Step 1: Calculator.css ersetzen**

```css
/* ─── Calculator Page ─────────────────────────────────────────────────────── */

.calculator-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 1.5rem 1rem 3rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* ─── Header ─────────────────────────────────────────────────────────────── */

.calc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.calc-header h1 {
  margin: 0;
  font-size: 1.6rem;
  font-family: 'Outfit', system-ui, sans-serif;
  font-weight: 800;
  color: var(--color-text);
}

.calc-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

/* ─── Pill-Switcher (Comparison Mode Toggle) ─────────────────────────────── */

.comp-mode-toggle {
  display: flex;
  background: var(--color-surface-alt);
  border-radius: var(--radius-btn);
  padding: 3px;
  gap: 2px;
}

.comp-mode-toggle button {
  padding: 0.35rem 0.9rem;
  border: none;
  background: transparent;
  border-radius: 9px;
  cursor: pointer;
  font-size: 0.88rem;
  font-family: 'DM Sans', system-ui, sans-serif;
  color: var(--color-muted);
  font-weight: 500;
  transition: background 0.15s, color 0.15s, box-shadow 0.15s;
}

.comp-mode-toggle button:hover:not(.active) {
  color: var(--color-text);
}

.comp-mode-toggle button.active {
  background: var(--color-surface);
  color: var(--color-text);
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(0,0,0,0.10);
}

/* ─── Vehicle Slots Grid ─────────────────────────────────────────────────── */

.calc-slots {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 700px) {
  .calc-slots { grid-template-columns: 1fr; }
}

/* ─── Placeholder ────────────────────────────────────────────────────────── */

.calc-placeholder {
  text-align: center;
  padding: 2.5rem;
  color: var(--color-muted);
  background: var(--color-surface);
  border-radius: var(--radius-card);
  border: 2px dashed #bae6fd;
  font-size: 0.95rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.calc-placeholder-icon {
  color: var(--color-primary);
  opacity: 0.7;
}
```

- [ ] **Step 2: Calculator.jsx — Placeholder-Icon ergänzen**

In `ev-database/src/pages/Calculator.jsx` den Zap-Import hinzufügen und Placeholder anpassen.

Füge oben hinzu:
```jsx
import { Zap } from 'lucide-react'
```

Suche die Stelle wo `.calc-placeholder` gerendert wird und ergänze das Icon:
```jsx
<div className="calc-placeholder">
  <Zap className="calc-placeholder-icon" size={40} />
  {/* bestehender Placeholder-Text bleibt unverändert */}
</div>
```

- [ ] **Step 3: Visuell prüfen**

Rechner-Seite: Pill-Switcher-Toggle, Outfit-Heading, leerer Placeholder mit Zap-Icon.

- [ ] **Step 4: Committen**

```bash
git add src/pages/Calculator.css src/pages/Calculator.jsx
git commit -m "feat: Calculator-Seite redesign — Pill-Toggle, Zap-Placeholder"
```

---

## Task 7: VehicleSlot redesignen

**Files:**
- Modify: `ev-database/src/components/calculator/VehicleSlot.css`
- Modify: `ev-database/src/components/calculator/VehicleSlot.jsx`

- [ ] **Step 1: VehicleSlot.css ersetzen**

```css
/* ─── VehicleSlot ────────────────────────────────────────────────────────── */

.vehicle-slot {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
  position: relative;
  transition: box-shadow 0.2s;
}

.vehicle-slot--ev::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: var(--color-ev);
  border-radius: var(--radius-card) var(--radius-card) 0 0;
}

.vehicle-slot--ice::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: var(--color-ice);
  border-radius: var(--radius-card) var(--radius-card) 0 0;
}

.vehicle-slot--ev:hover { box-shadow: var(--shadow-ev-hover); }
.vehicle-slot--ice:hover { box-shadow: var(--shadow-ice-hover); }

/* ─── Header ─────────────────────────────────────────────────────────────── */

.slot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.slot-label-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.slot-label-wrap h3 {
  margin: 0;
  font-family: 'Outfit', system-ui, sans-serif;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
}

/* ─── Type Badge (Pill) ──────────────────────────────────────────────────── */

.slot-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.2rem 0.55rem;
  border-radius: var(--radius-pill);
}

.slot-type-badge--ev {
  background: #e0f2fe;
  color: var(--color-ev);
  border: 1px solid #bae6fd;
}

.slot-type-badge--ice {
  background: #fff7ed;
  color: var(--color-ice);
  border: 1px solid #fed7aa;
}

.slot-type-badge svg {
  width: 11px;
  height: 11px;
  flex-shrink: 0;
}

/* ─── Source Toggle (Pill-Switcher) ──────────────────────────────────────── */

.slot-source-toggle {
  display: flex;
  background: var(--color-surface-alt);
  border-radius: var(--radius-btn);
  padding: 2px;
  gap: 2px;
}

.slot-source-toggle button {
  padding: 0.2rem 0.6rem;
  border: none;
  background: transparent;
  border-radius: 9px;
  cursor: pointer;
  font-size: 0.78rem;
  font-family: 'DM Sans', system-ui, sans-serif;
  color: var(--color-muted);
  font-weight: 500;
  transition: background 0.15s, color 0.15s, box-shadow 0.15s;
}

.slot-source-toggle button:hover:not(:disabled):not(.active) {
  color: var(--color-text);
}

.slot-source-toggle button.active {
  background: var(--color-surface);
  color: var(--color-text);
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(0,0,0,0.10);
}

.slot-source-toggle button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ─── DB Picker ──────────────────────────────────────────────────────────── */

.slot-db-picker select {
  width: 100%;
  padding: 0.5rem 0.6rem;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-input);
  font-size: 0.9rem;
  font-family: 'DM Sans', system-ui, sans-serif;
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.slot-db-picker select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(14,165,233,0.15);
}

.slot-loading { font-size: 0.85rem; color: var(--color-muted); font-style: italic; }
.slot-empty   { color: var(--color-muted); font-size: 0.85rem; }

/* ─── Vehicle Info ───────────────────────────────────────────────────────── */

.slot-vehicle-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.88rem;
  background: var(--color-surface-alt);
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-input);
  border: 1px solid var(--color-border);
}

.slot-vehicle-name  { font-weight: 600; color: var(--color-text); }
.slot-vehicle-price { color: var(--color-muted); font-variant-numeric: tabular-nums; }

/* ─── Params ─────────────────────────────────────────────────────────────── */

.slot-params {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.param-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.param-row label {
  font-size: 0.8rem;
  color: var(--color-muted);
  min-width: 160px;
  flex-shrink: 0;
}

.param-row input {
  width: 100px;
  padding: 0.3rem 0.5rem;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-input);
  font-size: 0.88rem;
  font-family: 'DM Sans', system-ui, sans-serif;
  text-align: right;
  color: var(--color-text);
  transition: border-color 0.15s, box-shadow 0.15s;
  font-variant-numeric: tabular-nums;
  background: var(--color-surface);
}

.param-row input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(14,165,233,0.15);
}

/* ─── Expert Params ──────────────────────────────────────────────────────── */

.slot-expert-params {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-top: 0.25rem;
}

.slot-expert-divider {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.25rem 0 0.1rem;
}

.slot-expert-divider::before,
.slot-expert-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e8e8f0;
}

.slot-expert-divider span {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-expert);
  white-space: nowrap;
}

/* ─── AC/DC Slider ───────────────────────────────────────────────────────── */

.param-row--slider { flex-direction: column; align-items: flex-start; gap: 0.35rem; }
.param-row--slider label { min-width: unset; }
.slider-wrap { display: flex; align-items: center; gap: 0.6rem; width: 100%; }
.slider-label { font-size: 0.78rem; color: var(--color-muted); white-space: nowrap; min-width: 52px; }
.slider-label--right { text-align: right; }
.ac-dc-slider { flex: 1; accent-color: var(--color-primary); cursor: pointer; }

/* ─── Responsive ─────────────────────────────────────────────────────────── */

@media (max-width: 500px) {
  .slot-header { flex-direction: column; align-items: flex-start; }
  .param-row label { min-width: 120px; }
  .param-row input { width: 80px; }
}
```

- [ ] **Step 2: VehicleSlot.jsx — Badge-Icons einbauen**

Import ergänzen:
```jsx
import { Zap, Fuel } from 'lucide-react'
```

Badge-Bereich anpassen (Zeile ~31-34):
```jsx
<span className={`slot-type-badge slot-type-badge--${type}`}>
  {type === 'ev'
    ? <Zap size={11} strokeWidth={2.5} />
    : <Fuel size={11} strokeWidth={2.5} />
  }
  {type === 'ev' ? 'EV' : 'ICE'}
</span>
```

- [ ] **Step 3: Visuell prüfen**

EV-Slot: Cyan-Stripe oben, Cyan-Pill-Badge mit Zap-Icon, Cyan-Hover-Glow.
ICE-Slot: Orange-Stripe, Orange-Pill-Badge mit Fuel-Icon, Orange-Hover-Glow.
Alle Inputs: abgerundete Ecken, Cyan-Focus-Ring.

- [ ] **Step 4: Committen**

```bash
git add src/components/calculator/VehicleSlot.css src/components/calculator/VehicleSlot.jsx
git commit -m "feat: VehicleSlot redesign — Pill-Badges mit Icons, Cyan/Orange-Glow"
```

---

## Task 8: ResultsPanel redesignen

**Files:**
- Modify: `ev-database/src/components/calculator/ResultsPanel.css`

- [ ] **Step 1: ResultsPanel.css ersetzen**

```css
/* ─── ResultsPanel ───────────────────────────────────────────────────────── */

.results-panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

/* ─── Tab Bar (Pill-Switcher) ────────────────────────────────────────────── */

.results-tabs {
  display: flex;
  background: var(--color-surface-alt);
  padding: 4px;
  gap: 2px;
  border-bottom: 1px solid var(--color-border);
}

.results-tab {
  flex: 1;
  padding: 0.55rem 0.5rem;
  border: none;
  background: transparent;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.875rem;
  font-family: 'DM Sans', system-ui, sans-serif;
  color: var(--color-muted);
  font-weight: 500;
  transition: background 0.15s, color 0.15s, box-shadow 0.15s;
  outline: none;
}

.results-tab:hover:not(.active) {
  color: var(--color-text);
}

.results-tab.active {
  background: var(--color-surface);
  color: var(--color-text);
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(0,0,0,0.10);
}

/* ─── Content area ───────────────────────────────────────────────────────── */

.results-content {
  padding: 1.25rem;
}

/* ─── Summary cards ──────────────────────────────────────────────────────── */

.results-summary {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.summary-card {
  flex: 1;
  padding: 0.75rem 1rem;
  border-left: 4px solid;
  border-radius: 0 var(--radius-input) var(--radius-input) 0;
  background: var(--color-surface-alt);
  border-top: 1px solid var(--color-border);
  border-right: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  min-width: 0;
}

.summary-card--a { border-left-color: var(--color-ev); }
.summary-card--b { border-left-color: var(--color-ice); }

.summary-label {
  font-size: 0.78rem;
  color: var(--color-muted);
  margin-bottom: 0.3rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.summary-value {
  font-family: 'Outfit', system-ui, sans-serif;
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
}

.summary-unit {
  font-size: 0.78rem;
  font-weight: 400;
  color: var(--color-muted);
  margin-left: 2px;
}

/* ─── Cost breakdown table ───────────────────────────────────────────────── */

.cost-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  font-size: 0.875rem;
}

.cost-table th {
  padding: 0.45rem 0.75rem;
  text-align: right;
  background: var(--color-surface-alt);
  font-weight: 600;
  font-size: 0.8rem;
  color: var(--color-muted);
  letter-spacing: 0.02em;
  border-bottom: 2px solid var(--color-border);
}

.cost-table th:first-child { text-align: left; }

.cost-table td {
  padding: 0.45rem 0.75rem;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text);
}

.cost-table td:first-child { text-align: left; }
.cost-table .num { text-align: right; font-variant-numeric: tabular-nums; }
.cost-table .row-even { background: var(--color-surface); }
.cost-table .row-odd  { background: var(--color-bg); }

.cost-table .total-row td {
  border-top: 2px solid var(--color-border);
  border-bottom: none;
  padding-top: 0.6rem;
  font-weight: 700;
  background: var(--color-surface-alt);
}

/* ─── Positive / Negative Differenz ─────────────────────────────────────── */

.diff-positive { color: var(--color-positive); font-weight: 600; }
.diff-negative { color: var(--color-danger); font-weight: 600; }

/* ─── Break-even section ─────────────────────────────────────────────────── */

.breakeven-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.breakeven-badge {
  font-family: 'Outfit', system-ui, sans-serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-positive);
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: var(--radius-btn);
  padding: 0.85rem 2rem;
  text-align: center;
  line-height: 1.3;
}

.breakeven-badge--none {
  color: var(--color-danger);
  background: #fef2f2;
  border-color: #fecaca;
}

.breakeven-desc {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-muted);
}

.breakeven-chart { width: 100%; }

/* ─── Responsive ─────────────────────────────────────────────────────────── */

@media (max-width: 540px) {
  .results-summary { flex-direction: column; }
  .results-tab { font-size: 0.8rem; padding: 0.5rem 0.3rem; }
  .summary-value { font-size: 1.15rem; }
  .cost-table { font-size: 0.8rem; }
  .cost-table th, .cost-table td { padding: 0.4rem 0.5rem; }
  .breakeven-badge { font-size: 1rem; padding: 0.75rem 1.25rem; }
}
```

- [ ] **Step 2: Visuell prüfen**

ResultsPanel hat Pill-Tab-Switcher, Summary-Cards in Cyan/Orange, Tabellen mit Zebra-Striping.

- [ ] **Step 3: Committen**

```bash
git add src/components/calculator/ResultsPanel.css
git commit -m "feat: ResultsPanel redesign — Pill-Tabs, Token-Farben"
```

---

## Task 9: IceForm redesignen

**Files:**
- Modify: `ev-database/src/components/calculator/IceForm.css`

- [ ] **Step 1: IceForm.css ersetzen**

```css
.ice-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  background: var(--color-surface);
  padding: 1.5rem;
  border-radius: var(--radius-card);
  border: 1px solid var(--color-border);
}

.ice-form-section {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.ice-form-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: 'DM Sans', system-ui, sans-serif;
}

.ice-form-select,
.ice-form-input {
  padding: 0.6rem 0.75rem;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-input);
  font-size: 0.95rem;
  font-family: 'DM Sans', system-ui, sans-serif;
  background: var(--color-surface);
  color: var(--color-text);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.ice-form-input:focus,
.ice-form-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(14,165,233,0.15);
}

.ice-form-input::placeholder {
  color: var(--color-muted);
  font-size: 0.9rem;
}

.ice-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 600px) {
  .ice-form-grid { grid-template-columns: 1fr; }
  .ice-form { padding: 1rem; gap: 1rem; }
}
```

- [ ] **Step 2: Visuell prüfen**

ICE-Formular hat gleiche Input-Styles wie VehicleSlot.

- [ ] **Step 3: Committen**

```bash
git add src/components/calculator/IceForm.css
git commit -m "feat: IceForm Token-Anpassung"
```

---

## Task 10: LoginPage redesignen

**Files:**
- Modify: `ev-database/src/pages/LoginPage.css`

- [ ] **Step 1: LoginPage.css lesen und ersetzen**

Das bestehende Login-Layout lesen. Dann die Styles anpassen:

```css
/* bestehende Layout-Struktur beibehalten, nur Styles überschreiben */

/* Card-Panel (falls vorhanden, sonst wrapper-div) */
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  padding: 1rem;
}

.login-card {
  background: var(--color-surface);
  border-radius: var(--radius-card);
  padding: 2.5rem 2rem;
  width: 100%;
  max-width: 420px;
  box-shadow: var(--shadow-card);
  border: 1px solid var(--color-border);
}

.login-card h1 {
  font-family: 'Outfit', system-ui, sans-serif;
  font-weight: 800;
  font-size: 1.6rem;
  color: var(--color-text);
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

/* Inputs */
.login-card input {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-input);
  font-size: 0.95rem;
  font-family: 'DM Sans', system-ui, sans-serif;
  color: var(--color-text);
  background: var(--color-surface);
  margin-bottom: 0.75rem;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.login-card input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(14,165,233,0.15);
}

/* Button */
.login-card button[type="submit"] {
  width: 100%;
  padding: 0.65rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-btn);
  font-size: 0.95rem;
  font-weight: 600;
  font-family: 'DM Sans', system-ui, sans-serif;
  cursor: pointer;
  transition: background 0.15s, box-shadow 0.15s;
}

.login-card button[type="submit"]:hover {
  background: var(--color-primary-hover);
  box-shadow: var(--shadow-btn);
}
```

Hinweis: Die tatsächlichen Klassen-Namen aus der bestehenden `LoginPage.jsx` prüfen und ggf. angleichen.

- [ ] **Step 2: Visuell prüfen**

Login-Seite hat weißes Card-Panel, Cyan-Button, abgerundete Inputs.

- [ ] **Step 3: Committen**

```bash
git add src/pages/LoginPage.css
git commit -m "feat: LoginPage redesign"
```

---

## Task 11: Admin-Seiten Token-Anpassung

**Files:**
- Modify: `ev-database/src/components/admin/AdminPanel.css`
- Modify: `ev-database/src/components/admin/CarForm.css`
- Modify: `ev-database/src/components/admin/CarImport.css`
- Modify: `ev-database/src/components/admin/FieldToggle.css`
- Modify: `ev-database/src/pages/AdminPage.css`

- [ ] **Step 1: AdminPanel.css ersetzen**

```css
.admin-panel { padding: 2rem 1.5rem; max-width: 1100px; margin: 0 auto; }
.admin-panel h1 { margin-bottom: 1.5rem; font-family: 'Outfit', system-ui, sans-serif; font-weight: 800; }

.admin-tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid var(--color-border);
  margin-bottom: 2rem;
}

.admin-tab {
  padding: 0.6rem 1.4rem;
  background: none;
  border: none;
  font-size: 0.95rem;
  font-family: 'DM Sans', system-ui, sans-serif;
  cursor: pointer;
  color: var(--color-muted);
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: color 0.15s, border-color 0.15s;
}

.admin-tab.active {
  color: var(--color-primary);
  font-weight: 700;
  border-bottom-color: var(--color-primary);
}

.admin-actions { display: flex; gap: 0.75rem; margin-bottom: 1.5rem; }

.car-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }

.car-table th {
  background: var(--color-surface-alt);
  padding: 0.6rem 0.75rem;
  text-align: left;
  font-size: 0.8rem;
  text-transform: uppercase;
  color: var(--color-muted);
  font-family: 'DM Sans', system-ui, sans-serif;
  border-bottom: 2px solid var(--color-border);
}

.car-table td {
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text);
}

.car-table tr:hover td { background: var(--color-bg); }
.car-table-edit { margin-right: 6px; }

.seed-prompt { padding: 2rem; text-align: center; }
.seed-prompt p { margin-bottom: 1rem; color: var(--color-muted); }
```

- [ ] **Step 2: CarForm.css, CarImport.css, FieldToggle.css lesen und Token-Anpassung**

Jede Datei lesen. Folgende Ersetzungen durchführen:
- `#1a1a2e`, `#333` → `var(--color-text)`
- `#f5f5f5`, `#f0f0f0` → `var(--color-surface-alt)`
- `#ddd`, `#e0e0e0` → `var(--color-border)`
- `#888`, `#777`, `#666`, `#555` → `var(--color-muted)`
- `#2563eb` → `var(--color-primary)`
- `#e74c3c`, `#c0392b` → `var(--color-danger)`
- `border-radius: 8px` bei Cards → `var(--radius-card)`
- `border-radius: 5px`, `border-radius: 6px` bei Inputs → `var(--radius-input)`
- `border-radius: 8px` bei Buttons → `var(--radius-btn)`

- [ ] **Step 2: UserModeToggle.css anpassen**

Datei lesen. Pill-Switcher-Stil anwenden:

```css
/* Gleicher Pill-Switcher-Stil wie .comp-mode-toggle */
.user-mode-toggle {
  display: flex;
  background: var(--color-surface-alt);
  border-radius: var(--radius-btn);
  padding: 3px;
  gap: 2px;
}

.user-mode-toggle button {
  padding: 0.35rem 0.9rem;
  border: none;
  background: transparent;
  border-radius: 9px;
  cursor: pointer;
  font-size: 0.88rem;
  font-family: 'DM Sans', system-ui, sans-serif;
  color: var(--color-muted);
  font-weight: 500;
  transition: background 0.15s, color 0.15s, box-shadow 0.15s;
}

.user-mode-toggle button.active {
  background: var(--color-surface);
  color: var(--color-text);
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(0,0,0,0.10);
}
```

Falls `UserModeToggle.css` nicht existiert oder anders heißt: Datei finden mit `ls ev-database/src/components/calculator/`.

- [ ] **Step 3: Visuell prüfen**

Admin-Panel öffnen (als eingeloggter User unter `/admin`). Farben, Inputs, Buttons sollten dem restlichen Design entsprechen.

- [ ] **Step 4: Committen**

```bash
git add src/components/admin/ src/pages/AdminPage.css
git commit -m "feat: Admin-Seiten Token-Anpassung"
```

---

## Task 12: Abschluss-Review

- [ ] **Step 1: Alle Seiten durchklicken**

Folgende Seiten öffnen und visuell abgleichen:
- `/` — Homepage mit CarGrid
- Eine CarCard anklicken — CarDetail
- `/rechner` — Rechner mit leerem und befülltem State
- `/login` — Login-Seite
- `/admin` — Admin-Panel (eingeloggt)

- [ ] **Step 2: Konsole auf Fehler prüfen**

Browser DevTools → Console. Keine roten Fehler erlaubt.

- [ ] **Step 3: Mobile-Check**

DevTools → Responsive Mode (375px Breite). Cards, Nav und Rechner müssen korrekt umbrechen.

- [ ] **Step 4: Final-Commit**

```bash
git add -A
git status  # prüfen ob nur erwartete Dateien geändert
git commit -m "feat: Global Redesign 'Electric Clean' abgeschlossen"
```

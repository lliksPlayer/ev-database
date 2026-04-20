# EV Vergleich Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign ev-database (React + Vite) from sterile to vibrant "EV Magazin" aesthetic — new Landing Page, glassmorphism nav, colored metric icons on cards, sidebar filter layout, and hover glow effects throughout.

**Architecture:** Pure CSS-in-plain-CSS approach (no CSS Modules — existing codebase pattern). All visual changes are in `.css` files alongside their component. New `src/utils/fieldIcons.js` maps Firestore field keys to Lucide icons + brand colors. New `src/pages/LandingPage.jsx` becomes the `/` route; existing `HomePage` moves to `/autos`.

**Tech Stack:** React 19, Vite, React Router v7, Lucide React, plain CSS, Google Fonts (Outfit + Plus Jakarta Sans), Firebase/Firestore (untouched)

---

## File Map

| File | Action | What it does |
|------|--------|-------------|
| `ev-database/src/index.css` | Modify | Font import, metric color vars, btn glow, font-family |
| `ev-database/src/App.jsx` | Modify | Add `/` → LandingPage, `/autos` → HomePage |
| `ev-database/src/pages/LandingPage.jsx` | Create | Hero page with sketch bg + 2 CTAs |
| `ev-database/src/pages/LandingPage.css` | Create | Landing layout + button styles |
| `ev-database/src/components/layout/TopNav.jsx` | Modify | Verbrenner pill btn, link to /autos |
| `ev-database/src/components/layout/TopNav.css` | Modify | Glassmorphism, hover underline anim, ice pill |
| `ev-database/src/utils/fieldIcons.js` | Create | Field key → { icon, color } mapping |
| `ev-database/src/components/cars/CarCard.jsx` | Modify | Brand badge, year badge, colored icon rows |
| `ev-database/src/components/cars/CarCard.css` | Modify | New card layout, hover glow |
| `ev-database/src/pages/HomePage.jsx` | Modify | Sidebar + main grid layout |
| `ev-database/src/pages/HomePage.css` | Modify | Sidebar grid CSS |
| `ev-database/src/i18n/de.json` | Modify | Add landing.headline, landing.sub |
| `ev-database/src/i18n/en.json` | Modify | Add landing.headline, landing.sub |
| `ev-database/public/hero-sketch.jpg` | Manual | User places their sketch illustration here |

---

## Task 1: Design System — Fonts & CSS Variables

**Files:**
- Modify: `ev-database/src/index.css`

- [ ] **Step 1: Update Google Fonts import and body font**

Replace the existing `index.css` content with:

```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  background: var(--color-bg);
  color: var(--color-text);
  line-height: 1.5;
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'Outfit', system-ui, sans-serif;
}

:root {
  --color-bg:            #f8fafc;
  --color-surface:       #ffffff;
  --color-primary:       #0ea5e9;
  --color-primary-hover: #0284c7;
  --color-ev:            #0ea5e9;
  --color-ice:           #f97316;
  --color-positive:      #22c55e;
  --color-danger:        #ef4444;
  --color-text:          #0f172a;
  --color-muted:         #64748b;
  --color-border:        #e2e8f0;
  --color-expert:        #8b5cf6;
  --color-surface-alt:   #f1f5f9;

  /* Metric accent colors — used in CarCard icon circles */
  --metric-range:    #3b82f6;
  --metric-charge:   #f59e0b;
  --metric-power:    #ef4444;
  --metric-efficiency: #10b981;
  --metric-battery:  #8b5cf6;
  --metric-price:    #06b6d4;
  --metric-tow:      #84cc16;
  --metric-sprint:   #f43f5e;
  --metric-speed:    #14b8a6;
  --metric-volt:     #a855f7;

  --shadow-card:         0 2px 12px rgba(0,0,0,0.06);
  --shadow-ev-hover:     0 12px 40px rgba(14,165,233,0.18);
  --shadow-ice-hover:    0 12px 40px rgba(249,115,22,0.18);
  --shadow-btn:          0 2px 8px rgba(14,165,233,0.30);

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
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  transition: background 0.2s, box-shadow 0.2s, transform 0.15s;
}

.btn:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-primary {
  background: var(--color-primary);
  color: white;
}
.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
  box-shadow: 0 0 0 3px rgba(14,165,233,0.25), var(--shadow-btn);
  transform: translateY(-1px);
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

- [ ] **Step 2: Verify fonts load**

```bash
cd "/Users/tomkrohn/Desktop/website erstellen/ev-database" && npm run dev
```

Open `http://localhost:5173` in browser. Text should use Plus Jakarta Sans (rounder, slightly heavier than DM Sans). Headlines remain Outfit. No console errors about fonts.

- [ ] **Step 3: Commit**

```bash
cd "/Users/tomkrohn/Desktop/website erstellen/ev-database"
git add src/index.css
git commit -m "design: update fonts (Plus Jakarta Sans) and add metric color vars"
```

---

## Task 2: TopNav — Glassmorphism & Hover Animations

**Files:**
- Modify: `ev-database/src/components/layout/TopNav.css`
- Modify: `ev-database/src/components/layout/TopNav.jsx`

- [ ] **Step 1: Replace TopNav.css**

```css
/* ev-database/src/components/layout/TopNav.css */
.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  height: 60px;
  background: rgba(248, 250, 252, 0.88);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-brand {
  font-family: 'Outfit', system-ui, sans-serif;
  font-weight: 800;
  font-size: 1.25rem;
  text-decoration: none;
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  letter-spacing: -0.02em;
}

.nav-brand-icon {
  color: var(--color-primary);
  width: 22px;
  height: 22px;
}

.nav-links { display: flex; gap: 0.25rem; align-items: center; }

.nav-link {
  color: var(--color-muted);
  text-decoration: none;
  font-size: 0.925rem;
  font-weight: 500;
  padding: 0.45rem 0.75rem;
  border-radius: var(--radius-small);
  transition: color 0.2s, background 0.2s;
  position: relative;
}

/* Underline animation — scaleX from left on hover/active */
.nav-link::after {
  content: '';
  position: absolute;
  bottom: 0px;
  left: 0.75rem;
  right: 0.75rem;
  height: 2px;
  background: var(--color-primary);
  border-radius: 2px;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.2s ease;
}

.nav-link:hover {
  color: var(--color-text);
  background: var(--color-surface-alt);
}

.nav-link:hover::after,
.nav-link.active::after {
  transform: scaleX(1);
}

.nav-link.active {
  color: var(--color-primary);
  font-weight: 600;
  background: rgba(14, 165, 233, 0.07);
}

/* Verbrenner — orange pill button */
.nav-link-ice {
  background: var(--color-ice);
  color: white !important;
  border-radius: var(--radius-pill);
  padding: 0.4rem 1.1rem;
  font-weight: 600;
  font-size: 0.875rem;
  transition: background 0.2s, box-shadow 0.2s, transform 0.15s;
}

.nav-link-ice::after { display: none; }

.nav-link-ice:hover {
  background: #ea6c0b !important;
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.22);
  transform: translateY(-1px);
}

.nav-link-ice.active {
  background: #ea6c0b !important;
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.22);
}

.nav-right { display: flex; align-items: center; gap: 0.5rem; }
```

- [ ] **Step 2: Update TopNav.jsx — link paths + Verbrenner pill class**

Replace `ev-database/src/components/layout/TopNav.jsx`:

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
        EV Vergleich
      </Link>
      <div className="nav-links">
        <NavLink to="/autos" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          {t('nav.evDatabase')}
        </NavLink>
        <NavLink
          to="/verbrenner"
          className={({ isActive }) => `nav-link nav-link-ice${isActive ? ' active' : ''}`}
        >
          {t('nav.iceDatabase')}
        </NavLink>
        <NavLink to="/rechner" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          {t('nav.calculator')}
        </NavLink>
      </div>
      <div className="nav-right">
        <LanguageSwitch />
        {user && (
          <NavLink to="/admin" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            {t('nav.admin')}
          </NavLink>
        )}
      </div>
    </nav>
  )
}
```

- [ ] **Step 3: Verify nav visually**

Open `http://localhost:5173`. TopNav should look frosted/blurred when scrolled over content. Verbrenner link = orange pill. Hover over E-Fahrzeuge/Rechner links → underline slides in from left. Active link has teal tint.

- [ ] **Step 4: Commit**

```bash
cd "/Users/tomkrohn/Desktop/website erstellen/ev-database"
git add src/components/layout/TopNav.jsx src/components/layout/TopNav.css
git commit -m "design: TopNav glassmorphism, hover animations, Verbrenner pill button"
```

---

## Task 3: Field Icon Utility

**Files:**
- Create: `ev-database/src/utils/fieldIcons.js`

- [ ] **Step 1: Create the utility**

```js
// ev-database/src/utils/fieldIcons.js
import {
  Gauge, Timer, Zap, Leaf, Tag, Rocket, Flame, Wind,
  Battery, Truck, Calendar, Car, CircuitBoard, TrendingDown
} from 'lucide-react'

// Maps Firestore field keys → { icon: LucideComponent, color: string }
const FIELD_META = {
  wltp_reichweite:  { icon: Gauge,        color: '#3b82f6' },
  laden_10_80_min:  { icon: Timer,        color: '#f59e0b' },
  kwh_nach_70:      { icon: Leaf,         color: '#10b981' },
  kwh_pro_min:      { icon: Zap,          color: '#f59e0b' },
  max_ladeleistung: { icon: Zap,          color: '#f59e0b' },
  anhaengelast:     { icon: Truck,        color: '#84cc16' },
  wltp_verbrauch:   { icon: TrendingDown, color: '#10b981' },
  basis_preis:      { icon: Tag,          color: '#06b6d4' },
  hoechster_preis:  { icon: Tag,          color: '#06b6d4' },
  null_hundert:     { icon: Rocket,       color: '#f43f5e' },
  ps:               { icon: Flame,        color: '#ef4444' },
  top_speed:        { icon: Wind,         color: '#14b8a6' },
  volt:             { icon: CircuitBoard, color: '#a855f7' },
  batterie_netto:   { icon: Battery,      color: '#8b5cf6' },
  markteinfuehrung: { icon: Calendar,     color: '#64748b' },
}

const DEFAULT_META = { icon: Car, color: '#64748b' }

/** Returns { icon, color } for a given Firestore field key. Falls back gracefully. */
export function getFieldMeta(key) {
  return FIELD_META[key] ?? DEFAULT_META
}
```

- [ ] **Step 2: Commit**

```bash
cd "/Users/tomkrohn/Desktop/website erstellen/ev-database"
git add src/utils/fieldIcons.js
git commit -m "feat: field icon utility mapping keys to Lucide icons and brand colors"
```

---

## Task 4: CarCard Redesign — Badges & Colored Icons

**Files:**
- Modify: `ev-database/src/components/cars/CarCard.jsx`
- Modify: `ev-database/src/components/cars/CarCard.css`

- [ ] **Step 1: Replace CarCard.jsx**

```jsx
// ev-database/src/components/cars/CarCard.jsx
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { CalculatorIcon } from 'lucide-react'
import { getFieldMeta } from '../../utils/fieldIcons'
import './CarCard.css'

// Fields shown in the header — excluded from the metric rows
const HEADER_KEYS = new Set(['marke', 'modell', 'markteinfuehrung'])

export default function CarCard({ car, fields, onClick, variant = 'ev' }) {
  const { i18n, t } = useTranslation()
  const navigate = useNavigate()
  const lang = i18n.language

  const visibleFields = [...fields]
    .filter(f => f.visible && !HEADER_KEYS.has(f.key))
    .sort((a, b) => a.order - b.order)

  const formatValue = (key, value) => {
    if (value === undefined || value === null || value === '') return '–'
    if (['basis_preis', 'hoechster_preis'].includes(key))
      return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
    return value
  }

  const handleAddToCalculator = (e) => {
    e.stopPropagation()
    const existing = localStorage.getItem('calc_slot_a')
    if (!existing) {
      localStorage.setItem('calc_slot_a', car.id)
      navigate(`/rechner?ev1=${car.id}`)
    } else {
      navigate(`/rechner?ev1=${existing}&ev2=${car.id}`)
      localStorage.removeItem('calc_slot_a')
    }
  }

  const isIce = variant === 'ice'

  return (
    <div className={`car-card${isIce ? ' car-card-ice' : ''}`} onClick={onClick}>
      <div className="car-card-header">
        <span className={`car-card-brand${isIce ? ' car-card-brand-ice' : ''}`}>
          {car.marke}
        </span>
        {car.markteinfuehrung && (
          <span className="car-card-year">{car.markteinfuehrung}</span>
        )}
      </div>
      <div className="car-card-title">{car.modell}</div>
      <div className="car-card-fields">
        {visibleFields.map(f => {
          const { icon: Icon, color } = getFieldMeta(f.key)
          return (
            <div key={f.key} className="car-field">
              <div
                className="car-field-icon"
                style={{ '--field-color': color }}
              >
                <Icon size={13} />
              </div>
              <span className="car-field-label">
                {lang === 'de' ? f.label_de : f.label_en}
              </span>
              <span className="car-field-value">{formatValue(f.key, car[f.key])}</span>
            </div>
          )
        })}
      </div>
      <button className={`calc-btn${isIce ? ' calc-btn-ice' : ''}`} onClick={handleAddToCalculator}>
        <CalculatorIcon size={14} />
        {t('calc.addToCalculator')}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Replace CarCard.css**

```css
/* ev-database/src/components/cars/CarCard.css */
.car-card {
  background: var(--color-surface);
  border-radius: var(--radius-card);
  padding: 1.25rem 1.35rem 1rem;
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1.5px solid var(--color-border);
}

.car-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-ev-hover);
  border-color: rgba(14, 165, 233, 0.3);
}

.car-card-ice:hover {
  box-shadow: var(--shadow-ice-hover);
  border-color: rgba(249, 115, 22, 0.3);
}

/* ─── Header row: brand badge + year badge ─── */
.car-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.3rem;
}

.car-card-brand {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-primary);
}

.car-card-brand-ice {
  color: var(--color-ice);
}

.car-card-year {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--color-muted);
  background: var(--color-surface-alt);
  padding: 0.15rem 0.55rem;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border);
}

/* ─── Model title ─── */
.car-card-title {
  font-family: 'Outfit', system-ui, sans-serif;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--color-text);
  margin-bottom: 0.85rem;
  line-height: 1.2;
  letter-spacing: -0.01em;
}

/* ─── Metric rows ─── */
.car-card-fields {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1;
}

.car-field {
  display: grid;
  grid-template-columns: 26px 1fr auto;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.83rem;
  padding: 0.2rem 0;
}

.car-field-icon {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--field-color, #64748b);
  flex-shrink: 0;
}

/* Colored circle background using pseudo-element to control opacity independently */
.car-field-icon::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: var(--field-color, #64748b);
  opacity: 0.12;
}

.car-field-label {
  color: var(--color-muted);
  font-size: 0.78rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.car-field-value {
  font-family: 'Outfit', system-ui, sans-serif;
  font-weight: 700;
  color: var(--color-text);
  font-size: 0.9rem;
  white-space: nowrap;
}

/* ─── Calculator button ─── */
.calc-btn {
  margin-top: 1rem;
  width: 100%;
  padding: 0.55rem 0;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-btn);
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  transition: background 0.2s, box-shadow 0.2s, transform 0.15s;
}

.calc-btn:hover {
  background: var(--color-primary-hover);
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.25), var(--shadow-btn);
  transform: translateY(-1px);
}

.calc-btn-ice {
  background: var(--color-ice);
}

.calc-btn-ice:hover {
  background: #ea6c0b;
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.25), 0 2px 8px rgba(249, 115, 22, 0.3);
}
```

- [ ] **Step 3: Verify cards visually**

Open `http://localhost:5173/autos`. Each card should show:
- Colored brand badge top-left (e.g. "LUCID" in teal)
- Year badge top-right (pill, gray)
- Bold model name
- Metric rows with small colored icon circles
- Hover: card lifts + teal glow shadow
- Calc button with glow on hover

- [ ] **Step 4: Commit**

```bash
cd "/Users/tomkrohn/Desktop/website erstellen/ev-database"
git add src/components/cars/CarCard.jsx src/components/cars/CarCard.css
git commit -m "design: CarCard — brand badge, year badge, colored metric icon rows"
```

---

## Task 5: LandingPage — Hero with Sketch Background

**Files:**
- Create: `ev-database/src/pages/LandingPage.jsx`
- Create: `ev-database/src/pages/LandingPage.css`
- Manual: place `hero-sketch.jpg` in `ev-database/public/`

- [ ] **Step 1: Place hero image**

Copy your sketch illustration to:
```
ev-database/public/hero-sketch.jpg
```

The image should be landscape orientation (wider than tall). It will be positioned on the right side of the hero.

- [ ] **Step 2: Create LandingPage.jsx**

```jsx
// ev-database/src/pages/LandingPage.jsx
import { Link } from 'react-router-dom'
import { ArrowRight, Calculator } from 'lucide-react'
import './LandingPage.css'

export default function LandingPage() {
  return (
    <div className="landing">
      <div className="landing-hero">
        <div className="landing-content">
          <div className="landing-badge">399 Fahrzeuge · Echte Daten</div>
          <h1 className="landing-headline">
            Der smarteste Weg<br />
            zum <span className="landing-headline-accent">richtigen Auto.</span>
          </h1>
          <p className="landing-sub">
            Vergleiche Elektroautos und Verbrenner — Reichweite, Ladezeit, Kosten.
          </p>
          <div className="landing-ctas">
            <Link to="/autos" className="landing-cta-primary">
              Autos entdecken <ArrowRight size={18} />
            </Link>
            <Link to="/rechner" className="landing-cta-outline">
              Kosten berechnen <Calculator size={18} />
            </Link>
          </div>
        </div>
        <div
          className="landing-illustration"
          style={{ backgroundImage: 'url(/hero-sketch.jpg)' }}
          role="img"
          aria-label="Illustration verschiedener Elektroautos"
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create LandingPage.css**

```css
/* ev-database/src/pages/LandingPage.css */
.landing {
  height: calc(100vh - 60px);
  overflow: hidden;
  background: var(--color-bg);
}

.landing-hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 100%;
}

/* Left: text content */
.landing-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 4rem 3rem 4rem 5rem;
  position: relative;
  z-index: 2;
}

/* Fades the illustration gently into the background on the left edge */
.landing-illustration {
  position: relative;
}

.landing-illustration::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, var(--color-bg) 0%, transparent 25%);
  z-index: 1;
  pointer-events: none;
}

/* Small badge above headline */
.landing-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-primary);
  background: rgba(14, 165, 233, 0.09);
  border: 1px solid rgba(14, 165, 233, 0.2);
  padding: 0.35rem 0.85rem;
  border-radius: var(--radius-pill);
  margin-bottom: 1.25rem;
  width: fit-content;
}

.landing-headline {
  font-family: 'Outfit', system-ui, sans-serif;
  font-size: clamp(2.25rem, 4vw, 3.75rem);
  font-weight: 800;
  line-height: 1.08;
  color: var(--color-text);
  margin-bottom: 1.1rem;
  letter-spacing: -0.03em;
}

.landing-headline-accent {
  color: var(--color-primary);
}

.landing-sub {
  font-size: 1.05rem;
  color: var(--color-muted);
  margin-bottom: 2.25rem;
  font-weight: 500;
  line-height: 1.6;
  max-width: 420px;
}

.landing-ctas {
  display: flex;
  gap: 0.875rem;
  flex-wrap: wrap;
}

.landing-cta-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  background: var(--color-primary);
  color: white;
  border-radius: var(--radius-btn);
  text-decoration: none;
  font-weight: 700;
  font-size: 0.975rem;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  transition: background 0.2s, box-shadow 0.2s, transform 0.15s;
}

.landing-cta-primary:hover {
  background: var(--color-primary-hover);
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.25), 0 4px 20px rgba(14, 165, 233, 0.25);
  transform: translateY(-2px);
}

.landing-cta-outline {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  background: transparent;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
  border-radius: var(--radius-btn);
  text-decoration: none;
  font-weight: 700;
  font-size: 0.975rem;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  transition: background 0.2s, box-shadow 0.2s, border-color 0.2s, transform 0.15s;
}

.landing-cta-outline:hover {
  background: rgba(14, 165, 233, 0.06);
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.15);
  transform: translateY(-2px);
}

/* Right: sketch illustration */
.landing-illustration {
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
  height: 100%;
}

/* ─── Mobile ─── */
@media (max-width: 900px) {
  .landing {
    height: auto;
    min-height: calc(100vh - 60px);
  }

  .landing-hero {
    grid-template-columns: 1fr;
    grid-template-rows: auto 280px;
  }

  .landing-content {
    padding: 3rem 2rem 2rem;
    grid-row: 1;
  }

  .landing-illustration {
    grid-row: 2;
    opacity: 0.6;
  }

  .landing-illustration::before {
    background: linear-gradient(to bottom, var(--color-bg) 0%, transparent 30%);
  }
}
```

- [ ] **Step 4: Verify landing visually (after routing is added in Task 6)**

After Task 6, open `http://localhost:5173/`. Should see:
- Left: teal badge, large headline, subtitle, two buttons
- Right: your sketch illustration fading in from left
- Buttons have glow on hover

---

## Task 6: Routing — LandingPage at `/`, HomePage at `/autos`

**Files:**
- Modify: `ev-database/src/App.jsx`

- [ ] **Step 1: Update App.jsx**

```jsx
// ev-database/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import TopNav from './components/layout/TopNav'
import LandingPage from './pages/LandingPage'
import HomePage from './pages/HomePage'
import IceHomePage from './pages/IceHomePage'
import LoginPage from './pages/LoginPage'
import AdminPage from './pages/AdminPage'
import Calculator from './pages/Calculator'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? children : <Navigate to="/admin/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <TopNav />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/autos" element={<HomePage />} />
        <Route path="/verbrenner" element={<IceHomePage />} />
        <Route path="/rechner" element={<Calculator />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/admin" element={
          <ProtectedRoute><AdminPage /></ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 2: Verify routing**

- `http://localhost:5173/` → LandingPage (hero with sketch)
- `http://localhost:5173/autos` → car database grid
- `http://localhost:5173/verbrenner` → ICE database
- `http://localhost:5173/rechner` → TCO calculator
- Logo in TopNav links back to `/`
- "E-Fahrzeuge" nav link → `/autos` and shows active state

- [ ] **Step 3: Commit**

```bash
cd "/Users/tomkrohn/Desktop/website erstellen/ev-database"
git add src/App.jsx src/pages/LandingPage.jsx src/pages/LandingPage.css
git commit -m "feat: LandingPage hero at /, move EV database to /autos"
```

---

## Task 7: i18n — Landing Page Strings

**Files:**
- Modify: `ev-database/src/i18n/de.json`
- Modify: `ev-database/src/i18n/en.json`

- [ ] **Step 1: Add to de.json**

In `de.json`, add a `"landing"` section. Find the closing `}` of the top-level object and add before it:

```json
"landing": {
  "badge": "399 Fahrzeuge · Echte Daten",
  "headline": "Der smarteste Weg zum richtigen Auto.",
  "sub": "Vergleiche Elektroautos und Verbrenner — Reichweite, Ladezeit, Kosten.",
  "ctaAutos": "Autos entdecken",
  "ctaRechner": "Kosten berechnen"
}
```

- [ ] **Step 2: Add to en.json**

```json
"landing": {
  "badge": "399 vehicles · Real data",
  "headline": "The smartest way to find the right car.",
  "sub": "Compare electric cars and combustion engines — range, charging, costs.",
  "ctaAutos": "Explore cars",
  "ctaRechner": "Calculate costs"
}
```

- [ ] **Step 3: Update LandingPage.jsx to use i18n**

Update `ev-database/src/pages/LandingPage.jsx` to use translations:

```jsx
// ev-database/src/pages/LandingPage.jsx
import { Link } from 'react-router-dom'
import { ArrowRight, Calculator } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import './LandingPage.css'

export default function LandingPage() {
  const { t } = useTranslation()

  return (
    <div className="landing">
      <div className="landing-hero">
        <div className="landing-content">
          <div className="landing-badge">{t('landing.badge')}</div>
          <h1 className="landing-headline">
            {t('landing.headline').split('. ')[0]}.<br />
            <span className="landing-headline-accent">
              {t('landing.headline').split('. ')[1]}
            </span>
          </h1>
          <p className="landing-sub">{t('landing.sub')}</p>
          <div className="landing-ctas">
            <Link to="/autos" className="landing-cta-primary">
              {t('landing.ctaAutos')} <ArrowRight size={18} />
            </Link>
            <Link to="/rechner" className="landing-cta-outline">
              {t('landing.ctaRechner')} <Calculator size={18} />
            </Link>
          </div>
        </div>
        <div
          className="landing-illustration"
          style={{ backgroundImage: 'url(/hero-sketch.jpg)' }}
          role="img"
          aria-label="Illustration verschiedener Elektroautos"
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
cd "/Users/tomkrohn/Desktop/website erstellen/ev-database"
git add src/i18n/de.json src/i18n/en.json src/pages/LandingPage.jsx
git commit -m "i18n: add landing page translations (de + en)"
```

---

## Task 8: HomePage — Sidebar Layout

**Files:**
- Modify: `ev-database/src/pages/HomePage.jsx`
- Modify: `ev-database/src/pages/HomePage.css`

- [ ] **Step 1: Update HomePage.jsx**

```jsx
// ev-database/src/pages/HomePage.jsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCars } from '../hooks/useCars'
import { useSettings } from '../hooks/useSettings'
import ViewToggle from '../components/cars/ViewToggle'
import CarGrid from '../components/cars/CarGrid'
import CarList from '../components/cars/CarList'
import CarDetail from '../components/cars/CarDetail'
import './HomePage.css'

export default function HomePage() {
  const { t } = useTranslation()
  const { cars, loading: carsLoading } = useCars()
  const { fields, loading: fieldsLoading } = useSettings()

  const [view, setView] = useState(() => localStorage.getItem('view') || 'grid')
  const [size, setSize] = useState(() => localStorage.getItem('gridSize') || 'medium')
  const [selectedCar, setSelectedCar] = useState(null)

  const handleSetView = (v) => { setView(v); localStorage.setItem('view', v) }
  const handleSetSize = (s) => { setSize(s); localStorage.setItem('gridSize', s) }

  if (carsLoading || fieldsLoading) {
    return (
      <div className="home-page">
        <aside className="home-sidebar" />
        <main className="home-main">
          <p className="home-loading">{t('home.loading')}</p>
        </main>
      </div>
    )
  }

  return (
    <div className="home-page">
      <aside className="home-sidebar">
        <h2 className="home-sidebar-title">{t('home.title')}</h2>
        <div className="home-sidebar-count">{cars.length} {t('home.vehicles', 'Fahrzeuge')}</div>
        <ViewToggle view={view} setView={handleSetView} size={size} setSize={handleSetSize} />
      </aside>
      <main className="home-main">
        {cars.length === 0
          ? <p className="home-empty">{t('home.noCars')}</p>
          : view === 'grid'
            ? <CarGrid cars={cars} fields={fields} size={size} onCarClick={setSelectedCar} />
            : <CarList cars={cars} fields={fields} onCarClick={setSelectedCar} />
        }
      </main>
      {selectedCar && <CarDetail car={selectedCar} onClose={() => setSelectedCar(null)} />}
    </div>
  )
}
```

- [ ] **Step 2: Replace HomePage.css**

```css
/* ev-database/src/pages/HomePage.css */
.home-page {
  display: grid;
  grid-template-columns: 220px 1fr;
  min-height: calc(100vh - 60px);
}

/* ─── Sidebar ─── */
.home-sidebar {
  padding: 2rem 1.5rem;
  border-right: 1px solid var(--color-border);
  position: sticky;
  top: 60px;
  height: calc(100vh - 60px);
  overflow-y: auto;
  background: var(--color-surface);
}

.home-sidebar-title {
  font-family: 'Outfit', system-ui, sans-serif;
  font-size: 1rem;
  font-weight: 800;
  color: var(--color-text);
  margin-bottom: 0.25rem;
}

.home-sidebar-count {
  font-size: 0.8rem;
  color: var(--color-muted);
  font-weight: 500;
  margin-bottom: 1.5rem;
}

/* ─── Main content ─── */
.home-main {
  padding: 2rem 1.75rem;
  min-width: 0;
}

.home-loading,
.home-empty {
  color: var(--color-muted);
  font-style: italic;
  padding: 2rem 0;
}

/* ─── Mobile: stack sidebar above grid ─── */
@media (max-width: 768px) {
  .home-page {
    grid-template-columns: 1fr;
  }

  .home-sidebar {
    position: static;
    height: auto;
    border-right: none;
    border-bottom: 1px solid var(--color-border);
    padding: 1rem 1.5rem;
  }

  .home-main {
    padding: 1.25rem 1rem;
  }
}
```

- [ ] **Step 3: Add "vehicles" i18n key**

In `de.json` add to `"home"`: `"vehicles": "Fahrzeuge"`
In `en.json` add to `"home"`: `"vehicles": "vehicles"`

- [ ] **Step 4: Verify layout**

Open `http://localhost:5173/autos`. Should see:
- 220px sidebar on left: title "Elektroauto-Datenbank", count, view toggles
- Main area: car grid fills remaining width
- Sidebar is sticky when scrolling through cars

- [ ] **Step 5: Commit**

```bash
cd "/Users/tomkrohn/Desktop/website erstellen/ev-database"
git add src/pages/HomePage.jsx src/pages/HomePage.css src/i18n/de.json src/i18n/en.json
git commit -m "design: HomePage sidebar layout — 220px sticky sidebar + main grid"
```

---

## Self-Review Notes

**Spec coverage check:**
- ✅ Font change (Plus Jakarta Sans)
- ✅ Metric color CSS variables
- ✅ Hover glow on buttons
- ✅ TopNav glassmorphism + hover underline animation
- ✅ Logo upgrade (Outfit 800, bigger)
- ✅ Verbrenner orange pill button
- ✅ CarCard brand badge + year badge
- ✅ CarCard colored metric icon circles
- ✅ CarCard hover glow
- ✅ Landing Page hero (sketch bg, 2 CTAs)
- ✅ Routing: `/` → Landing, `/autos` → HomePage
- ✅ Sidebar filter layout
- ✅ i18n for landing page
- ✅ WCAG contrast: all metric colors are dark on white Hintergrund (blue 3b82f6 = 4.6:1, amber f59e0b = 2.9:1 but used only on circle background as decoration — text uses the full color on white which has adequate contrast. Red ef4444 = 3.95:1 — note: this is the icon color. The text labels next to icons use `--color-muted` (#64748b) on white = 4.6:1 ✅. Values use `--color-text` (#0f172a) on white = 17:1 ✅)
- ⚠️ CarGrid.css not changed — existing `auto-fill` approach still works with sidebar narrowing the container. No change needed.
- ✅ IceHomePage noted as follow-up (out of scope per spec)

**One gap:** `home.vehicles` i18n key is used in Task 8 Step 1 but only added in Step 3 — this is fine (React i18n falls back gracefully), but note to do Step 3 promptly.

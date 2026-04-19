# Design-Spec: Global Redesign "Electric Clean"

**Datum:** 2026-04-19  
**Status:** Approved — bereit für Implementierung  
**Scope:** Alle Seiten und Komponenten der EV-Vergleichs-Website  
**Constraint:** Keine funktionalen Änderungen — ausschließlich Design/CSS/Typografie

---

## 1. Ziel

Vollständiges visuelles Redesign der Website. Die neue Ästhetik ist hell, modern und kontrastreich mit runden Ecken und bunten, kategorisierten Icons. Keine Funktionalität wird verändert.

---

## 2. Design-System (Tokens)

### Farben

```css
--color-bg:        #f8fafc;   /* Seiten-Hintergrund */
--color-surface:   #ffffff;   /* Cards, Nav, Panels */
--color-primary:   #0ea5e9;   /* Cyan — Hauptakzent */
--color-primary-hover: #0284c7;
--color-ev:        #0ea5e9;   /* EV-Slots, EV-Badges */
--color-ice:       #f97316;   /* ICE-Slots, ICE-Badges */
--color-positive:  #22c55e;   /* Ersparnisse, positive Werte */
--color-danger:    #ef4444;
--color-text:      #0f172a;   /* Primärtext, near-black */
--color-muted:     #64748b;   /* Labels, Sekundärtext */
--color-border:    #e2e8f0;
--color-expert:    #8b5cf6;   /* Expert-Params, Violet */
```

### Typografie

```
Headline: Outfit 700/800  (Google Fonts)
Body:     DM Sans 400/500/600  (Google Fonts)
```

Import in `index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
```

CSS:
```css
body { font-family: 'DM Sans', sans-serif; }
h1, h2, h3 { font-family: 'Outfit', sans-serif; }
```

### Border-Radien

```
Cards/Panels:   20px
Buttons:        12px
Inputs/Select:  10px
Badges (Pills): 999px
Small buttons:  8px
```

### Schatten

```css
--shadow-card:     0 2px 12px rgba(0,0,0,0.06);
--shadow-ev-hover: 0 8px 32px rgba(14,165,233,0.18);
--shadow-ice-hover:0 8px 32px rgba(249,115,22,0.18);
--shadow-btn:      0 2px 8px rgba(14,165,233,0.30);
```

### Icon-Farbsystem (Lucide React)

| Kategorie          | Icon-Farbe       |
|--------------------|------------------|
| Energie / Laden    | `#0ea5e9` Cyan   |
| THG / Umwelt       | `#22c55e` Grün   |
| Kraftstoff / ICE   | `#f97316` Orange |
| Kosten / Preis     | `#64748b` Slate  |
| Expert-Parameter   | `#8b5cf6` Violet |

---

## 3. Komponenten-Spec

### TopNav (`TopNav.css` + `TopNav.jsx`)

- Hintergrund: `#ffffff` + `border-bottom: 1px solid #e2e8f0`
- Shadow: `0 1px 8px rgba(0,0,0,0.06)`
- Brand: Outfit 700, `#0f172a` + ⚡-Icon (Lucide `Zap`) in `#0ea5e9` links
- Nav-Links: DM Sans, `#64748b` → hover `#0f172a` + cyan Underline
- Active Link: `#0ea5e9`, font-weight 600
- Login-Button: `btn-primary` Stil

### Buttons (global, `index.css`)

```css
.btn-primary {
  background: #0ea5e9;
  color: white;
  border-radius: 12px;
}
.btn-primary:hover {
  background: #0284c7;
  box-shadow: 0 2px 8px rgba(14,165,233,0.30);
}
.btn-secondary {
  background: #f1f5f9;
  color: #0f172a;
  border-radius: 12px;
}
.btn-danger { border-radius: 12px; }
.btn-small  { border-radius: 8px; }
```

### CarCard (`CarCard.css`)

- `border-radius: 20px`, white surface
- Hover: `translateY(-4px)` + `--shadow-ev-hover`
- Titel: Outfit 700, `#0f172a`
- Feld-Labels: DM Sans, `#64748b`, Icon farbig links
- Feld-Werte: DM Sans 600, `#0f172a`
- `calc-btn` → `btn-primary` Stil, `border-radius: 12px`

### CarGrid & CarList (`CarGrid.css`, `CarList.css`)

- Kein Strukturänderungen, nur Token-Anpassung (Farben, Radien)

### HomePage (`HomePage.css`)

- Hintergrund: `--color-bg`
- H1: Outfit 800
- Loading/Empty States: mit Icon + `#64748b`

### Calculator Page (`Calculator.css`)

- Hintergrund: `--color-bg`
- H1: Outfit 700

**Comparison-Mode-Toggle:**
```
Container:      bg #f1f5f9, border-radius: 12px, padding: 4px
Inactive btn:   transparent, color #64748b
Active btn:     white, color #0f172a, font-weight 600,
                box-shadow: 0 1px 4px rgba(0,0,0,0.10)
→ Pill-Switcher-Stil
```

**Calc-Placeholder:**
```
border: 2px dashed #bae6fd
border-radius: 20px
Icon: Lucide Zap, groß, #0ea5e9
Text: #64748b
```

### VehicleSlot (`VehicleSlot.css`)

**EV-Slot:**
- `border-radius: 20px`
- `border-top: 3px solid #0ea5e9`
- Badge: cyan pill, ⚡ (Lucide `Zap`) Icon
- Hover: `--shadow-ev-hover`

**ICE-Slot:**
- `border-radius: 20px`
- `border-top: 3px solid #f97316`
- Badge: orange pill, ⛽ (Lucide `Fuel`) Icon
- Hover: `--shadow-ice-hover`

**Inputs:**
```css
border: 1.5px solid #e2e8f0;
border-radius: 10px;
/* focus: */
border-color: #0ea5e9;
box-shadow: 0 0 0 3px rgba(14,165,233,0.15);
```

**Select:**
- Gleiche Styles wie Inputs

**AC/DC-Slider:**
```css
accent-color: #0ea5e9;
```
- AC-Label: ⚡-Icon + cyan
- DC-Label: 🔋 (Lucide `BatteryCharging`) + violet `#8b5cf6`

**Expert-Mode-Toggle:**
- Label: 🔧 (Lucide `Settings2`) in `#8b5cf6`
- Custom Toggle-Switch: thumb cyan wenn aktiv
- Expert-Divider: `#8b5cf6` statt grau

**Source-Toggle (DB/Manuell):**
- Pill-Switcher-Stil (wie Comp-Mode-Toggle)

### ResultsPanel (`ResultsPanel.css`)

- Tab-Bar: Pill-Switcher-Stil
- Positive Werte: `#22c55e` + 🌿 (Lucide `Leaf`) Icon
- Negative Werte: `#ef4444`
- Tabellen: Zebra-Striping mit `#f8fafc`
- Charts: EV → `#0ea5e9`, ICE → `#f97316`, Break-even → `#22c55e` gestrichelt

### IceForm (`IceForm.css`)

- Inputs/Select: gleiche Styles wie VehicleSlot
- Labels mit `#f97316` Fuel-Icon

### Admin-Panel, CarForm, CarImport, FieldToggle, UserModeToggle

- Folgen dem gleichen Token-System
- `UserModeToggle`: Pill-Switcher-Stil (gleich wie Comp-Mode-Toggle)
- Keine strukturellen Änderungen

### LoginPage (`LoginPage.css`)

- Weißes Card-Panel, `border-radius: 20px`, zentriert
- Button: `btn-primary`
- Inputs: gleiche Styles

### ViewToggle (`ViewToggle.css`)

- Pill-Switcher-Stil (Grid/List)

---

## 4. Implementierungsreihenfolge

1. `index.html` — Google Fonts einbinden
2. `index.css` — CSS-Variablen (Tokens) + globale Stile (body font, btn-*)
3. `TopNav.css` + `TopNav.jsx` (⚡-Icon)
4. `CarCard.css` + `CarCard.jsx` (Lucide Icons)
5. `Calculator.css` + Toggles
6. `VehicleSlot.css` + `VehicleSlot.jsx` (Badges mit Icons)
7. `ResultsPanel.css`
8. `IceForm.css`
9. `HomePage.css`, `CarGrid.css`, `CarList.css`, `ViewToggle.css`
10. `LoginPage.css`
11. Admin-Seiten (`AdminPanel.css`, `CarForm.css`, `CarImport.css`, `FieldToggle.css`, `AdminPage.css`)

---

## 5. Abhängigkeiten

- **Lucide React** muss installiert sein: `npm install lucide-react`
- Keine weiteren neuen Dependencies
- Funktionale JSX-Logik bleibt unverändert; Icons werden nur visuell hinzugefügt

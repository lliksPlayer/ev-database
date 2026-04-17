# EV-Datenbank Phase 1+2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React + Firebase web app with an EV database, card/list view, and a protected admin panel for CRUD and field configuration.

**Architecture:** Vite SPA with React Router for routing, Firebase Firestore for real-time data, Firebase Auth for admin protection. Components are split by responsibility: layout, cars (user-facing), admin. No test framework — verify each task by running `npm run dev` and checking in browser.

**Tech Stack:** React 18, Vite, Firebase 10, react-router-dom 6, react-i18next, @dnd-kit/core + @dnd-kit/sortable, xlsx (SheetJS)

---

## File Map

| File | Responsibility |
|------|---------------|
| `src/firebase/config.js` | Firebase init, exports `db`, `auth` |
| `src/firebase/auth.js` | signIn, signOut |
| `src/firebase/cars.js` | CRUD for `ev_cars` collection |
| `src/firebase/settings.js` | Read/write `settings/card_fields` |
| `src/hooks/useAuth.js` | Auth state observer |
| `src/hooks/useCars.js` | Real-time `ev_cars` listener |
| `src/hooks/useSettings.js` | Real-time `settings/card_fields` listener |
| `src/utils/calculations.js` | `calcKwhNach70`, `calcKwhProMin` |
| `src/i18n/index.js` | i18next setup |
| `src/i18n/de.json` | German UI strings |
| `src/i18n/en.json` | English UI strings |
| `src/components/layout/TopNav.jsx` | Top navigation bar |
| `src/components/layout/LanguageSwitch.jsx` | DE/EN toggle |
| `src/components/cars/CarCard.jsx` | Single vehicle card |
| `src/components/cars/CarGrid.jsx` | Grid view with size selector |
| `src/components/cars/CarList.jsx` | List view |
| `src/components/cars/CarDetail.jsx` | Detail modal (stub) |
| `src/components/cars/ViewToggle.jsx` | Grid/list + size toggle |
| `src/components/admin/CarForm.jsx` | Add/edit vehicle form |
| `src/components/admin/CarImport.jsx` | Excel/CSV import + column mapping |
| `src/components/admin/FieldToggle.jsx` | Card field visibility + drag & drop order |
| `src/components/admin/AdminPanel.jsx` | Admin tab container |
| `src/pages/HomePage.jsx` | Public EV database page |
| `src/pages/LoginPage.jsx` | Admin login page |
| `src/pages/AdminPage.jsx` | Protected admin page |
| `src/App.jsx` | Router + ProtectedRoute |
| `src/main.jsx` | Entry point |
| `.env` | Firebase credentials (not in git) |
| `vercel.json` | SPA routing fix for Vercel |

---

### Task 1: Project Scaffold

**Files:**
- Create: `ev-database/` (new project in working directory)

- [ ] **Step 1: Scaffold Vite + React project**

```bash
cd "/Users/tomkrohn/Library/Mobile Documents/com~apple~CloudDocs/website erstellen"
npm create vite@latest ev-database -- --template react
cd ev-database
```

- [ ] **Step 2: Install all dependencies**

```bash
npm install firebase react-router-dom react-i18next i18next xlsx @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

- [ ] **Step 3: Remove Vite boilerplate**

Delete: `src/assets/react.svg`, `public/vite.svg`, `src/App.css`

Replace `src/App.jsx` with:

```jsx
export default function App() {
  return <div>EV Database</div>
}
```

Replace `src/index.css` with:

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, -apple-system, sans-serif; background: #f5f5f5; color: #1a1a1a; }

/* Global button styles — used across CarForm, AdminPanel, CarImport, FieldToggle */
.btn { padding: 0.6rem 1.2rem; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; font-size: 0.9rem; }
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-primary { background: #1a1a2e; color: white; }
.btn-secondary { background: #f0f0f0; color: #333; }
.btn-danger { background: #e74c3c; color: white; }
.btn-small { padding: 4px 10px; font-size: 0.8rem; }
```

- [ ] **Step 4: Create `.gitignore`**

```
node_modules
dist
.env
.env.local
```

- [ ] **Step 5: Verify dev server starts**

```bash
npm run dev
```

Expected: browser shows "EV Database" at `http://localhost:5173`

- [ ] **Step 6: Commit**

```bash
cd "/Users/tomkrohn/Library/Mobile Documents/com~apple~CloudDocs/website erstellen"
git add ev-database
git commit -m "feat: scaffold Vite + React project"
```

---

### Task 2: Firebase Setup

**Files:**
- Create: `ev-database/src/firebase/config.js`
- Create: `ev-database/src/firebase/auth.js`
- Create: `ev-database/src/firebase/cars.js`
- Create: `ev-database/src/firebase/settings.js`
- Create: `ev-database/.env`

**Before this task:** Go to [console.firebase.google.com](https://console.firebase.google.com), create a new project, enable Firestore and Authentication (Email/Password), and copy the config values.

- [ ] **Step 1: Create `.env` with Firebase credentials**

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

- [ ] **Step 2: Create `src/firebase/config.js`**

```js
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
```

- [ ] **Step 3: Create `src/firebase/auth.js`**

```js
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from './config'

export const login = (email, password) =>
  signInWithEmailAndPassword(auth, email, password)

export const logout = () => signOut(auth)
```

- [ ] **Step 4: Create `src/firebase/cars.js`**

```js
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, writeBatch
} from 'firebase/firestore'
import { db } from './config'

const carsRef = () => collection(db, 'ev_cars')

export const subscribeToCars = (callback) =>
  onSnapshot(query(carsRef(), orderBy('marke')), (snap) =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  )

export const addCar = (data) => addDoc(carsRef(), data)

export const updateCar = (id, data) => updateDoc(doc(db, 'ev_cars', id), data)

export const deleteCar = (id) => deleteDoc(doc(db, 'ev_cars', id))

export const importCars = async (cars) => {
  const batch = writeBatch(db)
  cars.forEach(car => batch.set(doc(carsRef()), car))
  return batch.commit()
}
```

- [ ] **Step 5: Create `src/firebase/settings.js`**

```js
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from './config'

const settingsDoc = () => doc(db, 'settings', 'card_fields')

export const subscribeToSettings = (callback) =>
  onSnapshot(settingsDoc(), (snap) =>
    callback(snap.exists() ? snap.data().fields : [])
  )

export const saveSettings = (fields) =>
  setDoc(settingsDoc(), { fields })
```

- [ ] **Step 6: Initialize `settings/card_fields` in Firestore**

Open Firebase Console → Firestore → Start collection `settings` → Document ID: `card_fields` → Add field `fields` (array) with this value (paste as JSON via the console's array editor, or use the script below):

Run once to seed the settings (add temporarily to `src/main.jsx`, run once, then remove):

```js
import { setDoc, doc } from 'firebase/firestore'
import { db } from './firebase/config'

await setDoc(doc(db, 'settings', 'card_fields'), {
  fields: [
    { key: 'marke', label_de: 'Marke', label_en: 'Brand', visible: true, order: 0 },
    { key: 'modell', label_de: 'Modell', label_en: 'Model', visible: true, order: 1 },
    { key: 'batterie_netto', label_de: 'Batterie Netto (kWh)', label_en: 'Battery Net (kWh)', visible: true, order: 2 },
    { key: 'laden_10_80_min', label_de: '10%–80% (min)', label_en: '10%–80% (min)', visible: true, order: 3 },
    { key: 'kwh_nach_70', label_de: 'kWh nach 70%', label_en: 'kWh after 70%', visible: true, order: 4 },
    { key: 'kwh_pro_min', label_de: 'kWh/min', label_en: 'kWh/min', visible: true, order: 5 },
    { key: 'max_ladeleistung', label_de: 'Max. Ladeleistung (kW)', label_en: 'Max. Charge Power (kW)', visible: true, order: 6 },
    { key: 'anhaengelast', label_de: 'Anhängelast (kg)', label_en: 'Towing Capacity (kg)', visible: false, order: 7 },
    { key: 'wltp_reichweite', label_de: 'WLTP Reichweite (km)', label_en: 'WLTP Range (km)', visible: true, order: 8 },
    { key: 'wltp_verbrauch', label_de: 'WLTP Verbrauch (kWh/100km)', label_en: 'WLTP Consumption (kWh/100km)', visible: false, order: 9 },
    { key: 'basis_preis', label_de: 'Basispreis (€)', label_en: 'Base Price (€)', visible: true, order: 10 },
    { key: 'hoechster_preis', label_de: 'Höchster Preis (€)', label_en: 'Max Price (€)', visible: false, order: 11 },
    { key: 'null_hundert', label_de: '0–100 (s)', label_en: '0–100 (s)', visible: true, order: 12 },
    { key: 'ps', label_de: 'PS', label_en: 'HP', visible: false, order: 13 },
    { key: 'top_speed', label_de: 'Top Speed (km/h)', label_en: 'Top Speed (km/h)', visible: false, order: 14 },
    { key: 'volt', label_de: 'Volt', label_en: 'Volt', visible: false, order: 15 },
    { key: 'markteinfuehrung', label_de: 'Markteinführung', label_en: 'Market Launch', visible: false, order: 16 },
  ]
})
```

- [ ] **Step 7: Commit**

```bash
git add ev-database/src/firebase ev-database/.env
git commit -m "feat: Firebase config, auth, cars CRUD, settings"
```

---

### Task 3: Hooks + Calculations

**Files:**
- Create: `ev-database/src/hooks/useAuth.js`
- Create: `ev-database/src/hooks/useCars.js`
- Create: `ev-database/src/hooks/useSettings.js`
- Create: `ev-database/src/utils/calculations.js`

- [ ] **Step 1: Create `src/hooks/useAuth.js`**

```js
import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase/config'

export function useAuth() {
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser)
    return unsub
  }, [])

  return { user, loading: user === undefined }
}
```

- [ ] **Step 2: Create `src/hooks/useCars.js`**

```js
import { useState, useEffect } from 'react'
import { subscribeToCars } from '../firebase/cars'

export function useCars() {
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = subscribeToCars((data) => {
      setCars(data)
      setLoading(false)
    })
    return unsub
  }, [])

  return { cars, loading }
}
```

- [ ] **Step 3: Create `src/hooks/useSettings.js`**

```js
import { useState, useEffect } from 'react'
import { subscribeToSettings } from '../firebase/settings'

export function useSettings() {
  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = subscribeToSettings((data) => {
      setFields(data)
      setLoading(false)
    })
    return unsub
  }, [])

  return { fields, loading }
}
```

- [ ] **Step 4: Create `src/utils/calculations.js`**

```js
export const calcKwhNach70 = (batterie_netto) =>
  batterie_netto > 0 ? parseFloat((batterie_netto * 0.7).toFixed(2)) : 0

export const calcKwhProMin = (batterie_netto, laden_10_80_min) =>
  batterie_netto > 0 && laden_10_80_min > 0
    ? parseFloat(((batterie_netto * 0.7) / laden_10_80_min).toFixed(3))
    : 0

export const applyCalculations = (data) => ({
  ...data,
  kwh_nach_70: calcKwhNach70(data.batterie_netto),
  kwh_pro_min: calcKwhProMin(data.batterie_netto, data.laden_10_80_min),
})
```

- [ ] **Step 5: Commit**

```bash
git add ev-database/src/hooks ev-database/src/utils
git commit -m "feat: useAuth, useCars, useSettings hooks + calculations"
```

---

### Task 4: i18n Setup

**Files:**
- Create: `ev-database/src/i18n/index.js`
- Create: `ev-database/src/i18n/de.json`
- Create: `ev-database/src/i18n/en.json`

- [ ] **Step 1: Create `src/i18n/de.json`**

```json
{
  "nav": {
    "evDatabase": "EV-Datenbank",
    "admin": "Admin"
  },
  "home": {
    "title": "Elektroauto-Datenbank",
    "loading": "Lädt...",
    "noCars": "Keine Fahrzeuge gefunden."
  },
  "viewToggle": {
    "grid": "Raster",
    "list": "Liste",
    "small": "Klein",
    "medium": "Mittel",
    "large": "Groß"
  },
  "admin": {
    "title": "Admin-Bereich",
    "vehicles": "Fahrzeuge",
    "fields": "Kartenfelder",
    "addVehicle": "Fahrzeug hinzufügen",
    "importVehicles": "Importieren",
    "edit": "Bearbeiten",
    "delete": "Löschen",
    "deleteConfirm": "Fahrzeug wirklich löschen?",
    "save": "Speichern",
    "cancel": "Abbrechen",
    "saving": "Speichert...",
    "importFile": "Excel / CSV hochladen",
    "importMapping": "Spalten zuordnen",
    "importPreview": "Vorschau (erste 5 Zeilen)",
    "importConfirm": "Importieren",
    "fieldVisible": "Sichtbar",
    "fieldHidden": "Ausgeblendet"
  },
  "login": {
    "title": "Admin Login",
    "email": "E-Mail",
    "password": "Passwort",
    "submit": "Anmelden",
    "error": "Ungültige Anmeldedaten"
  },
  "detail": {
    "title": "Fahrzeugdetails",
    "close": "Schließen",
    "comingSoon": "Weitere Details folgen."
  }
}
```

- [ ] **Step 2: Create `src/i18n/en.json`**

```json
{
  "nav": {
    "evDatabase": "EV Database",
    "admin": "Admin"
  },
  "home": {
    "title": "Electric Car Database",
    "loading": "Loading...",
    "noCars": "No vehicles found."
  },
  "viewToggle": {
    "grid": "Grid",
    "list": "List",
    "small": "Small",
    "medium": "Medium",
    "large": "Large"
  },
  "admin": {
    "title": "Admin Panel",
    "vehicles": "Vehicles",
    "fields": "Card Fields",
    "addVehicle": "Add Vehicle",
    "importVehicles": "Import",
    "edit": "Edit",
    "delete": "Delete",
    "deleteConfirm": "Really delete this vehicle?",
    "save": "Save",
    "cancel": "Cancel",
    "saving": "Saving...",
    "importFile": "Upload Excel / CSV",
    "importMapping": "Map Columns",
    "importPreview": "Preview (first 5 rows)",
    "importConfirm": "Import",
    "fieldVisible": "Visible",
    "fieldHidden": "Hidden"
  },
  "login": {
    "title": "Admin Login",
    "email": "Email",
    "password": "Password",
    "submit": "Sign In",
    "error": "Invalid credentials"
  },
  "detail": {
    "title": "Vehicle Details",
    "close": "Close",
    "comingSoon": "More details coming soon."
  }
}
```

- [ ] **Step 3: Create `src/i18n/index.js`**

```js
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import de from './de.json'
import en from './en.json'

i18n.use(initReactI18next).init({
  resources: { de: { translation: de }, en: { translation: en } },
  lng: localStorage.getItem('lang') || 'de',
  fallbackLng: 'de',
  interpolation: { escapeValue: false },
})

export default i18n
```

- [ ] **Step 4: Import i18n in `src/main.jsx`**

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n/index.js'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

- [ ] **Step 5: Commit**

```bash
git add ev-database/src/i18n ev-database/src/main.jsx
git commit -m "feat: i18n setup DE/EN"
```

---

### Task 5: Routing + ProtectedRoute

**Files:**
- Modify: `ev-database/src/App.jsx`
- Create: `ev-database/vercel.json`

- [ ] **Step 1: Replace `src/App.jsx` with routing**

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import TopNav from './components/layout/TopNav'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import AdminPage from './pages/AdminPage'

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
        <Route path="/" element={<HomePage />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/admin" element={
          <ProtectedRoute><AdminPage /></ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 2: Create `vercel.json` (SPA routing fix)**

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

- [ ] **Step 3: Commit**

```bash
git add ev-database/src/App.jsx ev-database/vercel.json
git commit -m "feat: routing + ProtectedRoute"
```

---

### Task 6: TopNav + LanguageSwitch

**Files:**
- Create: `ev-database/src/components/layout/TopNav.jsx`
- Create: `ev-database/src/components/layout/LanguageSwitch.jsx`
- Create: `ev-database/src/components/layout/TopNav.css`

- [ ] **Step 1: Create `src/components/layout/TopNav.css`**

```css
.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  height: 56px;
  background: #1a1a2e;
  color: white;
  position: sticky;
  top: 0;
  z-index: 100;
}
.nav-brand { font-weight: 700; font-size: 1.1rem; text-decoration: none; color: white; }
.nav-links { display: flex; gap: 1.5rem; align-items: center; }
.nav-link { color: rgba(255,255,255,0.8); text-decoration: none; font-size: 0.95rem; }
.nav-link:hover, .nav-link.active { color: white; }
.nav-right { display: flex; align-items: center; gap: 1rem; }
```

- [ ] **Step 2: Create `src/components/layout/LanguageSwitch.jsx`**

```jsx
import { useTranslation } from 'react-i18next'

export default function LanguageSwitch() {
  const { i18n } = useTranslation()

  const toggle = () => {
    const next = i18n.language === 'de' ? 'en' : 'de'
    i18n.changeLanguage(next)
    localStorage.setItem('lang', next)
  }

  return (
    <button
      onClick={toggle}
      style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
               padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
    >
      {i18n.language === 'de' ? 'EN' : 'DE'}
    </button>
  )
}
```

- [ ] **Step 3: Create `src/components/layout/TopNav.jsx`**

```jsx
import { Link, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import LanguageSwitch from './LanguageSwitch'
import './TopNav.css'

export default function TopNav() {
  const { t } = useTranslation()
  const { user } = useAuth()

  return (
    <nav className="nav">
      <Link to="/" className="nav-brand">⚡ EV Database</Link>
      <div className="nav-links">
        <NavLink to="/" className="nav-link">{t('nav.evDatabase')}</NavLink>
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

- [ ] **Step 4: Verify in browser**

```bash
npm run dev
```

Expected: dark top navbar with "⚡ EV Database", "EV-Datenbank" link, DE/EN toggle button. Admin link only visible after login.

- [ ] **Step 5: Commit**

```bash
git add ev-database/src/components/layout
git commit -m "feat: TopNav + LanguageSwitch"
```

---

### Task 7: LoginPage

**Files:**
- Create: `ev-database/src/pages/LoginPage.jsx`
- Create: `ev-database/src/pages/LoginPage.css`

- [ ] **Step 1: Create `src/pages/LoginPage.css`**

```css
.login-page {
  min-height: calc(100vh - 56px);
  display: flex;
  align-items: center;
  justify-content: center;
}
.login-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 100%;
  max-width: 380px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}
.login-card h1 { margin-bottom: 1.5rem; font-size: 1.3rem; }
.form-group { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1rem; }
.form-group label { font-size: 0.85rem; font-weight: 600; color: #555; }
.form-group input {
  padding: 0.6rem 0.8rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
}
.btn-primary {
  width: 100%;
  padding: 0.7rem;
  background: #1a1a2e;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  font-weight: 600;
}
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.error-msg { color: #e74c3c; font-size: 0.85rem; margin-top: 0.5rem; }
```

- [ ] **Step 2: Create `src/pages/LoginPage.jsx`**

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { login } from '../firebase/auth'
import './LoginPage.css'

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      navigate('/admin')
    } catch {
      setError(t('login.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>{t('login.title')}</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('login.email')}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>{t('login.password')}</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '...' : t('login.submit')}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify in browser**

Navigate to `http://localhost:5173/admin` — should redirect to `/admin/login`. Enter wrong credentials → error message appears.

- [ ] **Step 4: Commit**

```bash
git add ev-database/src/pages/LoginPage.jsx ev-database/src/pages/LoginPage.css
git commit -m "feat: LoginPage with Firebase Auth"
```

---

### Task 8: CarCard + ViewToggle

**Files:**
- Create: `ev-database/src/components/cars/CarCard.jsx`
- Create: `ev-database/src/components/cars/CarCard.css`
- Create: `ev-database/src/components/cars/ViewToggle.jsx`
- Create: `ev-database/src/components/cars/ViewToggle.css`

- [ ] **Step 1: Create `src/components/cars/CarCard.css`**

```css
.car-card {
  background: white;
  border-radius: 12px;
  padding: 1.2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.car-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.12);
}
.car-card-title { font-size: 1rem; font-weight: 700; color: #1a1a2e; }
.car-field { display: flex; justify-content: space-between; font-size: 0.85rem; }
.car-field-label { color: #777; }
.car-field-value { font-weight: 600; }
```

- [ ] **Step 2: Create `src/components/cars/CarCard.jsx`**

```jsx
import { useTranslation } from 'react-i18next'
import './CarCard.css'

export default function CarCard({ car, fields, onClick }) {
  const { i18n } = useTranslation()
  const lang = i18n.language

  const visibleFields = [...fields]
    .filter(f => f.visible)
    .sort((a, b) => a.order - b.order)

  const formatValue = (key, value) => {
    if (value === undefined || value === null || value === '') return '–'
    if (['basis_preis', 'hoechster_preis'].includes(key))
      return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
    return value
  }

  return (
    <div className="car-card" onClick={onClick}>
      <div className="car-card-title">{car.marke} {car.modell}</div>
      {visibleFields.map(f => (
        <div key={f.key} className="car-field">
          <span className="car-field-label">
            {lang === 'de' ? f.label_de : f.label_en}
          </span>
          <span className="car-field-value">{formatValue(f.key, car[f.key])}</span>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Create `src/components/cars/ViewToggle.css`**

```css
.view-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}
.toggle-group {
  display: flex;
  background: white;
  border-radius: 8px;
  border: 1px solid #ddd;
  overflow: hidden;
}
.toggle-btn {
  padding: 6px 14px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.85rem;
  color: #555;
}
.toggle-btn.active {
  background: #1a1a2e;
  color: white;
  font-weight: 600;
}
```

- [ ] **Step 4: Create `src/components/cars/ViewToggle.jsx`**

```jsx
import { useTranslation } from 'react-i18next'
import './ViewToggle.css'

export default function ViewToggle({ view, setView, size, setSize }) {
  const { t } = useTranslation()

  return (
    <div className="view-toggle">
      <div className="toggle-group">
        <button className={`toggle-btn ${view === 'grid' ? 'active' : ''}`} onClick={() => setView('grid')}>
          {t('viewToggle.grid')}
        </button>
        <button className={`toggle-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>
          {t('viewToggle.list')}
        </button>
      </div>
      {view === 'grid' && (
        <div className="toggle-group">
          {['small', 'medium', 'large'].map(s => (
            <button key={s} className={`toggle-btn ${size === s ? 'active' : ''}`} onClick={() => setSize(s)}>
              {t(`viewToggle.${s}`)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add ev-database/src/components/cars/CarCard.jsx ev-database/src/components/cars/CarCard.css ev-database/src/components/cars/ViewToggle.jsx ev-database/src/components/cars/ViewToggle.css
git commit -m "feat: CarCard + ViewToggle components"
```

---

### Task 9: CarGrid + CarList + CarDetail

**Files:**
- Create: `ev-database/src/components/cars/CarGrid.jsx`
- Create: `ev-database/src/components/cars/CarGrid.css`
- Create: `ev-database/src/components/cars/CarList.jsx`
- Create: `ev-database/src/components/cars/CarList.css`
- Create: `ev-database/src/components/cars/CarDetail.jsx`
- Create: `ev-database/src/components/cars/CarDetail.css`

- [ ] **Step 1: Create `src/components/cars/CarGrid.css`**

```css
.car-grid { display: grid; gap: 1rem; }
.car-grid.small  { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
.car-grid.medium { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
.car-grid.large  { grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); }
```

- [ ] **Step 2: Create `src/components/cars/CarGrid.jsx`**

```jsx
import CarCard from './CarCard'
import './CarGrid.css'

export default function CarGrid({ cars, fields, size, onCarClick }) {
  return (
    <div className={`car-grid ${size}`}>
      {cars.map(car => (
        <CarCard key={car.id} car={car} fields={fields} onClick={() => onCarClick(car)} />
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Create `src/components/cars/CarList.css`**

```css
.car-list { display: flex; flex-direction: column; gap: 0.75rem; }
.car-list-row {
  background: white;
  border-radius: 10px;
  padding: 0.9rem 1.2rem;
  display: flex;
  gap: 2rem;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07);
  transition: box-shadow 0.15s;
  flex-wrap: wrap;
}
.car-list-row:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.12); }
.car-list-name { font-weight: 700; min-width: 160px; }
.car-list-field { font-size: 0.85rem; color: #555; white-space: nowrap; }
.car-list-field span { font-weight: 600; color: #1a1a2e; margin-left: 4px; }
```

- [ ] **Step 4: Create `src/components/cars/CarList.jsx`**

```jsx
import { useTranslation } from 'react-i18next'
import './CarList.css'

export default function CarList({ cars, fields, onCarClick }) {
  const { i18n } = useTranslation()
  const lang = i18n.language

  const visibleFields = [...fields]
    .filter(f => f.visible && f.key !== 'marke' && f.key !== 'modell')
    .sort((a, b) => a.order - b.order)

  const formatValue = (key, value) => {
    if (value === undefined || value === null || value === '') return '–'
    if (['basis_preis', 'hoechster_preis'].includes(key))
      return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
    return value
  }

  return (
    <div className="car-list">
      {cars.map(car => (
        <div key={car.id} className="car-list-row" onClick={() => onCarClick(car)}>
          <div className="car-list-name">{car.marke} {car.modell}</div>
          {visibleFields.map(f => (
            <div key={f.key} className="car-list-field">
              {lang === 'de' ? f.label_de : f.label_en}:
              <span>{formatValue(f.key, car[f.key])}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Create `src/components/cars/CarDetail.css`**

```css
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 200; padding: 1rem;
}
.modal-card {
  background: white;
  border-radius: 14px;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}
.modal-title { font-size: 1.3rem; font-weight: 700; margin-bottom: 1rem; }
.modal-close {
  position: absolute; top: 1rem; right: 1rem;
  background: #f0f0f0; border: none; border-radius: 50%;
  width: 32px; height: 32px; cursor: pointer; font-size: 1rem;
}
.modal-coming-soon { color: #888; font-style: italic; margin-top: 1rem; }
```

- [ ] **Step 6: Create `src/components/cars/CarDetail.jsx`**

```jsx
import { useTranslation } from 'react-i18next'
import './CarDetail.css'

export default function CarDetail({ car, onClose }) {
  const { t } = useTranslation()
  if (!car) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-title">{car.marke} {car.modell}</div>
        <p className="modal-coming-soon">{t('detail.comingSoon')}</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add ev-database/src/components/cars/CarGrid.jsx ev-database/src/components/cars/CarGrid.css ev-database/src/components/cars/CarList.jsx ev-database/src/components/cars/CarList.css ev-database/src/components/cars/CarDetail.jsx ev-database/src/components/cars/CarDetail.css
git commit -m "feat: CarGrid, CarList, CarDetail components"
```

---

### Task 10: HomePage

**Files:**
- Create: `ev-database/src/pages/HomePage.jsx`
- Create: `ev-database/src/pages/HomePage.css`

- [ ] **Step 1: Create `src/pages/HomePage.css`**

```css
.home-page { padding: 2rem 1.5rem; max-width: 1400px; margin: 0 auto; }
.home-page h1 { font-size: 1.6rem; margin-bottom: 1.5rem; }
.home-loading, .home-empty { color: #888; font-style: italic; padding: 2rem 0; }
```

- [ ] **Step 2: Create `src/pages/HomePage.jsx`**

```jsx
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

  if (carsLoading || fieldsLoading) return <div className="home-page"><p className="home-loading">{t('home.loading')}</p></div>

  return (
    <div className="home-page">
      <h1>{t('home.title')}</h1>
      <ViewToggle view={view} setView={handleSetView} size={size} setSize={handleSetSize} />
      {cars.length === 0
        ? <p className="home-empty">{t('home.noCars')}</p>
        : view === 'grid'
          ? <CarGrid cars={cars} fields={fields} size={size} onCarClick={setSelectedCar} />
          : <CarList cars={cars} fields={fields} onCarClick={setSelectedCar} />
      }
      {selectedCar && <CarDetail car={selectedCar} onClose={() => setSelectedCar(null)} />}
    </div>
  )
}
```

- [ ] **Step 3: Verify in browser**

`http://localhost:5173` — should show "Elektroauto-Datenbank" title, view toggle, empty state message "Keine Fahrzeuge gefunden."

- [ ] **Step 4: Commit**

```bash
git add ev-database/src/pages/HomePage.jsx ev-database/src/pages/HomePage.css
git commit -m "feat: HomePage with grid/list view"
```

---

### Task 11: CarForm (Admin — Manual Add/Edit)

**Files:**
- Create: `ev-database/src/components/admin/CarForm.jsx`
- Create: `ev-database/src/components/admin/CarForm.css`

- [ ] **Step 1: Create `src/components/admin/CarForm.css`**

```css
.car-form { display: flex; flex-direction: column; gap: 0; }
.car-form h2 { margin-bottom: 1.5rem; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.4rem; }
.form-group label { font-size: 0.8rem; font-weight: 600; color: #555; text-transform: uppercase; letter-spacing: 0.03em; }
.form-group input {
  padding: 0.55rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
}
.form-group input[readonly] { background: #f5f5f5; color: #888; cursor: default; }
.form-actions { display: flex; gap: 0.75rem; margin-top: 1.5rem; }
```

- [ ] **Step 2: Create `src/components/admin/CarForm.jsx`**

```jsx
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { addCar, updateCar } from '../../firebase/cars'
import { applyCalculations } from '../../utils/calculations'
import './CarForm.css'

const FIELDS = [
  { key: 'marke', label: 'Marke', type: 'text' },
  { key: 'modell', label: 'Modell', type: 'text' },
  { key: 'batterie_netto', label: 'Batterie Netto (kWh)', type: 'number' },
  { key: 'laden_10_80_min', label: '10%–80% (min)', type: 'number' },
  { key: 'kwh_nach_70', label: 'kWh nach 70% (berechnet)', type: 'number', calc: true },
  { key: 'kwh_pro_min', label: 'kWh/min (berechnet)', type: 'number', calc: true },
  { key: 'max_ladeleistung', label: 'Max. Ladeleistung (kW)', type: 'number' },
  { key: 'anhaengelast', label: 'Anhängelast (kg)', type: 'number' },
  { key: 'wltp_reichweite', label: 'WLTP Reichweite (km)', type: 'number' },
  { key: 'wltp_verbrauch', label: 'WLTP Verbrauch (kWh/100km)', type: 'number' },
  { key: 'basis_preis', label: 'Basispreis (€)', type: 'number' },
  { key: 'hoechster_preis', label: 'Höchster Preis (€)', type: 'number' },
  { key: 'null_hundert', label: '0–100 (s)', type: 'number' },
  { key: 'ps', label: 'PS', type: 'number' },
  { key: 'top_speed', label: 'Top Speed (km/h)', type: 'number' },
  { key: 'volt', label: 'Volt', type: 'number' },
  { key: 'markteinfuehrung', label: 'Markteinführung', type: 'text' },
]

const emptyForm = () => Object.fromEntries(FIELDS.map(f => [f.key, '']))

export default function CarForm({ car, onDone }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(car ? { ...car } : emptyForm())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const updated = applyCalculations({
      batterie_netto: parseFloat(form.batterie_netto) || 0,
      laden_10_80_min: parseFloat(form.laden_10_80_min) || 0,
    })
    setForm(prev => ({ ...prev, kwh_nach_70: updated.kwh_nach_70, kwh_pro_min: updated.kwh_pro_min }))
  }, [form.batterie_netto, form.laden_10_80_min])

  const handleChange = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const data = {}
    FIELDS.forEach(f => {
      data[f.key] = f.type === 'number' ? (parseFloat(form[f.key]) || 0) : (form[f.key] || '')
    })
    try {
      if (car?.id) await updateCar(car.id, data)
      else await addCar(data)
      onDone()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="car-form" onSubmit={handleSubmit}>
      <h2>{car ? 'Fahrzeug bearbeiten' : 'Fahrzeug hinzufügen'}</h2>
      <div className="form-grid">
        {FIELDS.map(f => (
          <div key={f.key} className="form-group">
            <label>{f.label}</label>
            <input
              type={f.type}
              value={form[f.key]}
              readOnly={f.calc}
              onChange={e => !f.calc && handleChange(f.key, e.target.value)}
              step={f.type === 'number' ? 'any' : undefined}
            />
          </div>
        ))}
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? t('admin.saving') : t('admin.save')}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onDone}>
          {t('admin.cancel')}
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add ev-database/src/components/admin/CarForm.jsx ev-database/src/components/admin/CarForm.css
git commit -m "feat: CarForm — manual add/edit vehicle"
```

---

### Task 12: CarImport (Excel/CSV with Column Mapping)

**Files:**
- Create: `ev-database/src/components/admin/CarImport.jsx`
- Create: `ev-database/src/components/admin/CarImport.css`

- [ ] **Step 1: Create `src/components/admin/CarImport.css`**

```css
.car-import h2 { margin-bottom: 1.5rem; }
.import-upload { margin-bottom: 1.5rem; }
.import-upload label { display: block; font-size: 0.8rem; font-weight: 600; color: #555; text-transform: uppercase; margin-bottom: 0.4rem; }
.mapping-table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; font-size: 0.9rem; }
.mapping-table th { background: #f5f5f5; padding: 0.5rem 0.75rem; text-align: left; font-size: 0.8rem; text-transform: uppercase; color: #555; }
.mapping-table td { padding: 0.5rem 0.75rem; border-bottom: 1px solid #eee; }
.mapping-table select { padding: 4px 8px; border-radius: 6px; border: 1px solid #ddd; }
.preview-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; overflow-x: auto; display: block; margin-bottom: 1.5rem; }
.preview-table th { background: #1a1a2e; color: white; padding: 0.4rem 0.6rem; text-align: left; white-space: nowrap; }
.preview-table td { padding: 0.4rem 0.6rem; border-bottom: 1px solid #eee; white-space: nowrap; }
```

- [ ] **Step 2: Create `src/components/admin/CarImport.jsx`**

```jsx
import { useState } from 'react'
import * as XLSX from 'xlsx'
import { useTranslation } from 'react-i18next'
import { importCars } from '../../firebase/cars'
import { applyCalculations } from '../../utils/calculations'
import './CarImport.css'

const DB_FIELDS = [
  { key: '', label: '— ignorieren —' },
  { key: 'marke', label: 'Marke' },
  { key: 'modell', label: 'Modell' },
  { key: 'batterie_netto', label: 'Batterie Netto (kWh)' },
  { key: 'laden_10_80_min', label: '10%–80% (min)' },
  { key: 'max_ladeleistung', label: 'Max. Ladeleistung (kW)' },
  { key: 'anhaengelast', label: 'Anhängelast (kg)' },
  { key: 'wltp_reichweite', label: 'WLTP Reichweite (km)' },
  { key: 'wltp_verbrauch', label: 'WLTP Verbrauch (kWh/100km)' },
  { key: 'basis_preis', label: 'Basispreis (€)' },
  { key: 'hoechster_preis', label: 'Höchster Preis (€)' },
  { key: 'null_hundert', label: '0–100 (s)' },
  { key: 'ps', label: 'PS' },
  { key: 'top_speed', label: 'Top Speed (km/h)' },
  { key: 'volt', label: 'Volt' },
  { key: 'markteinfuehrung', label: 'Markteinführung' },
]

const NUM_FIELDS = ['batterie_netto','laden_10_80_min','max_ladeleistung','anhaengelast',
  'wltp_reichweite','wltp_verbrauch','basis_preis','hoechster_preis','null_hundert','ps','top_speed','volt']

const autoMatch = (colName) => {
  const lower = colName.toLowerCase().replace(/\s/g, '_')
  const found = DB_FIELDS.find(f => f.key && (f.key === lower || f.label.toLowerCase().replace(/\s/g, '_') === lower))
  return found?.key || ''
}

export default function CarImport({ onDone }) {
  const { t } = useTranslation()
  const [columns, setColumns] = useState([])
  const [mapping, setMapping] = useState({})
  const [rows, setRows] = useState([])
  const [saving, setSaving] = useState(false)

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const wb = XLSX.read(ev.target.result, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 })
      const headers = data[0] || []
      const dataRows = data.slice(1).filter(r => r.some(c => c !== undefined && c !== ''))
      setColumns(headers)
      setRows(dataRows)
      const autoMap = {}
      headers.forEach(h => { autoMap[h] = autoMatch(String(h)) })
      setMapping(autoMap)
    }
    reader.readAsArrayBuffer(file)
  }

  const handleImport = async () => {
    setSaving(true)
    const cars = rows.map(row => {
      const car = {}
      columns.forEach((col, i) => {
        const dbKey = mapping[col]
        if (!dbKey) return
        const val = row[i]
        car[dbKey] = NUM_FIELDS.includes(dbKey) ? (parseFloat(val) || 0) : (String(val || ''))
      })
      return applyCalculations(car)
    }).filter(c => c.marke || c.modell)
    try {
      await importCars(cars)
      onDone()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="car-import">
      <h2>{t('admin.importVehicles')}</h2>
      <div className="import-upload">
        <label>{t('admin.importFile')}</label>
        <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} />
      </div>

      {columns.length > 0 && (
        <>
          <h3 style={{ marginBottom: '0.75rem' }}>{t('admin.importMapping')}</h3>
          <table className="mapping-table">
            <thead>
              <tr><th>Spalte in Datei</th><th>Feld in DB</th></tr>
            </thead>
            <tbody>
              {columns.map(col => (
                <tr key={col}>
                  <td>{col}</td>
                  <td>
                    <select value={mapping[col] || ''} onChange={e => setMapping(m => ({ ...m, [col]: e.target.value }))}>
                      {DB_FIELDS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 style={{ marginBottom: '0.75rem' }}>{t('admin.importPreview')}</h3>
          <table className="preview-table">
            <thead>
              <tr>{columns.map(c => <th key={c}>{c}</th>)}</tr>
            </thead>
            <tbody>
              {rows.slice(0, 5).map((row, i) => (
                <tr key={i}>{columns.map((c, j) => <td key={j}>{row[j] ?? ''}</td>)}</tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-primary" onClick={handleImport} disabled={saving}>
              {saving ? t('admin.saving') : `${t('admin.importConfirm')} (${rows.length} Fahrzeuge)`}
            </button>
            <button className="btn btn-secondary" onClick={onDone}>{t('admin.cancel')}</button>
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add ev-database/src/components/admin/CarImport.jsx ev-database/src/components/admin/CarImport.css
git commit -m "feat: CarImport — Excel/CSV with column mapping"
```

---

### Task 13: FieldToggle (Drag & Drop Field Config)

**Files:**
- Create: `ev-database/src/components/admin/FieldToggle.jsx`
- Create: `ev-database/src/components/admin/FieldToggle.css`

- [ ] **Step 1: Create `src/components/admin/FieldToggle.css`**

```css
.field-toggle h2 { margin-bottom: 1.5rem; }
.field-list { display: flex; flex-direction: column; gap: 0.5rem; }
.field-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: white;
  padding: 0.7rem 1rem;
  border-radius: 8px;
  border: 1px solid #eee;
  cursor: grab;
  user-select: none;
}
.field-item.dragging { opacity: 0.4; }
.drag-handle { color: #bbb; font-size: 1.1rem; cursor: grab; }
.field-label { flex: 1; font-size: 0.9rem; }
.field-toggle-switch {
  position: relative; width: 42px; height: 24px;
  display: inline-block;
}
.field-toggle-switch input { opacity: 0; width: 0; height: 0; }
.slider {
  position: absolute; inset: 0;
  background: #ddd; border-radius: 24px; cursor: pointer;
  transition: background 0.2s;
}
.slider::before {
  content: ''; position: absolute;
  width: 18px; height: 18px; bottom: 3px; left: 3px;
  background: white; border-radius: 50%;
  transition: transform 0.2s;
}
input:checked + .slider { background: #1a1a2e; }
input:checked + .slider::before { transform: translateX(18px); }
.save-btn-row { margin-top: 1.5rem; }
```

- [ ] **Step 2: Create `src/components/admin/FieldToggle.jsx`**

```jsx
import { useState } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTranslation } from 'react-i18next'
import { saveSettings } from '../../firebase/settings'
import './FieldToggle.css'

function SortableField({ field, onToggle }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.key })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div ref={setNodeRef} style={style} className={`field-item ${isDragging ? 'dragging' : ''}`}>
      <span className="drag-handle" {...attributes} {...listeners}>⠿</span>
      <span className="field-label">{field.label_de} / {field.label_en}</span>
      <label className="field-toggle-switch">
        <input type="checkbox" checked={field.visible} onChange={() => onToggle(field.key)} />
        <span className="slider" />
      </label>
    </div>
  )
}

export default function FieldToggle({ fields }) {
  const { t } = useTranslation()
  const [localFields, setLocalFields] = useState([...fields].sort((a, b) => a.order - b.order))
  const [saving, setSaving] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor))

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    const oldIdx = localFields.findIndex(f => f.key === active.id)
    const newIdx = localFields.findIndex(f => f.key === over.id)
    setLocalFields(arrayMove(localFields, oldIdx, newIdx))
  }

  const handleToggle = (key) =>
    setLocalFields(prev => prev.map(f => f.key === key ? { ...f, visible: !f.visible } : f))

  const handleSave = async () => {
    setSaving(true)
    const updated = localFields.map((f, i) => ({ ...f, order: i }))
    await saveSettings(updated)
    setSaving(false)
  }

  return (
    <div className="field-toggle">
      <h2>{t('admin.fields')}</h2>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={localFields.map(f => f.key)} strategy={verticalListSortingStrategy}>
          <div className="field-list">
            {localFields.map(f => (
              <SortableField key={f.key} field={f} onToggle={handleToggle} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <div className="save-btn-row">
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? t('admin.saving') : t('admin.save')}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add ev-database/src/components/admin/FieldToggle.jsx ev-database/src/components/admin/FieldToggle.css
git commit -m "feat: FieldToggle — drag & drop field visibility config"
```

---

### Task 14: AdminPanel + AdminPage

**Files:**
- Create: `ev-database/src/components/admin/AdminPanel.jsx`
- Create: `ev-database/src/components/admin/AdminPanel.css`
- Create: `ev-database/src/pages/AdminPage.jsx`
- Create: `ev-database/src/pages/AdminPage.css`

- [ ] **Step 1: Create `src/components/admin/AdminPanel.css`**

```css
.admin-panel { padding: 2rem 1.5rem; max-width: 1100px; margin: 0 auto; }
.admin-panel h1 { margin-bottom: 1.5rem; }
.admin-tabs { display: flex; gap: 0; border-bottom: 2px solid #eee; margin-bottom: 2rem; }
.admin-tab {
  padding: 0.6rem 1.4rem;
  background: none; border: none;
  font-size: 0.95rem; cursor: pointer; color: #777;
  border-bottom: 2px solid transparent; margin-bottom: -2px;
}
.admin-tab.active { color: #1a1a2e; font-weight: 700; border-bottom-color: #1a1a2e; }
.admin-actions { display: flex; gap: 0.75rem; margin-bottom: 1.5rem; }
.car-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
.car-table th { background: #f5f5f5; padding: 0.6rem 0.75rem; text-align: left; font-size: 0.8rem; text-transform: uppercase; color: #555; }
.car-table td { padding: 0.6rem 0.75rem; border-bottom: 1px solid #eee; }
.car-table tr:hover td { background: #fafafa; }
.btn-danger:hover { background: #c0392b; }
```

- [ ] **Step 2: Create `src/components/admin/AdminPanel.jsx`**

```jsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCars } from '../../hooks/useCars'
import { useSettings } from '../../hooks/useSettings'
import { deleteCar } from '../../firebase/cars'
import CarForm from './CarForm'
import CarImport from './CarImport'
import FieldToggle from './FieldToggle'
import './AdminPanel.css'

export default function AdminPanel() {
  const { t } = useTranslation()
  const { cars } = useCars()
  const { fields } = useSettings()
  const [tab, setTab] = useState('vehicles')
  const [view, setView] = useState('list') // 'list' | 'add' | 'edit' | 'import'
  const [editCar, setEditCar] = useState(null)

  const handleDelete = async (id) => {
    if (!window.confirm(t('admin.deleteConfirm'))) return
    await deleteCar(id)
  }

  return (
    <div className="admin-panel">
      <h1>{t('admin.title')}</h1>
      <div className="admin-tabs">
        <button className={`admin-tab ${tab === 'vehicles' ? 'active' : ''}`} onClick={() => { setTab('vehicles'); setView('list') }}>
          {t('admin.vehicles')} ({cars.length})
        </button>
        <button className={`admin-tab ${tab === 'fields' ? 'active' : ''}`} onClick={() => setTab('fields')}>
          {t('admin.fields')}
        </button>
      </div>

      {tab === 'vehicles' && (
        <>
          {view === 'list' && (
            <>
              <div className="admin-actions">
                <button className="btn btn-primary" onClick={() => setView('add')}>{t('admin.addVehicle')}</button>
                <button className="btn btn-secondary" onClick={() => setView('import')}>{t('admin.importVehicles')}</button>
              </div>
              <table className="car-table">
                <thead>
                  <tr><th>Marke</th><th>Modell</th><th>Batterie</th><th>Preis</th><th></th></tr>
                </thead>
                <tbody>
                  {cars.map(car => (
                    <tr key={car.id}>
                      <td>{car.marke}</td>
                      <td>{car.modell}</td>
                      <td>{car.batterie_netto} kWh</td>
                      <td>{car.basis_preis ? `${car.basis_preis.toLocaleString('de-DE')} €` : '–'}</td>
                      <td>
                        <button className="btn btn-secondary btn-small" style={{ marginRight: 6 }}
                          onClick={() => { setEditCar(car); setView('edit') }}>
                          {t('admin.edit')}
                        </button>
                        <button className="btn btn-danger btn-small" onClick={() => handleDelete(car.id)}>
                          {t('admin.delete')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          {(view === 'add' || view === 'edit') && (
            <CarForm car={view === 'edit' ? editCar : null} onDone={() => { setView('list'); setEditCar(null) }} />
          )}
          {view === 'import' && <CarImport onDone={() => setView('list')} />}
        </>
      )}

      {tab === 'fields' && fields.length > 0 && <FieldToggle fields={fields} />}
    </div>
  )
}
```

- [ ] **Step 3: Create `src/pages/AdminPage.css`**

```css
.admin-page { min-height: calc(100vh - 56px); }
.admin-header {
  display: flex; justify-content: flex-end;
  padding: 0.75rem 1.5rem;
  background: white; border-bottom: 1px solid #eee;
}
```

- [ ] **Step 4: Create `src/pages/AdminPage.jsx`**

```jsx
import { useTranslation } from 'react-i18next'
import { logout } from '../firebase/auth'
import AdminPanel from '../components/admin/AdminPanel'
import './AdminPage.css'

export default function AdminPage() {
  const { t } = useTranslation()
  return (
    <div className="admin-page">
      <div className="admin-header">
        <button className="btn btn-secondary" onClick={logout}
          style={{ padding: '4px 14px', borderRadius: 8, border: '1px solid #ddd', cursor: 'pointer', background: 'white' }}>
          Logout
        </button>
      </div>
      <AdminPanel />
    </div>
  )
}
```

- [ ] **Step 5: Verify full flow in browser**

1. Go to `http://localhost:5173/admin` → redirects to login
2. Login with admin credentials → lands on AdminPanel
3. Click "Fahrzeug hinzufügen" → form opens with all 17 fields, calculated fields update live
4. Add a test vehicle → appears in table
5. Go to `/` → vehicle appears as card in grid
6. Click "Kartenfelder" tab → drag fields, toggle visibility, save → cards on HomePage update immediately
7. Click "Importieren" → upload an Excel file → mapping table shows → import works

- [ ] **Step 6: Commit**

```bash
git add ev-database/src/components/admin/AdminPanel.jsx ev-database/src/components/admin/AdminPanel.css ev-database/src/pages/AdminPage.jsx ev-database/src/pages/AdminPage.css
git commit -m "feat: AdminPanel + AdminPage — vehicles table, tabs, logout"
```

---

### Task 15: Vercel Deployment

**Files:**
- Modify: `ev-database/vercel.json` (already created in Task 5)

- [ ] **Step 1: Push project to GitHub**

```bash
cd "/Users/tomkrohn/Library/Mobile Documents/com~apple~CloudDocs/website erstellen"
git push origin main
```

- [ ] **Step 2: Create Vercel project**

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import the GitHub repo
3. Set **Root Directory** to `ev-database`
4. Set **Framework Preset** to `Vite`

- [ ] **Step 3: Add environment variables in Vercel**

In Vercel Dashboard → Project → Settings → Environment Variables, add all 6 from `.env`:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

- [ ] **Step 4: Deploy**

Click Deploy. Wait for build to complete.

Expected: App is live at `https://<project>.vercel.app`

- [ ] **Step 5: Test live URL**

- Homepage loads with cars (or empty state)
- `/admin` redirects to login
- Login works, admin panel opens
- Add a car → appears on homepage

---

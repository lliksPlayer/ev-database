---
name: vercel-react-best-practices
description: Best Practices für React-Projekte auf Vercel. Deployment, Performance, Routing, Environment Variables und typische Fallstricke.
---

# Vercel + React Best Practices

## Projektstruktur
- Framework: **Next.js** bevorzugen (optimales Vercel-Deployment)
- Alternativ: Vite + React für reine SPAs (`vite build` → `dist/` deployen)
- `vercel.json` nur wenn Custom-Config nötig (Rewrites, Headers, Regions)

## Deployment
```bash
# CLI
npx vercel        # Preview-Deployment
npx vercel --prod # Production-Deployment

# Automatisch: Git-Push auf main → Production, andere Branches → Preview
```

## Environment Variables
- Lokale Entwicklung: `.env.local` (nie committen)
- In Vercel Dashboard: Settings → Environment Variables
- Prefix `NEXT_PUBLIC_` für client-seitige Variablen (Next.js)
- Prefix `VITE_` für client-seitige Variablen (Vite)
- Server-only Variablen (API Keys) OHNE Prefix – nie ans Frontend leaken

## Performance
- **Images:** immer `next/image` statt `<img>` (automatische Optimierung)
- **Fonts:** `next/font` für Zero-Layout-Shift
- **Code Splitting:** dynamische Imports für große Komponenten
  ```js
  const HeavyComponent = dynamic(() => import('./HeavyComponent'), { ssr: false });
  ```
- **Bundle-Analyse:** `ANALYZE=true next build` mit `@next/bundle-analyzer`

## React Best Practices
- State so nah wie möglich an der Komponente halten
- `useCallback` / `useMemo` nur wenn Profiler ein Problem zeigt – nicht voreilig
- Keine direkten DOM-Mutationen – immer State nutzen
- Formulare: `react-hook-form` für komplexe Formulare, native Controlled Inputs für einfache
- Fetching: `SWR` oder `TanStack Query` für Server-State, kein `useEffect` für Datenabruf

## Typische Vercel-Fallstricke
| Problem | Ursache | Fix |
|---------|---------|-----|
| Build schlägt fehl | fehlende Env Var | In Vercel Dashboard eintragen |
| 404 auf Reload | SPA ohne Rewrites | `vercel.json` mit `{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }` |
| Funktionen > 50MB | zu große Dependencies | Tree-Shaking prüfen, `sharp` als devDep |
| CORS-Fehler | API-Route fehlt | Next.js API Route als Proxy nutzen |
| Alte Daten | Stale Cache | `Cache-Control: no-store` oder ISR Revalidierung |

## Next.js App Router (empfohlen ab Next.js 13+)
```
app/
├── layout.tsx       # Root Layout
├── page.tsx         # Startseite (/)
├── globals.css
└── [slug]/
    └── page.tsx     # Dynamische Route
```
- Server Components by default (kein JS ans Frontend)
- `'use client'` nur wenn Interaktivität nötig (onClick, useState, useEffect)
- `loading.tsx` für automatische Suspense-Boundaries
- `error.tsx` für Error Boundaries

## Vercel-spezifische Features
- **Edge Functions:** `export const runtime = 'edge'` für minimale Latenz
- **ISR:** `revalidate: 60` in `fetch()` für statische Seiten mit Auto-Update
- **Analytics:** `@vercel/analytics` mit einem Import einbinden
- **Speed Insights:** `@vercel/speed-insights` für Core Web Vitals

# EV-Database Scraper + Detail-Ansicht

**Datum:** 2026-04-18  
**Status:** Approved

---

## Ziel

Fahrzeugdaten von ev-database.org automatisch scrapen und in Firestore importieren. Zusätzlich wird die CarDetail-Komponente ausgebaut, um alle neuen Felder in strukturierten Sektionen anzuzeigen.

---

## Teil 1 — Import-Script

### Datei
`ev-database/scripts/scrape-ev-database.js`

### Ablauf
1. Scrapt die Übersichtsseite `https://ev-database.org/` → sammelt alle Fahrzeug-URLs
2. Pro Fahrzeug: Firecrawl `scrape()` mit LLM-Extraktion via definiertem JSON-Schema
3. Transformiert Felder auf Firestore-Feldnamen
4. Schreibt alle Autos per `importCars()` in Firestore (batch)

### Ausführung
```bash
node scripts/scrape-ev-database.js
```

### Abhängigkeiten
- `@mendable/firecrawl-js` (bereits installiert via CLI)
- Firebase Admin SDK oder bestehende `src/firebase/cars.js` via Vite-Umgebung

---

## Teil 2 — Felder

### Immer auf der Karte (bestehende Settings, unverändert)
Werden weiterhin über Firestore Settings (`card_fields`) gesteuert.

### Neue Felder (nur in CarDetail)

| Firestore-Feld | Quelle ev-database.org | Einheit |
|---|---|---|
| `marke` | Brand | — |
| `modell` | Model | — |
| `baujahr` | Production years | — |
| `preis_de` | Price Germany | € |
| `bild_url` | Image URL | — |
| `reichweite_wltp` | WLTP Range | km |
| `akku_kapazitaet_kwh` | Useable Capacity | kWh |
| `architektur_volt` | Architecture | V |
| `laden_ac_kw` | Charge Power AC | kW |
| `laden_dc_kw` | Charge Power DC max | kW |
| `ladezeit_10_80_min` | Charge Time 10→80% | min |
| `beschleunigung_sec` | Acceleration 0–100 | sec |
| `hoechstgeschwindigkeit_kmh` | Top Speed | km/h |
| `leistung_kw` | Total Power | kW |
| `laenge_mm` | Length | mm |
| `breite_mm` | Width | mm |
| `hoehe_mm` | Height | mm |
| `radstand_mm` | Wheelbase | mm |
| `gewicht_leer_kg` | Weight Unladen | kg |
| `zul_gesamtgewicht_kg` | GVWR | kg |
| `zuladung_kg` | Max Payload | kg |
| `anhaengelast_gebremst_kg` | Towing Weight Braked | kg |
| `anhaengelast_ungebremst_kg` | Towing Weight Unbraked | kg |
| `kofferraum_l` | Cargo Volume | L |
| `kofferraum_max_l` | Cargo Volume Max | L |
| `frunk_l` | Cargo Volume Frunk | L |
| `dachlast_kg` | Roof Load | kg |
| `sitze` | Seats | — |
| `isofix` | Isofix | — |
| `wendekreis_m` | Turning Circle | m |
| `karosserie` | Car Body | — |
| `segment` | Segment | — |
| `waermepumpe` | Heat Pump | — |
| `plattform` | Platform | — |

---

## Teil 3 — CarDetail-Komponente

### Aktuelle Situation
`CarDetail.jsx` zeigt nur "Coming Soon".

### Neue Struktur
Modal mit gruppierten Sektionen:

1. **Fahrzeugbild** (bild_url, falls vorhanden)
2. **Basis** — marke, modell, baujahr, preis_de
3. **Reichweite & Akku** — reichweite_wltp, akku_kapazitaet_kwh, architektur_volt
4. **Laden** — laden_ac_kw, laden_dc_kw, ladezeit_10_80_min
5. **Performance** — beschleunigung_sec, hoechstgeschwindigkeit_kmh, leistung_kw
6. **Maße** — laenge_mm, breite_mm, hoehe_mm, radstand_mm
7. **Gewicht & Anhängelast** — gewicht_leer_kg, zul_gesamtgewicht_kg, zuladung_kg, anhaengelast_gebremst_kg, anhaengelast_ungebremst_kg
8. **Kofferraum** — kofferraum_l, kofferraum_max_l, frunk_l, dachlast_kg
9. **Diverses** — sitze, isofix, wendekreis_m, karosserie, segment, waermepumpe, plattform

Felder ohne Wert (`undefined`, `null`, `''`) werden ausgeblendet.

---

## Nicht im Scope

- Automatisches/wiederkehrendes Scraping (kein Cron)
- Admin-Panel-Integration (Option B — späteres Update)
- Änderungen an bestehenden Karten-Feldern oder Settings

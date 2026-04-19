# Wirtschaftlichkeitsrechner — Design Spec

**Datum:** 2026-04-19  
**Status:** approved  
**Projekt:** ev-vergleich

---

## Übersicht

Eigenständige Seite (`/rechner`) für den Kostenvergleich von Fahrzeugen. Unterstützt zwei Modi: EV vs. Verbrenner (ICE) und EV vs. EV. Fahrzeuge können direkt aus der Firestore-Datenbank geladen werden; ICE-Fahrzeuge haben zusätzlich eine manuelle Eingabe mit Vorlagen als Fallback (solange keine ICE-Daten in der DB vorhanden sind).

---

## Architektur

### Routing

- Neue Route: `/rechner` → `pages/Calculator.jsx`
- URL-Parameter:
  - `?ev1=<firestore-id>` — EV in Slot 1
  - `?ev2=<firestore-id>` — EV in Slot 2 (EV vs EV)
  - `?ice=1` — Slot 2 ist ICE (manuell oder DB)

### Komponenten-Struktur

```
pages/Calculator.jsx               # Hauptseite: URL-Parsing, Modus-State
components/calculator/
  VehicleSlot.jsx                  # Slot-Komponente (type: 'ev' | 'ice')
  IceForm.jsx                      # Manuelle ICE-Eingabe + Vorlagen
  UserModeToggle.jsx               # Normal / Experte Umschalter
  ResultsPanel.jsx                 # Tabs: Monatlich, Gesamtverlauf, Break-even
  CostChart.jsx                    # Recharts Linien- und Balkendiagramm
utils/
  tcoCalculation.js                # Reine Berechnungslogik (client-seitig, testbar)
```

### Fahrzeugübergabe

- Fahrzeugkarten (`CarCard.jsx`) bekommen einen Button *"In Rechner laden"*
- Klick navigiert zu `/rechner?ev1=<id>` — ist Slot 1 schon belegt (localStorage-Flag), wird `ev2=<id>` verwendet
- Ungültige Firestore-ID: Fehlermeldung im Slot, manuell wählen möglich

---

## Vergleichsmodi

| Modus | Slot 1 | Slot 2 |
|-------|--------|--------|
| EV vs. ICE | EV aus DB | ICE aus DB (oder manuell) |
| EV vs. EV | EV aus DB | EV aus DB |

Moduswahl per Toggle auf der Rechner-Seite. `VehicleSlot` erhält `type`-Prop (`ev` | `ice`), das die Firestore-Sammlung bestimmt. Solange keine ICE-Daten in der DB vorhanden sind, ist der DB-Selector ausgegraut — manuelle Eingabe ist Standard.

---

## Parameter

### Normal-Modus

| Parameter | Einheit |
|-----------|---------|
| Kaufpreis | € |
| Jahreskilometer | km/Jahr |
| Strompreis | €/kWh |
| Kraftstoffpreis | €/L |
| Betrachtungszeitraum | Jahre (1–15) |

### Experten-Modus (zusätzlich)

| Parameter | Einheit |
|-----------|---------|
| Wartungskosten | €/Jahr |
| Versicherung | €/Jahr |
| KFZ-Steuer | €/Jahr |
| Restwert nach X Jahren | % vom Kaufpreis |
| Förderung / BAFA | € (einmalig) |
| Finanzierungszins | % |

EV-Werte (Kaufpreis, Verbrauch kWh/100km) werden automatisch aus Firestore übernommen und sind überschreibbar.

### ICE-Vorlagen (Normal + Experten)

Vorbefüllte Durchschnittswerte, editierbar:
- VW Golf 2.0 TDI
- BMW 320d
- VW Passat TDI

---

## Ergebnis-Ansicht

Drei Sektionen als Tabs:

### 1. Monatliche Kosten
Gestapeltes Balkendiagramm: Fahrzeug A vs. B, aufgeschlüsselt nach Kostenkategorien (Kraftstoff/Strom, Wartung, Finanzierung, Versicherung, Steuer).

### 2. Gesamtkosten über Zeit
Liniendiagramm: X-Achse = Jahre, Y-Achse = kumulierte Gesamtkosten. Schnittpunkt der beiden Linien = Break-even-Punkt (visuell markiert).

### 3. Break-even & Zusammenfassung
- Prominente Aussage: *"Das EV amortisiert sich nach X Jahren / Y km"*
- Tabelle aller Kostenpositionen im Vergleich
- Hinweis wenn kein Break-even innerhalb des Betrachtungszeitraums erreicht wird

**Bibliothek:** Recharts (leichtgewichtig, React-nativ).

---

## Edge Cases

- Nur ein Fahrzeug geladen → Ergebnisse ausgegraut, Hinweis *"Bitte zweites Fahrzeug wählen"*
- EV-Verbrauch fehlt in DB → Feld manuell ausfüllbar
- Ungültige URL-Parameter → Fehlermeldung im betroffenen Slot
- Kein Break-even → klarer Hinweis in Sektion 3

---

## Nicht im Scope

- Echtzeitpreise (Strom, Sprit) via API
- Nutzerkonten / gespeicherte Vergleiche
- PDF-Export
- ICE-Datenbankbefüllung (separater Task)

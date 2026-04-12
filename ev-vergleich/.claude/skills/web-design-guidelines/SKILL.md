---
name: web-design-guidelines
description: Designprinzipien und UI-Regeln für das EV-Vergleich Projekt. Verwende dieses Skill wenn neue UI-Elemente gebaut oder bestehende überarbeitet werden sollen.
---

# Web Design Guidelines – EV Vergleich

## Prinzipien
- **Clean & Bright:** Helle Hintergründe (Off-White/Grau für den Body, strahlendes Weiß für Karten) schaffen eine saubere, offene Atmosphäre.
- **Daten im Fokus durch Kontrast:** Wichtige Zahlen sind groß und dunkel (starker Kontrast), Labels sind kleiner, gedimmt und strukturiert (Großbuchstaben).
- **Struktur durch Whitespace:** Leerraum (Whitespace) wird aktiv genutzt, um Elemente voneinander zu trennen. Weniger Rahmen, mehr Raum.
- **Dezente Ebenen:** Hierarchien werden durch sehr weiche Schlagschatten (`shadow-sm`, `shadow-soft`) und feine, helle Rahmenlinien (`border-gray-100/200`) gebildet.

## Typografie
- Hauptwerte/Datenpunkte: `text-gray-900 font-black` oder `text-gray-900 font-bold`
- Labels/Beschriftungen (Standard): `text-gray-500 text-[10px] (oder text-xs) font-bold uppercase tracking-widest`
- Highlights/Karten-Titel: `text-teal-600 text-xs font-bold uppercase tracking-widest`
- Subtext/Hilfstexte: `text-gray-500 text-xs font-medium` oder `text-gray-400`

## Abstände & Layout
- Karten-Padding: Großzügig, meist `p-5` oder `p-6`
- Hintergrund-Trennung: Hintergrund `bg-[#f8f9fa]` (oder `bg-gray-50`), Karten `bg-white` mit `border border-gray-200`
- Abschnittstrennlinie: `border-t border-gray-100` oder `border-gray-200`
- Radius: Weiche, abgerundete Ecken (`rounded-xl` oder `rounded-2xl` für große Karten, `rounded-lg` für Inputs)

## Interaktion
- Hover auf Karten: Leichter Lift und Schattenverstärkung (z.B. `hover:-translate-y-1 hover:shadow-md transition-all`)
- Hover auf Buttons: Farbe intensivieren (z.B. `bg-teal-500` zu `bg-teal-600`) oder bei Ghost-Buttons Hintergrund leicht abdunkeln (`hover:bg-gray-50`)
- Transitions: immer `transition-colors`, `transition-shadow` oder `transition-all duration-200`
- Fokus (Eingabefelder): immer `focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none`

## Farben nach Bedeutung
| Bedeutung         | Farbe              | Anwendungsbeispiel |
|-------------------|--------------------|--------------------|
| Primär / Brand / EV | `teal-500/600`     | Primäre Buttons, EV-Daten, Logos |
| ICE / Verbrenner  | `orange-500/600`   | Verbrenner-Rechner, Kontrast-Tabs |
| Hervorragend      | `teal-500`         | Kaufberater (Gut) |
| Gut / Ok          | `amber-400`        | Kaufberater (Ok) |
| Toleranz          | `orange-400`       | Kaufberater (Toleranz) |
| Fehler / No go    | `red-500`          | Kaufberater (No go) |
| Highlight Reichweite| `blue-500`         | Top-Stats, Badges |
| Hintergrund App   | `bg-[#f8f9fa] / bg-gray-50` | Body-Background |
| Kartenfläche      | `bg-white`         | Daten-Container |

## Dos & Don'ts
**Do:**
- Badges für Status mit weichen Pastell-Hintergründen und kräftiger Schrift (z.B. `bg-teal-50 text-teal-600 px-1.5 py-0.5 rounded-full text-[9px] font-bold`)
- Trennlinien mit `border-t border-gray-100` für visuelle Gruppen innerhalb von Karten.
- Icons mit feinen Linien (Lucide) in der jeweiligen Akzentfarbe nutzen, um Kategorien schnell erfassbar zu machen.

**Don't:**
- Keine großflächigen dunklen Hintergründe (Dark-Mode-Ästhetik vermeiden).
- Keine harten, tiefschwarzen Schatten. Schatten müssen sehr weich und transparent sein.
- Keine massiven, gefüllten Farbblöcke für Sekundär-Informationen (lieber farbige Outlines oder sehr transparente Hintergründe wie `bg-blue-50` nutzen).
- Keine überladenen Karten – setze Whitespace ein, um Daten atmen zu lassen.
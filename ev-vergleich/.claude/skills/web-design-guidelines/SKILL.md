---
name: web-design-guidelines
description: Designprinzipien und UI-Regeln für das EV-Vergleich Projekt. Verwende dieses Skill wenn neue UI-Elemente gebaut oder bestehende überarbeitet werden sollen.
---

# Web Design Guidelines – EV Vergleich

## Prinzipien
- **Dark First:** Alles auf dunklem Hintergrund, keine hellen Flächen
- **Daten im Vordergrund:** Zahlen groß und fett, Labels klein und gedimmt
- **Sofort lesbar:** Statusfarben (rot/orange/grün) müssen auf einen Blick erkennbar sein
- **Kein Overengineering:** Keine unnötigen Animationen, keine Ablenkungen

## Typografie
- Hauptwerte: `text-white font-black` oder `font-bold`
- Labels/Beschriftungen: `text-slate-500 text-xs font-semibold uppercase tracking-wider`
- Markenname auf Karten: `text-teal-400 text-xs font-bold uppercase tracking-widest`
- Subtext: `text-slate-500 text-xs`

## Abstände & Layout
- Karten-Padding: `px-5 py-4`
- Gap zwischen Icon-Zeilen: `gap-x-4 gap-y-3`
- Abschnittstrennlinie: `border-t border-slate-700/60`
- Grid für Datenpunkte: `grid grid-cols-2`

## Interaktion
- Hover auf Karten: `hover:-translate-y-0.5 hover:border-slate-600/70 hover:shadow-xl`
- Hover auf Buttons: Farbe aufhellen, Border aufhellen
- Transitions: immer `transition-colors` oder `transition-all duration-200`
- Fokus: immer `focus:border-teal-500 focus:outline-none`

## Farben nach Bedeutung
| Bedeutung         | Farbe              |
|-------------------|--------------------|
| Primär / Brand    | `teal-400/500`     |
| Erfolg / Gut      | `emerald-400/500`  |
| Warnung / Ok      | `amber-400/500`    |
| Fehler / No go    | `red-400/500`      |
| Reichweite        | `blue-400`         |
| Preis             | `emerald-400`      |
| Ladezeit          | `orange-400`       |
| Geschwindigkeit   | `red-400`          |
| PS / Leistung     | `rose-400`         |
| Volt              | `blue-400`         |
| Anhängelast       | `amber-600`        |
| Verbrauch         | `violet-400`       |

## Dos & Don'ts
**Do:**
- Badges für Status mit `px-2 py-0.5 border rounded-full text-xs font-black`
- Trennlinien mit `border-t border-slate-700/40` für visuelle Gruppen
- Leere Zustände immer mit Handlungsaufforderung (Button zum Hinzufügen)

**Don't:**
- Keine weißen oder hellen Hintergründe
- Keine Schatten ohne Farbe (`shadow-black/30` statt `shadow`)
- Keine langen Texte in Karten – alles `truncate` wenn nötig
- Keine Inline-Styles außer für Werte die Tailwind nicht kann

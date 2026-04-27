# Projektübersicht — Was macht welche Datei?

> Für jeden verständlich erklärt. Letzte Aktualisierung: 2026-04-20

---

## Projektstruktur auf einen Blick

```
website erstellen/
├── ev-database/         ← Aktive React-App (einzige Entwicklungsbasis)
├── ev-vergleich/        ← Legacy-Stand der alten Website (nur Referenz)
├── Brain/               ← Dokumentation & Entscheidungen
└── ÜBERSICHT.md         ← Diese Datei
```

---

## Hauptverzeichnis

| Datei | Was sie macht |
|---|---|
| `ÜBERSICHT.md` | Diese Übersicht |
| `CLAUDE.md` | Anweisungen für den KI-Assistenten (Claude) |
| `ev-dashboard.html` | Einfaches Test-Dashboard im Browser |
| `vercel.json` | Einstellungen für den Hosting-Dienst (Vercel) — **nicht umbenennen** |
| `skills-lock.json` | Liste der KI-Hilfswerkzeuge (automatisch generiert) |

---

## Arbeitsregel

Für neue Features, Bugfixes, UI-Änderungen und KI-Arbeit gilt nur noch:

- **Aktive App:** `ev-database/`
- **Legacy / nur Referenz:** `ev-vergleich/`

---

## ev-vergleich/ — Legacy-Stand der älteren Website-Version

Einfache HTML/JavaScript-Website ohne komplexes Framework. Dieser Ordner bleibt nur noch als Referenz erhalten und ist **nicht mehr die aktive Entwicklungsbasis**.

### Hauptdateien

| Datei | Was sie macht |
|---|---|
| `index.html` | **Startseite** — die eigentliche Website für Elektroautos |
| `ice.html` | **Verbrenner-Seite** — die Vergleichsseite für Benzin-/Dieselautos |
| `style.css` | **Aussehen** — alle Farben, Schriften, Layout-Regeln |
| `firebase.json` | Einstellungen für die Datenbank — **nicht umbenennen** |
| `ev-import.csv` | **Importdatei** — Fahrzeugdaten im Tabellenformat |

### JavaScript-Dateien (ev-vergleich/js/)

| Datei | Was sie macht |
|---|---|
| `main.js` | **Startpunkt** — wird beim Laden der Seite zuerst ausgeführt |
| `config.js` | **Grundeinstellungen** — API-Schlüssel, globale Konfiguration |
| `firebase.js` | **Datenbankverbindung** — verbindet die Website mit Firebase |
| `firebase-db.js` | **Datenbankabfragen** — liest/schreibt Fahrzeugdaten in der Datenbank |
| `data.js` | **Datenverwaltung** — lädt und verwaltet alle Fahrzeugdaten |
| `cars.js` | **Fahrzeugliste** — zeigt alle Elektroautos an |
| `render.js` | **Darstellung** — baut die Fahrzeugkarten im Browser zusammen |
| `filter.js` | **Filterlogik** — berechnet welche Autos den Filterkriterien entsprechen |
| `filter-ui.js` | **Filter-Oberfläche** — zeigt die Filterleiste an |
| `state.js` | **Zustandsverwaltung** — merkt sich was der Nutzer gerade eingestellt hat |
| `events.js` | **Klick-Reaktionen** — reagiert auf Klicks, Eingaben, Scroll |
| `ui.js` | **Benutzeroberfläche** — allgemeine Hilfsfunktionen für die Anzeige |
| `storage.js` | **Browser-Speicher** — speichert Einstellungen im Browser (localStorage) |
| `admin.js` | **Admin-Bereich** — Funktionen zum Verwalten der Fahrzeugdaten |
| `advisor.js` | **Fahrzeug-Berater** — Empfehlungslogik für passende Autos |
| `tco.js` | **Kostenrechner** — berechnet Gesamtkosten über mehrere Jahre (TCO = Total Cost of Ownership) |
| `csv.js` | **CSV-Import** — liest Tabellendateien (.csv) ein |
| `github.js` | **GitHub-Verbindung** — lädt Daten von GitHub |
| `duplicates.js` | **Duplikat-Prüfung** — erkennt doppelte Fahrzeugeinträge |
| `toast.js` | **Benachrichtigungen** — zeigt kurze Meldungen (z.B. "Gespeichert!") |
| `patch-anhaengelast.js` | **Datenpflege** — korrigiert fehlende Anhängelast-Werte |
| `ice-config.js` | **Verbrenner-Einstellungen** — Konfiguration für die Verbrenner-Seite |
| `ice-firebase.js` | **Verbrenner-Datenbank** — Datenbankzugriff für Verbrennerautos |
| `ice-csv.js` | **Verbrenner-Import** — liest Verbrenner-Tabellendaten ein |
| `ice-filter.js` | **Verbrenner-Filter** — Filterlogik für die Verbrenner-Seite |
| `ice-render.js` | **Verbrenner-Darstellung** — baut die Verbrenner-Fahrzeugkarten zusammen |
| `ice-state.js` | **Verbrenner-Zustand** — merkt sich Verbrenner-Filtereinstellungen |
| `ice-ui.js` | **Verbrenner-Oberfläche** — Hilfsfunktionen für die Verbrenner-Seite |

---

## ev-database/ — Aktive Website-Version (React)

Modernere Version mit React-Framework. Diese App ist jetzt die **einzige aktive Entwicklungsbasis** und soll fuer neue Arbeit verwendet werden.

### Hauptdateien

| Datei | Was sie macht |
|---|---|
| `index.html` | **Einstiegspunkt** — die leere HTML-Hülle, React füllt sie — **nicht umbenennen** |
| `package.json` | **Projektbeschreibung** — listet alle verwendeten Hilfsbibliotheken — **nicht umbenennen** |
| `vite.config.js` | **Build-Einstellungen** — wie die Website zusammengebaut wird — **nicht umbenennen** |
| `vercel.json` | **Hosting-Einstellungen** — Weiterleitungsregeln für Vercel — **nicht umbenennen** |
| `eslint.config.js` | **Code-Qualitätsprüfung** — prüft den Code auf häufige Fehler — **nicht umbenennen** |
| `serviceAccountKey.json` | **Datenbank-Zugangsdaten** — geheimer Schlüssel für Firebase-Admin-Zugriff ⚠️ |
| `README.md` | Kurze Projektbeschreibung |

### src/ — Der eigentliche Quellcode

#### Grunddateien

| Datei | Was sie macht |
|---|---|
| `src/main.jsx` | **Startpunkt** — startet die React-App — **nicht umbenennen** |
| `src/App.jsx` | **App-Gerüst** — definiert alle Seiten und welche URL wohin führt |
| `src/index.css` | **Globales Aussehen** — Grundstile für die gesamte App |

#### src/pages/ — Die einzelnen Seiten der Website

| Datei | Was sie macht |
|---|---|
| `HomePage.jsx` + `HomePage.css` | **Elektroauto-Übersicht** — Hauptseite mit allen E-Autos und Filtern |
| `IceHomePage.jsx` | **Verbrenner-Übersicht** — Seite mit Benzin-/Dieselautos (ICE = Verbrennungsmotor) |
| `Calculator.jsx` + `Calculator.css` | **Kostenrechner-Seite** — Seite für den Gesamtkostenvergleich |
| `LoginPage.jsx` + `LoginPage.css` | **Anmeldeseite** — Login-Formular für den Admin-Bereich |
| `AdminPage.jsx` + `AdminPage.css` | **Verwaltungsseite** — Fahrzeuge hinzufügen, bearbeiten, löschen |

#### src/components/ — Wiederverwendbare Bausteine

**layout/** — Seitenlayout

| Datei | Was sie macht |
|---|---|
| `TopNav.jsx` + `TopNav.css` | **Navigationsleiste** — die obere Menüleiste |
| `LanguageSwitch.jsx` | **Sprachwechsler** — umschalten zwischen Deutsch und Englisch |

**cars/** — Fahrzeuganzeige

| Datei | Was sie macht |
|---|---|
| `CarCard.jsx` + `CarCard.css` | **Fahrzeugkarte** — eine einzelne Auto-Kachel mit Bild und Daten |
| `CarGrid.jsx` + `CarGrid.css` | **Fahrzeugraster** — zeigt alle Karten im Gitter-Layout |
| `CarList.jsx` + `CarList.css` | **Fahrzeugliste** — zeigt alle Autos als kompakte Liste |
| `CarDetail.jsx` + `CarDetail.css` | **Fahrzeug-Detailansicht** — alle Daten eines einzelnen Autos |
| `ViewToggle.jsx` + `ViewToggle.css` | **Ansicht-Umschalter** — wechselt zwischen Kachel- und Listenansicht |

**calculator/** — Kostenrechner-Bausteine

| Datei | Was sie macht |
|---|---|
| `VehicleSlot.jsx` + `VehicleSlot.css` | **Fahrzeug-Slot** — ein Platz für ein zu vergleichendes Fahrzeug |
| `IceForm.jsx` + `IceForm.css` | **Verbrenner-Eingabe** — Formular für Verbrenner-Vergleichsdaten |
| `ResultsPanel.jsx` + `ResultsPanel.css` | **Ergebnisanzeige** — zeigt das Ergebnis des Kostenvergleichs |
| `CostChart.jsx` | **Kostendiagramm** — Grafik der Kosten über die Jahre |
| `UserModeToggle.jsx` | **Nutzertyp-Umschalter** — wechselt zwischen Privat- und Gewerbekunde |

**admin/** — Admin-Bereich-Bausteine

| Datei | Was sie macht |
|---|---|
| `AdminPanel.jsx` + `AdminPanel.css` | **Admin-Hauptbereich** — Übersicht im Verwaltungsbereich |
| `CarForm.jsx` + `CarForm.css` | **Fahrzeug-Formular** — Formular zum Hinzufügen/Bearbeiten eines Autos |
| `CarImport.jsx` + `CarImport.css` | **Massenimport** — mehrere Fahrzeuge auf einmal importieren |
| `FieldToggle.jsx` + `FieldToggle.css` | **Felder-Auswahl** — welche Datenspalten angezeigt werden sollen |

#### src/firebase/ — Datenbankverbindung

| Datei | Was sie macht |
|---|---|
| `config.js` | **Verbindungseinstellungen** — wie die App sich mit Firebase verbindet |
| `auth.js` | **Anmeldung** — Login und Logout-Funktionen |
| `cars.js` | **Elektroauto-Daten** — liest/schreibt E-Auto-Einträge in der Datenbank |
| `ice-cars.js` | **Verbrenner-Daten** — liest/schreibt Verbrenner-Einträge in der Datenbank |
| `settings.js` | **App-Einstellungen** — speichert Konfiguration in der Datenbank |

#### src/hooks/ — Wiederverwendbare Logik-Bausteine (React-Hooks)

| Datei | Was sie macht |
|---|---|
| `useAuth.js` | **Anmeldestatus** — prüft ob jemand eingeloggt ist |
| `useCars.js` | **Fahrzeugdaten** — lädt und aktualisiert die Fahrzeugliste |
| `useSettings.js` | **Einstellungen** — lädt und speichert App-Einstellungen |

#### src/config/ — Konfiguration

| Datei | Was sie macht |
|---|---|
| `fields.js` | **Felder-Definition** — welche Datenspalten es gibt und wie sie heißen |

#### src/utils/ — Rechenlogik

| Datei | Was sie macht |
|---|---|
| `calculations.js` | **Allgemeine Berechnungen** — Hilfsfunktionen für verschiedene Rechnungen |
| `tcoCalculation.js` | **Gesamtkosten-Berechnung** — berechnet Kosten über die gesamte Fahrzeug-Nutzungsdauer |

#### src/i18n/ — Übersetzungen

| Datei | Was sie macht |
|---|---|
| `de.json` | **Deutsche Texte** — alle Texte der Website auf Deutsch |
| `en.json` | **Englische Texte** — alle Texte der Website auf Englisch |
| `index.js` | **Übersetzungs-Logik** — wählt je nach Spracheinstellung die richtigen Texte |

### public/ — Öffentliche Dateien

| Datei | Was sie macht |
|---|---|
| `favicon.svg` | **Browser-Symbol** — das kleine Icon im Browser-Tab |
| `icons.svg` | **Icon-Sammlung** — alle verwendeten Symbole (Pfeile, Sterne, etc.) |

### scripts/ — Werkzeuge (werden manuell ausgeführt, nicht Teil der Website)

| Datei | Was sie macht |
|---|---|
| `scrape-ev-database.js` | **Daten-Sammler** — lädt automatisch Fahrzeugdaten von ev-database.org herunter |
| `parse-har.js` | **Netzwerk-Aufzeichnung auslesen** — verarbeitet aufgezeichnete Browser-Anfragen zu Fahrzeugdaten |
| `firebase-import.js` | **Datenbank-Import** — lädt Fahrzeugdaten in die Firebase-Datenbank hoch |
| `import-from-json.js` | **JSON-Import** — liest eine JSON-Datei ein und bereitet Daten für den Import vor |
| `export-csv.js` | **CSV-Export** — exportiert Fahrzeugdaten aus der Datenbank als Tabelle (.csv) |

---

## Brain/ — Projektdokumentation

| Datei/Ordner | Was sie enthält |
|---|---|
| `log.md` | **Aufgabenprotokoll** — was wann gemacht wurde |
| `index.md` | **Wiki-Startseite** — Übersicht der Dokumentation |
| `CLAUDE.md` | **KI-Anweisungen** — wie Claude mit der Dokumentation umgehen soll |
| `wiki/decisions/` | **Entscheidungen** — warum welche Technologie/Lösung gewählt wurde |
| `wiki/projects/ev-database.md` | **Projektstatus der aktiven App** |
| `wiki/projects/ev-vergleich.md` | **Legacy-Status der alten Website** |
| `wiki/concepts/tco.md` | **Konzepterklärung** — was TCO (Gesamtkosten) bedeutet |

---

## Abkürzungen erklärt

| Kürzel | Bedeutung |
|---|---|
| EV | Electric Vehicle — Elektrofahrzeug |
| ICE | Internal Combustion Engine — Verbrennungsmotor |
| TCO | Total Cost of Ownership — Gesamtkosten über die Nutzungsdauer |
| HAR | HTTP Archive — aufgezeichnete Browser-Netzwerkanfragen |
| CSV | Comma-Separated Values — Tabellendatei (öffenbar in Excel) |
| JSON | JavaScript Object Notation — strukturiertes Dateiformat |
| JSX | JavaScript + HTML kombiniert (React-Syntax) |
| CSS | Cascading Style Sheets — Designdatei für Aussehen/Layout |

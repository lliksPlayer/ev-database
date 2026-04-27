# TCO Calculator Audit

Datum: `2026-04-24`

## Ziel dieses Audits

Vor dem Umbau des TCO-Rechners wird der aktuelle Zustand des Flows dokumentiert:

- welche Einstiege in den Rechner heute funktionieren
- welche Verknüpfungen nur teilweise funktionieren
- welche Rechen- oder Zustandsfehler aktuell bestehen
- welche Verhaltensweisen beim Umbau zwingend geschützt werden müssen

Dieses Dokument ist die technische Ausgangsbasis fuer die naechsten Rechner-Phasen.

## Gepruefter Scope

- Einstieg aus der EV-Datenbank
- Einstieg aus der Verbrenner-Datenbank
- URL-Parameter `ev1`, `ev2`, `ice1`
- Umschalten `EV vs. ICE` / `EV vs. EV`
- manuelle ICE-Eingabe
- Standard- vs. Experten-Modus
- Ergebnisdarstellung inkl. Diagramme

## Aktuelle Flow-Matrix

### Funktioniert aktuell

- `EV-Karte -> /rechner?ev1=<id>`
  - Das EV wird korrekt in Slot A vorausgewaehlt.
- `Verbrenner-Karte -> /rechner?ice1=<id>`
  - Das ICE wird korrekt in Slot B vorausgewaehlt.
- `EV vs. EV` kann technisch ueber `ev1` + `ev2` initialisiert werden.
- Die manuelle ICE-Eingabe fuer Slot B funktioniert technisch.
- Die Ergebnisse aktualisieren sich grundsaetzlich live, sobald gueltige Fahrzeuge in Slot A und B vorhanden sind.
- `lint` und `build` laufen aktuell sauber.

### Funktioniert nur teilweise

- `ICE-Karte -> Rechner`
  - Der Link setzt nur Slot B.
  - Slot A bleibt leer, daher erscheint noch kein Ergebnis, bis ein EV gewaehlt wird.
  - Technisch korrekt, aber aus Produktsicht nur halb gefuehrt.
- `Experten-Modus`
  - Expertenfelder werden sichtbar und beeinflussen die Rechnung.
  - Beim Zurueckschalten auf Standard bleiben Expertenwerte intern aktiv.
- `Verbrauchs- und Fahrzeugwerte`
  - Teile der Rechnung kommen aus `vehicle`, andere aus `params`.
  - Das funktioniert aktuell, ist aber strukturell inkonsistent und fehleranfaellig.

### Fehlt aktuell

- Kein `In Rechner laden` in der Listenansicht.
- Kein `In Rechner laden` im Detail-Modal.
- Kein gefuehrter Einstieg fuer `zweites EV zum Vergleich`.
- Keine echte Standard-/Experten-Trennung auf Datenebene.
- Keine Szenario- oder Sensitivitaetsanalyse.
- Keine Finanzierungsarten ausser einer simplen Zinslogik.

## Verifizierte technische Probleme

### 1. Kaufpreis-Override im Rechner ist aktuell wirkungslos

Der Rechner zeigt pro Slot ein Feld `Kaufpreis`, speichert den Wert aber nur in `params.kaufpreis`.
Die eigentliche Berechnung liest den Kaufpreis hingegen direkt aus `vehicle.basis_preis`.

Folge:

- Der Nutzer kann den Kaufpreis im Rechner aendern.
- Die Gesamtkosten aendern sich dabei aktuell nicht.

Verifiziert durch Laufzeitcheck:

- `calculateTCO(vehicle, { kaufpreis: 30000 }, 1)` und
- `calculateTCO(vehicle, { kaufpreis: 45000 }, 1)`

liefern derzeit denselben Gesamtwert, solange `vehicle.basis_preis` gleich bleibt.

### 2. Expertenwerte bleiben nach dem Zurueckschalten auf Standard aktiv

Beim Wechsel in den Experten-Modus werden zusaetzliche Default-Felder in `paramsA` und `paramsB` gemerged.
Beim Wechsel zurueck auf Standard werden die Expertenfelder aber nicht entfernt, sondern durch `{ ...defaults, ...p }` weiterhin behalten.

Folge:

- Der Nutzer glaubt, wieder im einfachen Standard-Modus zu sein.
- Versteckte Expertenwerte beeinflussen die Rechnung weiter im Hintergrund.

### 3. Verknuepfungslogik ist auf Karten beschraenkt

Der Rechner ist aktuell nur direkt aus den Karten erreichbar.
Die Listenansicht und das Detail-Modal haben keine Rechner-Verknuepfung.

Folge:

- Der Flow ist je nach Darstellungsmodus unterschiedlich.
- Das fuehrt zu inkonsistentem Verhalten innerhalb derselben Produktoberflaeche.

### 4. Der Rechnerzustand wird nur einmal aus der URL initialisiert

`ev1`, `ev2` und `ice1` werden beim Mount des Rechners in `useState` uebernommen.
Es gibt keine nachgelagerte Synchronisierung, falls sich die URL spaeter aendert, waehrend der Rechner bereits geoeffnet ist.

Folge:

- Erstes Laden funktioniert.
- Spaetere URL-Aenderungen auf derselben Route sind nicht sauber an den internen Zustand gekoppelt.

### 5. Der Breakeven-Flow ist asymmetrisch auf Fahrzeug A ausgerichtet

Der aktuelle `findBreakeven`-Flow beantwortet nur:

- ab welchem Jahr wird Fahrzeug A guenstiger als Fahrzeug B

Die Ergebnisbeschreibung ist ebenfalls auf Fahrzeug A als den spaeter guenstigeren Gewinner ausgerichtet.

Folge:

- Fuer `EV vs. ICE` ist das noch akzeptabel, solange Slot A immer das EV ist.
- Fuer `EV vs. EV` ist die Logik zu einseitig.

## Aktuelles Strukturproblem im Rechner

Der Rechner mischt heute drei Ebenen:

- Fahrzeugdaten aus der Datenbank
- editierbare Kostenparameter pro Slot
- abgeleitete Ergebnislogik

Das fuehrt aktuell zu einem fachlich unsauberen Zustand:

- Kaufpreis steckt gleichzeitig im Fahrzeug und in den Parametern
- Verbrauch kommt aus dem Fahrzeug
- Foerderung, Restwert, Versicherung und Wartung kommen aus den Parametern
- Standard- und Expertenmodus sind nur UI-Zustaende, aber kein sauberes Datenmodell

Fuer den Umbau bedeutet das:

- der neue Rechner braucht ein explizites Eingabemodell
- Standardwerte muessen von Nutzer-Overrides getrennt werden
- Fahrzeugdaten duplizieren sich nicht mehr unkontrolliert in den Parametern

## Schutzliste fuer den Umbau

Die folgenden Flows muessen beim Umbau erhalten oder gezielt verbessert werden:

1. `EV-Karte -> Rechner`
   - EV muss weiterhin direkt in Slot A landen.

2. `ICE-Karte -> Rechner`
   - ICE muss weiterhin direkt in Slot B landen.
   - zusaetzlich sollte der Flow gefuehrter werden.

3. `EV vs. EV`
   - zwei EVs muessen weiterhin vergleichbar bleiben.

4. `manuelle ICE-Eingabe`
   - muss fuer Slot B erhalten bleiben.

5. `Live-Update der Ergebnisse`
   - jede relevante Eingabe muss weiterhin sofort die KPIs und Diagramme aktualisieren.

6. `URL-basierte Vorbelegung`
   - Query-Parameter duerfen beim Umbau nicht verloren gehen.

7. `Defaults + Nutzerwerte`
   - Defaults muessen sauber vorbelegt sein.
   - Nutzerwerte muessen sichtbar und verlässlich ueberschreiben.

## Konsequenz fuer Phase 2

Der Rechner sollte im naechsten Schritt nicht nur optisch erweitert werden.
Er braucht zuerst ein sauberes Eingabemodell mit klarer Trennung von:

- Fahrzeugdaten
- Standardannahmen
- Nutzer-Overrides
- Ergebnisableitung

Ohne diese Trennung wuerden neue Features wie Fahrprofil, Ladeprofil, Finanzierung oder Sensitivitaetsanalyse nur neue Inkonsistenzen auf die bestehende Struktur stapeln.

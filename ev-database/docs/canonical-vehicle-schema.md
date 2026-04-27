# Canonical Vehicle Schema

Version: `2026-04-24`

Die aktive Schema-Quelle fuer Fahrzeugfelder liegt im Code unter:

- `src/entities/vehicle/vehicleFields.js`

## Ziel

Alle neuen Features, Admin-Formulare, Importe, Karten, Detailansichten und TCO-Berechnungen sollen nur noch mit kanonischen Feldnamen arbeiten.

Legacy- oder Import-Namen wie `preis_de`, `reichweite_wltp`, `akku_kapazitaet_kwh` oder `verbrauch_l100km` sind nur noch Eingangsformate und werden auf kanonische Keys normalisiert.

## Kanonische Basisfelder

- `marke`
- `modell`
- `markteinfuehrung`
- `basis_preis`
- `hoechster_preis`
- `bild_url`
- `null_hundert`
- `ps`
- `top_speed`
- `anhaengelast`

## EV-Felder

- `batterie_netto`
- `wltp_reichweite`
- `wltp_verbrauch`
- `volt`
- `laden_ac_kw`
- `laden_dc_kw`
- `max_ladeleistung`
- `laden_10_80_min`
- `kwh_nach_70`
- `kwh_pro_min`
- `leistung_kw`

## ICE-Felder

- `kraftstoff`
- `verbrauch_l_100km`
- `co2_g_km`
- `hubraum_ccm`
- `zylinder`
- `getriebe`

## Detail-/Strukturfelder

- `laenge_mm`
- `breite_mm`
- `hoehe_mm`
- `radstand_mm`
- `gewicht_leer_kg`
- `zul_gesamtgewicht_kg`
- `zuladung_kg`
- `anhaengelast_ungebremst_kg`
- `kofferraum_l`
- `kofferraum_max_l`
- `frunk_l`
- `dachlast_kg`
- `sitze`
- `isofix`
- `wendekreis_m`
- `karosserie`
- `segment`
- `plattform`
- `waermepumpe`

## Regeln

- Neue Logik schreibt nur kanonische Felder.
- UI-Komponenten lesen nur kanonische Felder.
- Legacy-Aliase leben nur in der Mapping-/Normalisierungsschicht.
- `src/entities/vehicle/fields.js` leitet Formular- und Kartenfelder aus dem kanonischen Schema ab.
- `src/entities/vehicle/vehicleSchema.js` liest alte Feldnamen und schreibt sie auf kanonische Keys um.

---
type: decision
tags: [firebase, datenbank, infrastruktur]
last_updated: 2026-04-17
---

*EN: Decision to use Firebase Firestore as the primary database for ev-vergleich.*

# Firebase als Datenbank

**Datum:** 2026-04-17  
**Status:** entschieden

## Kontext

Für ev-vergleich wird eine Datenbank benötigt, die Real-time-Updates unterstützt,
einfach zu authentifizieren ist und für kleine Projekte kostenlos bleibt.

## Entscheidung

Firebase Firestore wird als primäre Datenbank verwendet.

## Alternativen

- Supabase — ähnliche Features, aber weniger Erfahrung im Team
- Lokale JSON-Datei — keine Real-time-Updates möglich

## Konsequenzen

- Firestore-spezifische Query-Syntax muss beherrscht werden
- Offline-Fähigkeit durch Firestore-SDK eingebaut
- Kosten steigen bei sehr hohem Datenvolumen

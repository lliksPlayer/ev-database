import {
  Gauge, Timer, Zap, Leaf, Tag, Rocket, Flame, Wind,
  Battery, Truck, Calendar, Car, CircuitBoard, TrendingDown
} from 'lucide-react'

// Maps Firestore field keys → { icon: LucideComponent, color: string }
const FIELD_META = {
  wltp_reichweite:  { icon: Gauge,        color: '#3b82f6' },
  reichweite_wltp:  { icon: Gauge,        color: '#3b82f6' },
  laden_10_80_min:  { icon: Timer,        color: '#f59e0b' },
  ladezeit_10_80_min: { icon: Timer,      color: '#f59e0b' },
  kwh_nach_70:      { icon: Leaf,         color: '#10b981' },
  kwh_pro_min:      { icon: Zap,          color: '#f59e0b' },
  max_ladeleistung: { icon: Zap,          color: '#f59e0b' },
  laden_dc_kw:      { icon: Zap,          color: '#f59e0b' },
  anhaengelast:     { icon: Truck,        color: '#84cc16' },
  wltp_verbrauch:   { icon: TrendingDown, color: '#10b981' },
  verbrauch_l_100km:{ icon: TrendingDown, color: '#10b981' },
  verbrauch_l100km: { icon: TrendingDown, color: '#10b981' },
  basis_preis:      { icon: Tag,          color: '#06b6d4' },
  preis_de:         { icon: Tag,          color: '#06b6d4' },
  hoechster_preis:  { icon: Tag,          color: '#06b6d4' },
  null_hundert:     { icon: Rocket,       color: '#f43f5e' },
  beschleunigung_sec: { icon: Rocket,     color: '#f43f5e' },
  ps:               { icon: Flame,        color: '#ef4444' },
  top_speed:        { icon: Wind,         color: '#14b8a6' },
  hoechstgeschwindigkeit_kmh: { icon: Wind, color: '#14b8a6' },
  volt:             { icon: CircuitBoard, color: '#a855f7' },
  architektur_volt: { icon: CircuitBoard, color: '#a855f7' },
  batterie_netto:   { icon: Battery,      color: '#8b5cf6' },
  akku_kapazitaet_kwh: { icon: Battery,   color: '#8b5cf6' },
  markteinfuehrung: { icon: Calendar,     color: '#64748b' },
  baujahr:          { icon: Calendar,     color: '#64748b' },
}

const DEFAULT_META = { icon: Car, color: '#64748b' }

/** Returns { icon, color } for a given Firestore field key. Falls back gracefully. */
export function getFieldMeta(key) {
  return FIELD_META[key] ?? DEFAULT_META
}
